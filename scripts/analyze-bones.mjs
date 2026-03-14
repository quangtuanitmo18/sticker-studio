/**
 * Diagnostic: analyze RPM model bone hierarchy and rest rotations
 * Run: node scripts/analyze-bones.mjs public/models/base_model.glb
 * 
 * Polyfills browser globals needed by three-stdlib's GLTFLoader
 */

// Polyfill browser globals BEFORE importing three-stdlib
import { Blob as NodeBlob } from 'buffer'
globalThis.self = globalThis
globalThis.window = globalThis
globalThis.document = { createElementNS: () => ({ style: {} }) }
globalThis.Blob = NodeBlob
globalThis.URL = { createObjectURL: () => '' }
globalThis.Image = class { set src(_) {} }
globalThis.XMLHttpRequest = class {}
globalThis.HTMLCanvasElement = class {}
globalThis.navigator = { userAgent: '' }

import * as THREE from 'three'
import { GLTFLoader } from 'three-stdlib'
import fs from 'fs'

const glbPath = process.argv[2]
if (!glbPath) {
  console.error('Usage: node scripts/analyze-bones.mjs <path-to-glb>')
  process.exit(1)
}

// Load GLB
const buffer = fs.readFileSync(glbPath)
const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength)

const loader = new GLTFLoader()

let gltf
try {
  gltf = await new Promise((resolve, reject) => {
    loader.parse(arrayBuffer, '', resolve, reject)
  })
} catch (e) {
  // May fail on textures but bones should still be loaded
  console.warn('Warning: partial load error (textures), continuing with bones...')
  // Try alternative: just parse the JSON to extract bone data
}

if (!gltf) {
  console.error('Failed to load model. Trying raw JSON parse...')
  
  // Parse GLB header manually to extract bone info
  const view = new DataView(arrayBuffer)
  const magic = view.getUint32(0, true)
  if (magic !== 0x46546C67) { // 'glTF'
    console.error('Not a valid GLB file')
    process.exit(1)
  }
  
  // Read JSON chunk
  const jsonLen = view.getUint32(12, true)
  const jsonBytes = new Uint8Array(arrayBuffer, 20, jsonLen)
  const jsonStr = new TextDecoder().decode(jsonBytes)
  const json = JSON.parse(jsonStr)
  
  console.log('=== GLTF JSON BONE ANALYSIS ===\n')
  
  // Find skin and nodes
  if (json.skins && json.skins.length > 0) {
    const skin = json.skins[0]
    const joints = skin.joints
    console.log(`Skin: ${skin.name || 'unnamed'}, joints: ${joints.length}\n`)
    
    console.log('=== JOINT LIST ===')
    joints.forEach((jointIdx, i) => {
      const node = json.nodes[jointIdx]
      const rot = node.rotation || [0, 0, 0, 1]
      const pos = node.translation || [0, 0, 0]
      
      // Convert quaternion to euler degrees
      const q = new THREE.Quaternion(rot[0], rot[1], rot[2], rot[3])
      const euler = new THREE.Euler().setFromQuaternion(q, 'XYZ')
      const rx = (euler.x * 180 / Math.PI).toFixed(1)
      const ry = (euler.y * 180 / Math.PI).toFixed(1)
      const rz = (euler.z * 180 / Math.PI).toFixed(1)
      
      // Find children that are also joints
      const childJoints = (node.children || [])
        .filter(c => joints.includes(c))
        .map(c => json.nodes[c].name)
      
      console.log(`[${i}] ${(node.name || 'unnamed').padEnd(22)} pos=(${pos[0]?.toFixed(4)}, ${pos[1]?.toFixed(4)}, ${pos[2]?.toFixed(4)})  euler=(${rx}°, ${ry}°, ${rz}°)  quat=(${rot.map(v=>v.toFixed(4)).join(', ')})  children=[${childJoints.join(', ')}]`)
    })
    
    // Summary for key bones
    console.log('\n=== KEY BONES SUMMARY ===')
    const keyNames = [
      'Hips', 'Spine', 'Spine1', 'Spine2', 'Neck', 'Head',
      'LeftShoulder', 'LeftArm', 'LeftForeArm', 'LeftHand',
      'LeftHandIndex1', 'LeftHandMiddle1', 'LeftHandRing1', 'LeftHandPinky1', 'LeftHandThumb1',
      'RightShoulder', 'RightArm', 'RightForeArm', 'RightHand',
      'RightHandIndex1', 'RightHandMiddle1', 'RightHandRing1', 'RightHandPinky1', 'RightHandThumb1',
      'LeftUpLeg', 'LeftLeg', 'LeftFoot',
      'RightUpLeg', 'RightLeg', 'RightFoot',
    ]
    
    keyNames.forEach(name => {
      const jointIdx = joints.findIndex(j => json.nodes[j].name === name)
      if (jointIdx === -1) return
      const node = json.nodes[joints[jointIdx]]
      const rot = node.rotation || [0, 0, 0, 1]
      const pos = node.translation || [0, 0, 0]
      
      const q = new THREE.Quaternion(rot[0], rot[1], rot[2], rot[3])
      const euler = new THREE.Euler().setFromQuaternion(q, 'XYZ')
      const rx = (euler.x * 180 / Math.PI).toFixed(1)
      const ry = (euler.y * 180 / Math.PI).toFixed(1)
      const rz = (euler.z * 180 / Math.PI).toFixed(1)
      
      console.log(`${name.padEnd(22)} pos=(${pos[0]?.toFixed(4)}, ${pos[1]?.toFixed(4)}, ${pos[2]?.toFixed(4)})  euler=(${rx}°, ${ry}°, ${rz}°)`)
    })
  }
  
  process.exit(0)
}

console.log('=== RPM BONE ANALYSIS ===\n')

// Find all bones
const bones = []
gltf.scene.traverse((node) => {
  if (node.isBone) {
    bones.push(node)
  }
})

console.log(`Total bones: ${bones.length}\n`)

// Update world matrices
gltf.scene.updateWorldMatrix(true, true)
gltf.scene.updateMatrixWorld(true)

// Key bones summary
console.log('=== KEY BONES (rest pose) ===')
const keyNames = [
  'Hips', 'Spine', 'Spine1', 'Spine2', 'Neck', 'Head',
  'LeftShoulder', 'LeftArm', 'LeftForeArm', 'LeftHand',
  'LeftHandIndex1', 'LeftHandMiddle1',
  'RightShoulder', 'RightArm', 'RightForeArm', 'RightHand',
  'RightHandIndex1', 'RightHandMiddle1',
  'LeftUpLeg', 'LeftLeg', 'RightUpLeg', 'RightLeg',
]

keyNames.forEach(name => {
  const bone = bones.find(b => b.name === name || b.name.endsWith(name))
  if (!bone) return
  
  const worldPos = new THREE.Vector3()
  bone.getWorldPosition(worldPos)
  const rx = (bone.rotation.x * 180 / Math.PI).toFixed(1)
  const ry = (bone.rotation.y * 180 / Math.PI).toFixed(1)
  const rz = (bone.rotation.z * 180 / Math.PI).toFixed(1)
  
  console.log(`${name.padEnd(22)} local_rot=(${rx}°, ${ry}°, ${rz}°) order=${bone.rotation.order}  world_pos=(${worldPos.x.toFixed(3)}, ${worldPos.y.toFixed(3)}, ${worldPos.z.toFixed(3)})`)
})

// Test arm rotation axes
console.log('\n=== ARM ROTATION AXIS TEST ===')
const leftArm = bones.find(b => b.name === 'LeftArm' || b.name.endsWith('LeftArm'))
const leftHand = bones.find(b => b.name === 'LeftHand' || b.name.endsWith('LeftHand'))

if (leftArm && leftHand) {
  const origRx = leftArm.rotation.x
  const origRy = leftArm.rotation.y
  const origRz = leftArm.rotation.z
  
  gltf.scene.updateWorldMatrix(true, true)
  const basePos = new THREE.Vector3()
  leftHand.getWorldPosition(basePos)
  console.log(`Base LeftHand: (${basePos.x.toFixed(3)}, ${basePos.y.toFixed(3)}, ${basePos.z.toFixed(3)})`)
  
  for (const [label, dx, dy, dz] of [
    ['+45° X', 45, 0, 0],
    ['-45° X', -45, 0, 0],
    ['+45° Y', 0, 45, 0],
    ['-45° Y', 0, -45, 0],
    ['+45° Z', 0, 0, 45],
    ['-45° Z', 0, 0, -45],
  ]) {
    leftArm.rotation.x = origRx + dx * Math.PI / 180
    leftArm.rotation.y = origRy + dy * Math.PI / 180
    leftArm.rotation.z = origRz + dz * Math.PI / 180
    gltf.scene.updateWorldMatrix(true, true)
    const p = new THREE.Vector3()
    leftHand.getWorldPosition(p)
    console.log(`${label}: hand=(${p.x.toFixed(3)}, ${p.y.toFixed(3)}, ${p.z.toFixed(3)}) ΔX=${(p.x-basePos.x).toFixed(3)} ΔY=${(p.y-basePos.y).toFixed(3)} ΔZ=${(p.z-basePos.z).toFixed(3)}`)
    leftArm.rotation.set(origRx, origRy, origRz)
  }
}

console.log('\nDone!')
