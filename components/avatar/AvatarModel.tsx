'use client'

import { useFrame } from '@react-three/fiber'
import * as React from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three-stdlib'

// ─── Component ───────────────────────────────────────────────

interface AvatarModelProps {
  /** URL to the RPM avatar GLB model */
  avatarUrl: string
  /** Called when model is loaded and ready */
  onLoaded: (group: THREE.Group) => void
}

export function AvatarModel({ avatarUrl, onLoaded }: AvatarModelProps) {
  const groupRef = React.useRef<THREE.Group>(null)
  const [model, setModel] = React.useState<THREE.Group | null>(null)

  // ── Load model from URL ──
  React.useEffect(() => {
    if (!avatarUrl) return

    setModel(null)
    const loader = new GLTFLoader()

    loader.load(
      avatarUrl,
      (gltf) => {
        const scene = gltf.scene.clone(true)
        // Deep-clone materials for safety
        scene.traverse((child) => {
          if (child instanceof THREE.Mesh && child.material) {
            child.material = (child.material as THREE.Material).clone()
          }
        })

        // Log mesh names for debugging
        const meshNames: string[] = []
        scene.traverse((child) => {
          if (child instanceof THREE.Mesh) meshNames.push(child.name)
        })
        console.log('[AvatarModel] Loaded meshes:', meshNames.join(', '))

        setModel(scene)
      },
      (progress) => {
        if (progress.total > 0) {
          const pct = Math.round((progress.loaded / progress.total) * 100)
          console.log(`[AvatarModel] Loading: ${pct}%`)
        }
      },
      (err) => {
        console.error('[AvatarModel] Load error:', err)
      },
    )
  }, [avatarUrl])

  // ── Notify parent when model is ready ──
  React.useEffect(() => {
    if (model && groupRef.current) {
      onLoaded(groupRef.current)
    }
  }, [model, onLoaded])

  // ── Idle animation (gentle breathing sway) ──
  useFrame((state) => {
    if (!groupRef.current) return
    const t = state.clock.elapsedTime
    groupRef.current.rotation.y = Math.PI + Math.sin(t * 0.3) * 0.04
    groupRef.current.position.y = -0.95 + Math.sin(t * 0.8) * 0.003
  })

  return (
    <group ref={groupRef} position={[0, -0.95, 0]} rotation={[0, Math.PI, 0]}>
      {model && <primitive object={model} />}
    </group>
  )
}
