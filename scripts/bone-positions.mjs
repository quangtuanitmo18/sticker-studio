// Extract skeleton bone positions from GLB
import { readFileSync } from 'fs'

const buffer = readFileSync('d:/laragon/www/Ai/sticker-studio/public/models/avatar_base.glb')
const chunk0Length = buffer.readUInt32LE(12)
const jsonStr = buffer.toString('utf8', 20, 20 + chunk0Length)
const gltf = JSON.parse(jsonStr)

// Key bones we care about for positioning procedural components
const KEY_BONES = ['Head', 'HeadTop_End', 'Neck', 'Spine2', 'Spine1', 'Spine', 'Hips', 'LeftFoot', 'RightFoot', 'LeftUpLeg', 'RightUpLeg']

console.log('=== Key Bone Transforms ===')
gltf.nodes.forEach((node, i) => {
  if (KEY_BONES.includes(node.name)) {
    const t = node.translation || [0, 0, 0]
    const r = node.rotation || [0, 0, 0, 1]
    const s = node.scale || [1, 1, 1]
    console.log(`[${i}] ${node.name}:`)
    console.log(`  translation: [${t.map(v => v.toFixed(4)).join(', ')}]`)
    if (node.children) console.log(`  children: ${node.children.map(c => gltf.nodes[c].name).join(', ')}`)
  }
})

// Calculate approximate world position of Head by walking up hierarchy
function getWorldY(nodeName) {
  let totalY = 0
  let current = gltf.nodes.find(n => n.name === nodeName)
  const visited = new Set()  
  while (current && !visited.has(current.name)) {
    visited.add(current.name)
    const t = current.translation || [0, 0, 0]
    totalY += t[1]
    // Find parent
    const parentIdx = gltf.nodes.findIndex(n => n.children && n.children.includes(gltf.nodes.indexOf(current)))
    if (parentIdx === -1) break
    current = gltf.nodes[parentIdx]
  }
  return totalY
}

console.log('\n=== Estimated World Y Positions ===')
KEY_BONES.forEach(name => {
  try {
    const y = getWorldY(name)
    console.log(`${name}: Y ≈ ${y.toFixed(4)}`)
  } catch(e) {}
})
