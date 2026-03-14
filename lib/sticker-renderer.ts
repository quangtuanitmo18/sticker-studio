/**
 * Offscreen sticker renderer
 * Renders RPM avatar with blendshape presets, body poses, text & overlays
 *
 * Architecture:
 * 1. Load GLB once
 * 2. For each sticker: clone → apply blendshapes → apply bones → render → overlay
 */

import * as THREE from 'three'
import { GLTFLoader, SkeletonUtils } from 'three-stdlib'
import type { ExpressionPreset } from '@/lib/sticker-presets'
import type { BodyPose } from '@/lib/sticker-body-poses'
import type { StickerOverlay } from '@/lib/sticker-overlays'
import { downloadBlob } from '@/lib/download'

// ─── Types ───────────────────────────────────────────────────

export interface StickerOutput {
  id: string
  emoji: string
  label: string
  dataUrl: string
  blob: Blob
}

export interface StickerConfig {
  expression: ExpressionPreset
  pose?: BodyPose
  text?: string
  overlay?: StickerOverlay
  customBlendshapes?: Record<string, number>
}

export interface RenderOptions {
  width?: number
  height?: number
  transparent?: boolean
}

// ─── Constants ───────────────────────────────────────────────

const DEFAULT_SIZE = 512
const CAMERA_FOV = 35

// ─── Lighting setup (reusable) ───────────────────────────────

function createLighting(): THREE.Object3D[] {
  const lights: THREE.Object3D[] = []

  lights.push(new THREE.AmbientLight(0xffffff, 0.7))

  const dir1 = new THREE.DirectionalLight(0xffffff, 1.2)
  dir1.position.set(5, 8, 5)
  lights.push(dir1)

  const dir2 = new THREE.DirectionalLight(0xffffff, 0.4)
  dir2.position.set(-3, 4, -4)
  lights.push(dir2)

  const point = new THREE.PointLight(0xffffff, 0.5)
  point.position.set(0, 3, 4)
  lights.push(point)

  lights.push(new THREE.HemisphereLight(0xb1e1ff, 0xb97a20, 0.25))

  return lights
}

// ─── Apply blendshapes to model ──────────────────────────────

function applyBlendshapes(
  model: THREE.Object3D,
  blendshapes: Record<string, number>,
) {
  model.traverse((child) => {
    if (
      child instanceof THREE.Mesh &&
      child.morphTargetInfluences &&
      child.morphTargetDictionary
    ) {
      // Reset
      child.morphTargetInfluences.fill(0)

      // Apply
      for (const [name, value] of Object.entries(blendshapes)) {
        const idx = child.morphTargetDictionary[name]
        if (idx !== undefined) {
          child.morphTargetInfluences[idx] = value
        }
      }
    }
  })
}

// ─── Apply bone rotations to model ──────────────────────────

let _boneNamesLogged = false

function applyBonePose(
  model: THREE.Object3D,
  bones: Record<string, { x: number; y: number; z: number }>,
) {
  if (Object.keys(bones).length === 0) return

  // Force matrix update before modifying bones
  model.updateWorldMatrix(true, true)
  model.updateMatrixWorld(true)

  // Collect all bone names for matching
  const allBones: THREE.Bone[] = []
  model.traverse((child) => {
    if (child instanceof THREE.Bone) {
      allBones.push(child)
    }
  })

  // Debug: log bone names once
  if (!_boneNamesLogged) {
    console.log('[Sticker Pose] Model bones:', allBones.map((b) => b.name))
    _boneNamesLogged = true
  }

  // Apply rotations using QUATERNION MULTIPLICATION
  // This correctly composes rotations in the bone's local frame,
  // unlike Euler addition which breaks due to gimbal/order issues.
  let appliedCount = 0
  for (const [targetName, rot] of Object.entries(bones)) {
    const bone = allBones.find(
      (b) => b.name === targetName || b.name.endsWith(targetName),
    )
    if (bone) {
      // Create delta quaternion from the desired local rotation
      const deltaQuat = new THREE.Quaternion().setFromEuler(
        new THREE.Euler(rot.x, rot.y, rot.z, 'XYZ'),
      )

      // Multiply: existing * delta = rotation applied in LOCAL bone frame
      bone.quaternion.multiply(deltaQuat)

      const after = new THREE.Euler().setFromQuaternion(bone.quaternion, 'XYZ')
      console.log(
        `[Sticker Pose] ${bone.name}: delta(${(rot.x*180/Math.PI).toFixed(1)}°,${(rot.y*180/Math.PI).toFixed(1)}°,${(rot.z*180/Math.PI).toFixed(1)}°) → final(${(after.x*180/Math.PI).toFixed(1)}°,${(after.y*180/Math.PI).toFixed(1)}°,${(after.z*180/Math.PI).toFixed(1)}°)`,
      )
      appliedCount++
    } else {
      console.warn(`[Sticker Pose] ⚠ Bone not found: "${targetName}"`)
    }
  }

  // Force skeleton update after pose changes
  model.updateWorldMatrix(true, true)
  model.updateMatrixWorld(true)

  console.log(`[Sticker Pose] Applied ${appliedCount}/${Object.keys(bones).length} bone rotations (quaternion multiply)`)
}

// ─── Camera auto-framing using FOV math ──────────────────────

type FrameMode = 'face' | 'half' | 'upper' | 'full'

/**
 * Mathematically compute camera position to perfectly frame a
 * vertical region of the model.
 *
 * Uses FOV trigonometry:
 *   visible_height = 2 * z * tan(fov/2)
 *   z = visible_height / (2 * tan(fov/2))
 *
 * This guarantees the model region fits in the viewport with
 * no guesswork, regardless of avatar height/proportions.
 */
function autoFrameCamera(
  model: THREE.Object3D,
  mode: FrameMode,
  aspect: number,
): THREE.PerspectiveCamera {
  // Force world matrix update (required after rotation)
  model.updateWorldMatrix(true, true)
  model.updateMatrixWorld(true)

  const box = new THREE.Box3().setFromObject(model)
  const modelTop = box.max.y
  const modelBottom = box.min.y
  const modelHeight = modelTop - modelBottom

  // Define vertical region to show (from top down)
  let regionTop: number
  let regionBottom: number
  let paddingFactor: number // extra margin around region

  switch (mode) {
    case 'face':
      // Show top 22% of model (head closeup)
      regionTop = modelTop
      regionBottom = modelTop - modelHeight * 0.22
      paddingFactor = 0.25 // 25% margin so head isn't clipped
      break
    case 'half':
      // Show top 45% of model (head + shoulders + upper chest)
      regionTop = modelTop
      regionBottom = modelTop - modelHeight * 0.45
      paddingFactor = 0.15
      break
    case 'upper':
      // Show top 70% of model (head + torso + arms)
      regionTop = modelTop
      regionBottom = modelTop - modelHeight * 0.70
      paddingFactor = 0.10
      break
    case 'full':
      // Show entire model
      regionTop = modelTop
      regionBottom = modelBottom
      paddingFactor = 0.12
      break
  }

  // Add padding to prevent clipping
  const regionHeight = regionTop - regionBottom
  const totalHeight = regionHeight * (1 + paddingFactor * 2)
  const regionCenterY = (regionTop + regionBottom) / 2

  // Compute exact z distance using FOV trigonometry
  const halfFovRad = ((CAMERA_FOV / 2) * Math.PI) / 180
  const camZ = (totalHeight / 2) / Math.tan(halfFovRad)

  // Camera slightly above center for natural downward angle
  const camY = regionCenterY + regionHeight * 0.05

  // Debug logging (remove in production)
  console.log(`[Sticker Camera] mode=${mode} headTop=${modelTop.toFixed(3)} height=${modelHeight.toFixed(3)} region=${regionHeight.toFixed(3)} camZ=${camZ.toFixed(3)} camY=${camY.toFixed(3)}`)

  const camera = new THREE.PerspectiveCamera(CAMERA_FOV, aspect, 0.01, 100)
  camera.position.set(0, camY, camZ)
  camera.lookAt(0, regionCenterY, 0)

  return camera
}

// ─── Map preset camera types to frame modes ──────────────────

function getFrameMode(config: StickerConfig): FrameMode {
  // Pose camera is the primary source of truth
  if (config.pose && config.pose.id !== 'neutral') {
    return config.pose.camera === 'full' ? 'full' : 'upper'
  }
  // Neutral pose → consistent 'half' framing (head + shoulders)
  // Avoids jarring face↔half switches when changing expression
  return 'half'
}

// ─── Core: render sticker pack ───────────────────────────────

export async function renderStickerPack(
  avatarUrl: string,
  configs: StickerConfig[],
  options: RenderOptions = {},
  onProgress?: (index: number, total: number) => void,
): Promise<StickerOutput[]> {
  const width = options.width ?? DEFAULT_SIZE
  const height = options.height ?? DEFAULT_SIZE
  const transparent = options.transparent ?? true

  // 1. Load model once
  const loader = new GLTFLoader()
  const gltf = await loader.loadAsync(avatarUrl)

  // 2. Create renderer once
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: transparent,
    preserveDrawingBuffer: true,
  })
  renderer.setSize(width, height)
  renderer.setPixelRatio(2)
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1

  const stickers: StickerOutput[] = []

  for (let i = 0; i < configs.length; i++) {
    const config = configs[i]
    onProgress?.(i, configs.length)

    // 3. Build scene
    const scene = new THREE.Scene()
    createLighting().forEach((l) => scene.add(l))

    // 4. Clone avatar with PROPER skeleton binding
    // SkeletonUtils.clone() rebinds SkinnedMesh to cloned bones
    // (Object3D.clone() breaks skeleton → bone rotations have no visual effect)
    const clone = SkeletonUtils.clone(gltf.scene) as THREE.Group

    // 5. Apply blendshapes (preset + custom overrides)
    const mergedBlendshapes = {
      ...config.expression.blendshapes,
      ...(config.customBlendshapes ?? {}),
    }
    applyBlendshapes(clone, mergedBlendshapes)

    // 6. Apply body pose if any
    if (config.pose && Object.keys(config.pose.bones).length > 0) {
      applyBonePose(clone, config.pose.bones)
    }

    // Clone materials
    clone.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material) {
        child.material = (child.material as THREE.Material).clone()
      }
    })

    scene.add(clone)

    // 7. Auto-frame camera based on model bounding box
    const frameMode = getFrameMode(config)
    const camera = autoFrameCamera(clone, frameMode, width / height)

    // 8. Render
    renderer.render(scene, camera)

    // 9. Post-process: overlays + text via Canvas2D
    const finalCanvas = document.createElement('canvas')
    finalCanvas.width = width
    finalCanvas.height = height
    const ctx = finalCanvas.getContext('2d')!

    // Draw 3D render
    ctx.drawImage(renderer.domElement, 0, 0, width, height)

    // Draw overlay
    if (config.overlay && config.overlay.id !== 'none') {
      config.overlay.draw(ctx, width, height)
    }

    // Draw text
    if (config.text) {
      drawText(ctx, config.text, width, height)
    }

    // 10. Capture
    const blob = await new Promise<Blob>((resolve, reject) => {
      finalCanvas.toBlob(
        (b) => {
          if (b) resolve(b)
          else reject(new Error(`Failed to capture: ${config.expression.id}`))
        },
        'image/png',
      )
    })

    stickers.push({
      id: config.expression.id,
      emoji: config.expression.emoji,
      label: config.expression.label,
      dataUrl: URL.createObjectURL(blob),
      blob,
    })

    scene.clear()
  }

  renderer.dispose()
  onProgress?.(configs.length, configs.length)
  return stickers
}

// ─── Render single sticker (for live preview) ────────────────

export async function renderSingleSticker(
  avatarUrl: string,
  config: StickerConfig,
  options: RenderOptions = {},
): Promise<StickerOutput> {
  const results = await renderStickerPack(avatarUrl, [config], options)
  return results[0]
}

// ─── Text drawing helper ─────────────────────────────────────

function drawText(
  ctx: CanvasRenderingContext2D,
  text: string,
  w: number,
  h: number,
) {
  const fontSize = Math.floor(w * 0.12)
  ctx.font = `bold ${fontSize}px Impact, 'Arial Black', sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'bottom'

  const x = w / 2
  const y = h - 12

  ctx.shadowColor = 'rgba(0, 0, 0, 0.6)'
  ctx.shadowBlur = 6
  ctx.shadowOffsetY = 2

  ctx.strokeStyle = '#000000'
  ctx.lineWidth = 4
  ctx.lineJoin = 'round'
  ctx.strokeText(text, x, y)

  ctx.shadowBlur = 0
  ctx.shadowOffsetY = 0
  ctx.fillStyle = '#ffffff'
  ctx.fillText(text, x, y)
}

// ─── Text overlay (for standalone use) ──────────────────────

export async function addTextOverlay(
  imageBlob: Blob,
  text: string,
  size = DEFAULT_SIZE,
): Promise<Blob> {
  const img = await createImageBitmap(imageBlob)
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!

  ctx.drawImage(img, 0, 0, size, size)
  drawText(ctx, text, size, size)

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('Text overlay failed'))),
      'image/png',
    )
  })
}

// ─── ZIP export ──────────────────────────────────────────────

export async function downloadStickerZip(stickers: StickerOutput[]): Promise<void> {
  const JSZip = (await import('jszip')).default
  const zip = new JSZip()

  for (const sticker of stickers) {
    zip.file(`sticker_${sticker.id}.png`, sticker.blob)
  }

  const zipBlob = await zip.generateAsync({ type: 'blob' })
  downloadBlob(zipBlob, 'sticker-pack.zip')
}
