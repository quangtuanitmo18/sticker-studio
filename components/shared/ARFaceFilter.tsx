'use client'

import type { ARFilter } from '@/lib/ar-filters'
import { useCallback, useEffect, useImperativeHandle, useRef, useState, forwardRef } from 'react'

export interface ARFaceFilterHandle {
  captureFrame: () => HTMLCanvasElement | null
  stop: () => void
}

interface ARFaceFilterProps {
  activeFilters: ARFilter[]
  className?: string
  onReady?: () => void
  onError?: (error: string) => void
  onLoading?: (loading: boolean) => void
}

// ─── CDN loader ──────────────────────────────────────────────

// Suppress harmless TensorFlow / MediaPipe C++ logs that spawn red error overlays in Next.js dev mode
if (typeof window !== 'undefined') {
  const _error = console.error;
  console.error = (...args) => {
    if (typeof args[0] === 'string' && args[0].includes('XNNPACK')) return;
    _error.apply(console, args);
  };
  const _warn = console.warn;
  console.warn = (...args) => {
    if (typeof args[0] === 'string' && args[0].includes('XNNPACK')) return;
    _warn.apply(console, args);
  };
}

let _cache: { MindARThree: any; THREE: any } | null = null

async function loadMindAR(): Promise<{ MindARThree: any; THREE: any }> {
  if (_cache) return _cache
  const [threeModule, mindarModule] = await Promise.all([
    import(/* webpackIgnore: true */ 'three'),
    // @ts-ignore: No types available for mindar-face-three CDN module
    import(/* webpackIgnore: true */ 'mindar-face-three'),
  ])
  _cache = { THREE: threeModule, MindARThree: mindarModule.MindARThree }
  return _cache
}

// ─── Component ───────────────────────────────────────────────

const ARFaceFilter = forwardRef<ARFaceFilterHandle, ARFaceFilterProps>(
  ({ activeFilters, className = '', onReady, onError, onLoading }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null)
    const mindarRef = useRef<any>(null)
    const anchorsRef = useRef<Map<number, any>>(new Map())
    const meshesRef = useRef<Map<string, any>>(new Map())
    const faceMeshRef = useRef<any>(null)
    const faceMeshFilterIdRef = useRef<string | null>(null)
    const occluderMeshRef = useRef<any>(null)
    const THREERef = useRef<any>(null)

    // Use STATE for isRunning so filter sync useEffect retriggers when AR starts
    const [isRunning, setIsRunning] = useState(false)

    const disposeMesh = useCallback((mesh: any) => {
      if (!mesh) return
      mesh.parent?.remove(mesh)
      mesh.geometry?.dispose()
      mesh.material?.map?.dispose()
      mesh.material?.dispose()
    }, [])

    const cleanup = useCallback(() => {
      if (mindarRef.current) {
        try {
          mindarRef.current.stop()
          mindarRef.current.renderer?.setAnimationLoop(null)
        } catch { /* already stopped */ }
        mindarRef.current = null
      }
      meshesRef.current.forEach(disposeMesh)
      meshesRef.current.clear()
      anchorsRef.current.clear()
      // Don't disposeMesh the faceMesh — MindAR owns it internally
      faceMeshRef.current = null
      if (occluderMeshRef.current) {
        disposeMesh(occluderMeshRef.current)
        occluderMeshRef.current = null
      }
      setIsRunning(false)
    }, [disposeMesh])

    // ─── Start AR ──────────────────────────────────────────────
    const startAR = useCallback(async () => {
      if (!containerRef.current) return

      onLoading?.(true)
      try {
        const { MindARThree, THREE } = await loadMindAR()
        THREERef.current = THREE

        const mindarThree = new MindARThree({ container: containerRef.current })
        mindarRef.current = mindarThree

        const { renderer, scene, camera } = mindarThree
        
        // Comprehensive lighting for 3D GLTF models (PBR materials need directional specular)
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
        scene.add(ambientLight)
        
        const dirLight = new THREE.DirectionalLight(0xffffff, 0.8)
        dirLight.position.set(0, 5, 5)
        scene.add(dirLight)

        const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.4)
        scene.add(hemiLight)

        await mindarThree.start()
        setIsRunning(true)

        // Hide MindAR's built-in loading overlay after AR starts
        const overlay = containerRef.current?.querySelector?.('[id*="mindar"], [class*="mindar"]') as HTMLElement | null
        if (overlay) overlay.style.display = 'none'

        // CRITICAL: preserve WebGL buffer after each frame so captureFrame() can read it
        renderer.preserveDrawingBuffer = true

        renderer.setAnimationLoop(() => renderer.render(scene, camera))
        onReady?.()
      } catch (err: any) {
        console.error('AR start error:', err)
        onError?.(err?.message || 'Failed to start AR')
      } finally {
        onLoading?.(false)
      }
    }, [onReady, onError, onLoading])

    // ─── Occluder Mesh — Invisible depth mask ──────────────────
    const setupOccluder = useCallback(() => {
      const THREE = THREERef.current
      if (!THREE || !mindarRef.current || occluderMeshRef.current) return

      // Creates a face mesh that writes ONLY to the depth buffer.
      // Objects rendered behind this mesh (e.g. glasses temples behind ears) will be hidden!
      const occluder = mindarRef.current.addFaceMesh()
      occluder.material.colorWrite = false
      // Push slightly back so it doesn't clip with overlays on the very front
      occluder.position.z = -0.05
      mindarRef.current.scene.add(occluder)
      occluderMeshRef.current = occluder
    }, [])
    const getAnchor = useCallback((index: number) => {
      if (!mindarRef.current) return null
      if (anchorsRef.current.has(index)) return anchorsRef.current.get(index)
      const anchor = mindarRef.current.addAnchor(index)
      anchorsRef.current.set(index, anchor)
      return anchor
    }, [])

    // ─── Face Mesh — paint texture onto face surface ───────────
    const applyFaceMesh = useCallback((textureUrl: string) => {
      const THREE = THREERef.current
      if (!THREE || !mindarRef.current) return

      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => {
        // Create texture from image
        const canvas = document.createElement('canvas')
        canvas.width = 512
        canvas.height = 512
        const ctx = canvas.getContext('2d')!
        ctx.drawImage(img, 0, 0, 512, 512)
        const texture = new THREE.CanvasTexture(canvas)
        texture.needsUpdate = true
        texture.colorSpace = THREE.SRGBColorSpace

        if (faceMeshRef.current) {
          // If face mesh already exists, just update its texture
          faceMeshRef.current.material.map = texture
          faceMeshRef.current.material.transparent = true
          faceMeshRef.current.material.opacity = 0.75
          faceMeshRef.current.material.needsUpdate = true
        } else {
          // Create new face mesh
          const faceMesh = mindarRef.current.addFaceMesh()
          faceMesh.material.map = texture
          faceMesh.material.transparent = true
          faceMesh.material.opacity = 0.75
          faceMesh.material.needsUpdate = true
          // CRITICAL: We must add the face mesh to the scene manually!
          mindarRef.current.scene.add(faceMesh)
          faceMeshRef.current = faceMesh
        }
      }
      img.onerror = () => console.warn('Failed to load face mesh texture:', textureUrl)
      img.src = textureUrl
    }, [])

    // ─── Remove face mesh texture ──────────────────────────────
    const removeFaceMesh = useCallback(() => {
      if (faceMeshRef.current) {
        faceMeshRef.current.material.map = null
        faceMeshRef.current.material.needsUpdate = true
        // Remove from parent — MindAR auto-adds it so we need to detach
        faceMeshRef.current.parent?.remove(faceMeshRef.current)
        faceMeshRef.current.geometry?.dispose()
        faceMeshRef.current.material?.dispose()
        faceMeshRef.current = null
        faceMeshFilterIdRef.current = null
      }
    }, [])

    // ─── Overlay — 2D image plane on face anchor ───────────────
    const createOverlayMesh = useCallback(async (filter: ARFilter) => {
      const THREE = THREERef.current
      if (!THREE || !filter.imageUrl) return null

      return new Promise<any>((resolve) => {
        const img = new Image()
        img.crossOrigin = 'anonymous'
        img.onload = () => {
          const canvas = document.createElement('canvas')
          canvas.width = 256
          canvas.height = 256
          const ctx = canvas.getContext('2d')!
          ctx.drawImage(img, 0, 0, 256, 256)

          const texture = new THREE.CanvasTexture(canvas)
          texture.needsUpdate = true
          const geometry = new THREE.PlaneGeometry(filter.scale, filter.scale)
          const material = new THREE.MeshBasicMaterial({
            map: texture,
            transparent: true,
            side: THREE.DoubleSide,
            depthWrite: false,
          })
          const mesh = new THREE.Mesh(geometry, material)
          if (filter.offsetY) mesh.position.y = filter.offsetY
          if (filter.rotation) mesh.rotation.set(...filter.rotation)
          resolve(mesh)
        }
        img.onerror = () => {
          const geo = new THREE.SphereGeometry(filter.scale * 0.3, 16, 16)
          const mat = new THREE.MeshBasicMaterial({ color: 0xff6b4a, transparent: true, opacity: 0.6 })
          resolve(new THREE.Mesh(geo, mat))
        }
        img.src = filter.imageUrl!
      })
    }, [])

    // ─── GLTF Model — load 3D accessories ──────────────────────
    const createModelMesh = useCallback(async (filter: ARFilter) => {
      const THREE = THREERef.current
      if (!THREE) return null

      // Build programmatic 3D glasses as a fallback / demo if no valid modelUrl is provided
      const createFallbackGlasses = () => {
        const group = new THREE.Group()
        // Shiny dark plastic material
        const material = new THREE.MeshPhysicalMaterial({ 
          color: 0x111111, metalness: 0.9, roughness: 0.1, clearcoat: 1.0, transparent: true, opacity: 0.9 
        })
        const glassMat = new THREE.MeshPhysicalMaterial({ 
          color: 0x000000, metalness: 0.1, roughness: 0.1, transparent: true, opacity: 0.7 
        })
        
        // Frames
        const frameGeo = new THREE.TorusGeometry(0.22, 0.04, 16, 100)
        const leftFrame = new THREE.Mesh(frameGeo, material)
        const rightFrame = new THREE.Mesh(frameGeo, material)
        leftFrame.position.set(-0.25, 0, 0)
        rightFrame.position.set(0.25, 0, 0)
        
        // Lenses
        const lensGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.02, 32)
        lensGeo.rotateX(Math.PI / 2)
        const leftLens = new THREE.Mesh(lensGeo, glassMat)
        const rightLens = new THREE.Mesh(lensGeo, glassMat)
        leftLens.position.set(-0.25, 0, 0)
        rightLens.position.set(0.25, 0, 0)
        
        // Bridge
        const bridgeGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.15, 8)
        bridgeGeo.rotateZ(Math.PI / 2)
        const bridge = new THREE.Mesh(bridgeGeo, material)
        
        // Temples (gọng kính) - these extend back past the ears!
        // The Head Occluder will hide the back half of these so they don't render over the hair.
        const templeGeo = new THREE.CylinderGeometry(0.02, 0.02, 1.2, 8)
        templeGeo.rotateX(Math.PI / 2)
        
        const leftTemple = new THREE.Mesh(templeGeo, material)
        leftTemple.position.set(-0.47, 0, -0.6)
        
        const rightTemple = new THREE.Mesh(templeGeo, material)
        rightTemple.position.set(0.47, 0, -0.6)

        group.add(leftFrame, rightFrame, leftLens, rightLens, bridge, leftTemple, rightTemple)
        
        // The fallback glasses are visually large relative to the 1.0 unit scale.
        // We multiply by a smaller factor so they fit the face (width ~0.15m) normally.
        const s = filter.scale * 0.05
        group.scale.set(s, s, s)
        if (filter.offsetY) group.position.y = filter.offsetY
        if (filter.rotation) group.rotation.set(...filter.rotation)
        
        return group
      }

      if (!filter.modelUrl) {
        return createFallbackGlasses()
      }

      return new Promise<any>(async (resolve) => {
        try {
          const { GLTFLoader } = await import(/* webpackIgnore: true */ 'three/addons/loaders/GLTFLoader.js')
          const loader = new GLTFLoader()
          
          const url = filter.modelUrl!
          loader.load(
            url,
            (gltf: any) => {
              const model = gltf.scene || gltf.scenes[0]
              
              // Tự động tính toán Bounding Box
              const box = new THREE.Box3().setFromObject(model)
              const size = box.getSize(new THREE.Vector3())
              const center = box.getCenter(new THREE.Vector3())
              
              // Đưa tâm hình học (geometric center) của kính về ngay vị trí (0,0,0) của anchor!
              // Giúp kính tự động căn vào giữa sống mũi thay vì bay tít lên trán.
              model.position.set(-center.x, -center.y, -center.z)
              
              // Nhóm lại để scale tổng thể mà không làm hỏng tọa độ position vừa set
              const group = new THREE.Group()
              group.add(model)
              
              // Chuẩn hóa chiều rộng về 1.0, sau đó nhân với filter.scale
              const baseScale = size.x > 0 ? 1.0 / size.x : 1.0
              const finalScale = baseScale * filter.scale
              group.scale.set(finalScale, finalScale, finalScale)
              
              // Dịch y, z thêm tùy chọn nếu muốn
              if (filter.offsetY) group.position.y = filter.offsetY
              if (filter.offsetZ) group.position.z = filter.offsetZ
              if (filter.rotation) group.rotation.set(...filter.rotation)
              resolve(group)
            },
            undefined,
            (err: any) => {
              console.error('GLTF load error for', filter.modelUrl, err)
              // Fallback to 3D primitive if load fails
              resolve(createFallbackGlasses())
            }
          )
        } catch (err) {
          console.error('GLTFLoader import error', err)
          resolve(createFallbackGlasses())
        }
      })
    }, [])

    // ─── Sync filters ↔ scene ──────────────────────────────────
    // Using `isRunning` STATE (not ref) so this re-triggers when AR starts
    useEffect(() => {
      if (!isRunning || !mindarRef.current) return

      const currentIds = new Set(meshesRef.current.keys())
      const targetIds = new Set(activeFilters.map(f => f.id))
      const activeFaceMesh = activeFilters.find(f => f.type === 'facemesh')

      // Remove deactivated overlay meshes
      for (const id of currentIds) {
        if (!targetIds.has(id)) {
          disposeMesh(meshesRef.current.get(id))
          meshesRef.current.delete(id)
        }
      }

      // Handle face mesh — only one at a time
      if (activeFaceMesh && activeFaceMesh.textureUrl) {
        if (faceMeshFilterIdRef.current !== activeFaceMesh.id) {
          faceMeshFilterIdRef.current = activeFaceMesh.id
          applyFaceMesh(activeFaceMesh.textureUrl)
        }
      } else if (faceMeshRef.current) {
        removeFaceMesh()
      }

      // Add new overlay meshes
      for (const filter of activeFilters) {
        if (filter.type === 'facemesh') continue
        if (!meshesRef.current.has(filter.id) && filter.anchorIndex != null) {
          const createFn = filter.type === 'model' ? createModelMesh : createOverlayMesh
          createFn(filter).then(mesh => {
            if (!mesh || !isRunning) return
            const anchor = getAnchor(filter.anchorIndex!)
            if (anchor) {
              // Ensure occluder is ready before showing 3D objects
              if (!occluderMeshRef.current) setupOccluder()
              anchor.group.add(mesh)
              meshesRef.current.set(filter.id, mesh)
            }
          })
        }
      }
    }, [activeFilters, isRunning, createOverlayMesh, getAnchor, disposeMesh, applyFaceMesh, removeFaceMesh])

    // ─── Lifecycle ─────────────────────────────────────────────
    useEffect(() => {
      startAR()
      return cleanup
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    // ─── Imperative handle ─────────────────────────────────────
    useImperativeHandle(ref, () => ({
      captureFrame: () => {
        if (!mindarRef.current?.renderer) return null
        const { renderer, scene, camera } = mindarRef.current
        renderer.render(scene, camera)
        const glCanvas = renderer.domElement as HTMLCanvasElement
        const video = containerRef.current?.querySelector('video')
        if (!video) return null

        // Output = đúng kích thước WebGL canvas (640x480 = AR tracker hệ tọa)
        const output = document.createElement('canvas')
        output.width = glCanvas.width
        output.height = glCanvas.height
        const ctx = output.getContext('2d')!

        // Cover-fit video vào output (màn AR đang crop video như này)
        const scale = Math.max(output.width / video.videoWidth, output.height / video.videoHeight)
        const vw = video.videoWidth * scale
        const vh = video.videoHeight * scale
        const vx = (output.width - vw) / 2
        const vy = (output.height - vh) / 2

        // Bước 1: Vẽ video VỚI FLIP ngang (vì video CSS có matrix(-1,0,0,1) = scaleX(-1))
        // Dùng save/restore để transform chỉ ảnh hưởng video, không ảnh hưởng bước vẽ tiếp theo
        ctx.save()
        ctx.translate(output.width, 0)
        ctx.scale(-1, 1)
        ctx.drawImage(video, vx, vy, vw, vh)
        ctx.restore()

        // Bước 2: Phủ WebGL overlay (không canvas, không có CSS transform — pixel data ở space gốc)
        // Lủc khanh đưa vào đúng tọa độ chẳn khính trên video đã flip
        ctx.drawImage(glCanvas, 0, 0)

        return output
      },
      stop: cleanup,
    }), [cleanup])

    return (
      <>
        {/* Hide MindAR's default loading overlay via global CSS override */}
        <style>{`#mindar-ui-overlay, .mindar-ui-overlay { display: none !important; }`}</style>
        <div
          ref={containerRef}
          className={`relative w-full overflow-hidden ${className}`}
          style={{ aspectRatio: '4/3' }}
        />
      </>
    )
  },
)

ARFaceFilter.displayName = 'ARFaceFilter'
export default ARFaceFilter
