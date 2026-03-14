// Script to analyze GLB model structure
import { readFileSync } from 'fs'

const buffer = readFileSync('d:/laragon/www/Ai/sticker-studio/public/models/avatar_base.glb')

// GLB header
const magic = buffer.readUInt32LE(0)
const version = buffer.readUInt32LE(4)
const length = buffer.readUInt32LE(8)

console.log('=== GLB Header ===')
console.log(`Magic: 0x${magic.toString(16)} (${magic === 0x46546C67 ? 'valid glTF' : 'invalid'})`)
console.log(`Version: ${version}`)
console.log(`Total size: ${(length / 1024 / 1024).toFixed(2)} MB`)

// First chunk (JSON)
const chunk0Length = buffer.readUInt32LE(12)
const chunk0Type = buffer.readUInt32LE(16)
console.log(`\nJSON chunk size: ${(chunk0Length / 1024).toFixed(1)} KB`)

const jsonStr = buffer.toString('utf8', 20, 20 + chunk0Length)
const gltf = JSON.parse(jsonStr)

console.log('\n=== Meshes ===')
if (gltf.meshes) {
  gltf.meshes.forEach((mesh, i) => {
    console.log(`[${i}] ${mesh.name || 'unnamed'}`)
    if (mesh.extras) console.log(`    extras: ${JSON.stringify(mesh.extras)}`)
    if (mesh.primitives) {
      mesh.primitives.forEach((prim, pi) => {
        const targets = prim.targets ? prim.targets.length : 0
        console.log(`    primitive[${pi}]: ${targets} morph targets`)
      })
    }
  })
}

console.log('\n=== Nodes (scene graph) ===')
if (gltf.nodes) {
  gltf.nodes.forEach((node, i) => {
    const meshIdx = node.mesh !== undefined ? ` → mesh[${node.mesh}]` : ''
    const skinIdx = node.skin !== undefined ? ` (skinned)` : ''
    const children = node.children ? ` children: [${node.children.join(',')}]` : ''
    console.log(`[${i}] ${node.name || 'unnamed'}${meshIdx}${skinIdx}${children}`)
  })
}

console.log('\n=== Morph Target Names ===')
if (gltf.meshes) {
  gltf.meshes.forEach((mesh) => {
    if (mesh.extras && mesh.extras.targetNames) {
      console.log(`${mesh.name}: ${mesh.extras.targetNames.length} targets`)
      console.log(`  ${mesh.extras.targetNames.join(', ')}`)
    }
  })
}

console.log('\n=== Materials ===')
if (gltf.materials) {
  gltf.materials.forEach((mat, i) => {
    console.log(`[${i}] ${mat.name || 'unnamed'}`)
  })
}

console.log('\n=== Skins ===')
if (gltf.skins) {
  gltf.skins.forEach((skin, i) => {
    console.log(`[${i}] ${skin.name || 'unnamed'} — ${skin.joints?.length || 0} joints`)
  })
}

console.log('\n=== Textures ===')
if (gltf.textures) {
  console.log(`Total textures: ${gltf.textures.length}`)
}
if (gltf.images) {
  gltf.images.forEach((img, i) => {
    console.log(`[${i}] ${img.name || img.uri || img.mimeType || 'embedded'}`)
  })
}
