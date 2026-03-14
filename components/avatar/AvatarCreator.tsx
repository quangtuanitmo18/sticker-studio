'use client'

import * as React from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, PerspectiveCamera } from '@react-three/drei'
import {
  Download,
  Image as ImageIcon,
  RotateCcw,
  Pencil,
  Sparkles,
} from 'lucide-react'
import * as THREE from 'three'
import { GLTFExporter } from 'three-stdlib'
import { useRouter } from 'next/navigation'

import { AvatarModel } from '@/components/avatar/AvatarModel'
import { Loading } from '@/components/ui/Loading'
import { downloadBlob } from '@/lib/download'
import '@/components/avatar/rpm-creator.css'

// ─── Types ───────────────────────────────────────────────────

type Phase = 'create' | 'preview'

interface RPMEvent {
  source: string
  eventName: string
  data: {
    url?: string
  }
}

// ─── Constants ───────────────────────────────────────────────

const RPM_SUBDOMAIN = 'demo'
const RPM_IFRAME_URL = `https://${RPM_SUBDOMAIN}.readyplayer.me/avatar?frameApi`
const GLB_PARAMS = 'morphTargets=ARKit&textureAtlas=none&quality=high'

/** Fixed export settings */
const EXPORT_WIDTH = 2048
const EXPORT_HEIGHT = 2048
const EXPORT_CAMERA_POS = new THREE.Vector3(0, 0.7, 4.2)
const EXPORT_CAMERA_TARGET = new THREE.Vector3(0, 0.65, 0)
const EXPORT_CAMERA_FOV = 35

// ─── Export helpers ──────────────────────────────────────────

/**
 * Render avatar to a fixed-size offscreen canvas
 * → Always front-facing, fixed zoom, consistent output regardless of viewport
 */
function renderToOffscreen(
  avatarGroup: THREE.Group,
  format: 'png' | 'jpeg',
  transparent: boolean,
) {
  // 1. Create offscreen renderer
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: transparent,
    preserveDrawingBuffer: true,
  })
  renderer.setSize(EXPORT_WIDTH, EXPORT_HEIGHT)
  renderer.setPixelRatio(2)
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1

  // 2. Create fixed camera (always same angle & zoom)
  const camera = new THREE.PerspectiveCamera(
    EXPORT_CAMERA_FOV,
    EXPORT_WIDTH / EXPORT_HEIGHT,
    0.1,
    100,
  )
  camera.position.copy(EXPORT_CAMERA_POS)
  camera.lookAt(EXPORT_CAMERA_TARGET)

  // 3. Build export scene with same lighting
  const exportScene = new THREE.Scene()
  if (!transparent) {
    exportScene.background = new THREE.Color('#f0f0f5')
  }

  // Lighting (matches preview)
  exportScene.add(new THREE.AmbientLight(0xffffff, 0.6))
  const dirLight1 = new THREE.DirectionalLight(0xffffff, 1.2)
  dirLight1.position.set(5, 8, 5)
  exportScene.add(dirLight1)
  const dirLight2 = new THREE.DirectionalLight(0xffffff, 0.4)
  dirLight2.position.set(-3, 4, -4)
  exportScene.add(dirLight2)
  const pointLight = new THREE.PointLight(0xffffff, 0.5)
  pointLight.position.set(0, 3, 4)
  exportScene.add(pointLight)
  exportScene.add(new THREE.HemisphereLight(0xb1e1ff, 0xb97a20, 0.25))

  // 4. Clone the avatar into export scene with fixed position
  const avatarClone = avatarGroup.clone(true)
  // Reset any idle animation transforms — lock to front-facing
  avatarClone.rotation.set(0, Math.PI, 0)
  avatarClone.position.set(0, -0.95, 0)
  exportScene.add(avatarClone)

  // 5. Render
  renderer.render(exportScene, camera)

  // 6. Capture
  const canvas = renderer.domElement
  const mimeType = format === 'png' ? 'image/png' : 'image/jpeg'

  canvas.toBlob(
    (blob) => {
      if (blob) downloadBlob(blob, `avatar.${format}`)
      // Cleanup
      renderer.dispose()
      exportScene.clear()
    },
    mimeType,
    0.95,
  )
}

async function exportGLB(scene: THREE.Group) {
  const exporter = new GLTFExporter()
  const buffer = await exporter.parseAsync(scene, { binary: true })
  const blob = new Blob([buffer as ArrayBuffer], {
    type: 'model/gltf-binary',
  })
  downloadBlob(blob, 'avatar.glb')
}

// ─── Component ───────────────────────────────────────────────

export default function AvatarCreator() {
  const [phase, setPhase] = React.useState<Phase>('create')
  const [avatarUrl, setAvatarUrl] = React.useState<string | null>(null)
  const [isLoading, setIsLoading] = React.useState(false)
  const [transparentBg, setTransparentBg] = React.useState(false)

  const sceneRef = React.useRef<THREE.Group | null>(null)
  const iframeRef = React.useRef<HTMLIFrameElement | null>(null)

  // ─── RPM postMessage listener ──
  React.useEffect(() => {
    function handleMessage(event: MessageEvent) {
      const data = event.data as RPMEvent | string

      let parsed: RPMEvent | null = null
      if (typeof data === 'string') {
        try {
          parsed = JSON.parse(data)
        } catch {
          return
        }
      } else if (data && typeof data === 'object') {
        parsed = data
      }

      if (!parsed || parsed.source !== 'readyplayerme') return

      switch (parsed.eventName) {
        case 'v1.frame.ready':
          console.log('[RPM] iframe ready')
          iframeRef.current?.contentWindow?.postMessage(
            JSON.stringify({
              target: 'readyplayerme',
              type: 'subscribe',
              eventName: 'v1.**',
            }),
            '*',
          )
          break

        case 'v1.avatar.exported':
          if (parsed.data?.url) {
            console.log('[RPM] Avatar exported:', parsed.data.url)
            const url = `${parsed.data.url}?${GLB_PARAMS}`
            setAvatarUrl(url)
            setPhase('preview')
            setIsLoading(true)
          }
          break
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [])

  // ─── Export handlers (fixed camera + resolution) ──
  const handleExportPNG = React.useCallback(() => {
    if (sceneRef.current) renderToOffscreen(sceneRef.current, 'png', transparentBg)
  }, [transparentBg])

  const handleExportJPEG = React.useCallback(() => {
    if (sceneRef.current) renderToOffscreen(sceneRef.current, 'jpeg', false)
  }, [])

  const handleExportGLB = React.useCallback(async () => {
    if (sceneRef.current) await exportGLB(sceneRef.current)
  }, [])

  const handleEditAgain = React.useCallback(() => {
    setPhase('create')
    setIsLoading(false)
  }, [])

  const handleModelLoaded = React.useCallback((group: THREE.Group) => {
    sceneRef.current = group
    setIsLoading(false)
  }, [])

  // ─── Phase 1: RPM Creator ──
  if (phase === 'create') {
    return (
      <div className="rpm-creator-page">
        <header className="rpm-header">
          <div className="rpm-header-left">
            <h1 className="rpm-title">Avatar Creator</h1>
            <p className="rpm-subtitle">
              Customize your avatar using Ready Player Me
            </p>
          </div>
          {avatarUrl && (
            <button className="rpm-btn rpm-btn-outline" onClick={() => setPhase('preview')}>
              <ImageIcon size={16} />
              View Preview
            </button>
          )}
        </header>

        <div className="rpm-iframe-container">
          <iframe
            ref={iframeRef}
            src={RPM_IFRAME_URL}
            className="rpm-iframe"
            allow="camera *; microphone *; clipboard-write"
            title="Ready Player Me Avatar Creator"
          />
        </div>
      </div>
    )
  }

  // ─── Phase 2: Preview & Export ──
  return (
    <div className="rpm-preview-page">
      <header className="rpm-header">
        <div className="rpm-header-left">
          <h1 className="rpm-title">Avatar Preview</h1>
          <p className="rpm-subtitle">
            Export: {EXPORT_WIDTH}×{EXPORT_HEIGHT}px · Front-facing · Fixed zoom
          </p>
        </div>
        <div className="rpm-header-actions">
          <button className="rpm-btn rpm-btn-outline" onClick={handleEditAgain}>
            <Pencil size={16} />
            Edit Again
          </button>
          <button className="rpm-btn rpm-btn-outline" onClick={() => { setAvatarUrl(null); setPhase('create') }}>
            <RotateCcw size={16} />
            New Avatar
          </button>
        </div>
      </header>

      {/* 3D Viewport (preview only, export uses offscreen renderer) */}
      <div className="rpm-viewport">
        {isLoading && (
          <Loading text="Loading avatar model..." size="lg" overlay />
        )}

        <Canvas
          gl={{ preserveDrawingBuffer: true, antialias: true }}
          dpr={[1, 2]}
          className="rpm-canvas"
        >
          <PerspectiveCamera makeDefault position={[0, 0.8, 2.5]} fov={35} />

          <color attach="background" args={['#f0f0f5']} />

          <ambientLight intensity={0.6} />
          <directionalLight position={[5, 8, 5]} intensity={1.2} castShadow />
          <directionalLight position={[-3, 4, -4]} intensity={0.4} />
          <pointLight position={[0, 3, 4]} intensity={0.5} />
          <hemisphereLight args={['#b1e1ff', '#b97a20', 0.25]} />

          {avatarUrl && (
            <AvatarModel
              avatarUrl={avatarUrl}
              onLoaded={handleModelLoaded}
            />
          )}

          <OrbitControls
            enableRotate={true}
            enablePan={false}
            enableZoom={true}
            minDistance={1}
            maxDistance={4}
            target={[0, 0.7, 0]}
          />
        </Canvas>
      </div>

      {/* Export bar */}
      <div className="rpm-export-bar">
        <label className="rpm-checkbox">
          <input
            type="checkbox"
            checked={transparentBg}
            onChange={(e) => setTransparentBg(e.target.checked)}
          />
          <span>Transparent BG</span>
        </label>

        <div className="rpm-export-divider" />

        <button className="rpm-btn rpm-btn-primary" onClick={handleExportPNG}>
          <ImageIcon size={16} />
          PNG {transparentBg ? '(transparent)' : ''}
        </button>
        <button className="rpm-btn rpm-btn-primary" onClick={handleExportJPEG}>
          <ImageIcon size={16} />
          JPEG
        </button>
        <button className="rpm-btn rpm-btn-primary" onClick={handleExportGLB}>
          <Download size={16} />
          GLB
        </button>

        <div className="rpm-export-divider" />

        <button
          className="rpm-btn rpm-btn-primary"
          onClick={() => {
            if (avatarUrl) {
              const router = window.location
              router.href = `/sticker-pack?avatar=${encodeURIComponent(avatarUrl)}`
            }
          }}
        >
          <Sparkles size={16} />
          Create Stickers
        </button>
      </div>
    </div>
  )
}
