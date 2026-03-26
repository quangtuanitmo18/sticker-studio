/** AR Face Filter system — supports 3 rendering modes:
 *
 *  1. `facemesh` — Texture painted directly onto the 468-point face mesh.
 *     Conforms to facial shape and expressions (like makeup, face paint).
 *
 *  2. `model` — GLTF/GLB 3D model attached to a face anchor point.
 *     For accessories like glasses, hats, headbands (realistic 3D depth).
 *
 *  3. `overlay` — Simple 2D image plane on a face anchor.
 *     Lightweight fallback for emoji-style overlays.
 *
 *  MindAR anchor reference (MediaPipe FaceMesh landmarks):
 *    1   = nose tip
 *    10  = forehead center
 *    168 = nose bridge (glasses position)
 *    152 = chin
 *    234 = left ear     454 = right ear
 */

export type ARFilterType = 'facemesh' | 'model' | 'overlay'

export interface ARFilter {
  id: string
  label: string
  emoji: string
  type: ARFilterType
  category: 'facepaint' | 'accessories' | 'fun'

  /** Face mesh texture URL (for type: 'facemesh') */
  textureUrl?: string
  /** GLTF model URL (for type: 'model') */
  modelUrl?: string
  /** Overlay image URL (for type: 'overlay') */
  imageUrl?: string

  /** MindAR face anchor index (for model/overlay types) */
  anchorIndex?: number
  /** Scale relative to face */
  scale: number
  /** Y offset from anchor */
  offsetY?: number
  /** Z offset from anchor */
  offsetZ?: number
  /** Rotation offsets [x, y, z] in radians */
  rotation?: [number, number, number]
  /** Thumbnail for sidebar preview (falls back to emoji) */
  thumbnail?: string
}

// ─── Filters ───────────────────────────────────────────────

export const AR_FILTERS: ARFilter[] = [
  // === Face Paint (facemesh type) ===
  {
    id: 'cat_face',
    label: 'Cat Face',
    emoji: '🐱',
    type: 'facemesh',
    category: 'facepaint',
    textureUrl: '/ar-assets/cat-face.png',
    scale: 1,
    thumbnail: '/ar-assets/cat-face.png',
  },
  {
    id: 'skull_face',
    label: 'Sugar Skull',
    emoji: '💀',
    type: 'facemesh',
    category: 'facepaint',
    textureUrl: '/ar-assets/skull-face.png',
    scale: 1,
    thumbnail: '/ar-assets/skull-face.png',
  },
  {
    id: 'robot_face',
    label: 'Cyborg',
    emoji: '🤖',
    type: 'facemesh',
    category: 'facepaint',
    textureUrl: '/ar-assets/robot-face.png',
    scale: 1,
    thumbnail: '/ar-assets/robot-face.png',
  },
  {
    id: 'galaxy_face',
    label: 'Galaxy',
    emoji: '🌌',
    type: 'facemesh',
    category: 'facepaint',
    textureUrl: '/ar-assets/galaxy-face.png',
    scale: 1,
    thumbnail: '/ar-assets/galaxy-face.png',
  },
  {
    id: 'tiger_face',
    label: 'Tiger',
    emoji: '🐯',
    type: 'facemesh',
    category: 'facepaint',
    textureUrl: '/ar-assets/tiger-face.png',
    scale: 1,
    thumbnail: '/ar-assets/tiger-face.png',
  },

  // === Accessories (overlay for now, upgrade to GLTF later) ===
  //   Bạn điền scale: 1.0 => Kính rộng chuẩn bằng 2 viền má.
  // Bạn điền scale: 1.1 => Kính to hơn mặt 10%.
  // Bạn điền scale: 0.9 => Kính nhỏ hơn mặt 10%.
  {
    id: 'glasses-3d',
    label: '3D Glasses Pro',
    emoji: '🕶️',
    type: 'model',
    category: 'accessories',
    modelUrl: '/ar-assets/cool-glasses.glb',
    imageUrl: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f576.svg',
    anchorIndex: 168,
    scale: 0.9, // Chỉnh nhỏ lại một chút cho vừa mắt
    offsetY: 0.0,
    offsetZ: -0.3, // <== KÉO KÍNH LẠI GẦN MẶT (-0.15 là thụt lùi vào trong)
    rotation: [0, 0, 0],
  },
  {
    id: 'crown-3d',
    label: '3D Crown',
    emoji: '👑',
    type: 'model',
    category: 'accessories',
    modelUrl: '/ar-assets/crown-1.glb',
    imageUrl: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f451.svg',
    anchorIndex: 168,
    scale: 1.15,           // Nhỏ lại
    offsetY: 0.65,         // Hạ xuống thấp hơn
    offsetZ: -0.5,        // Lùi lại gần đầu hơn
    rotation: [0, 0, 0],
  },
  {
    id: 'tophat',
    label: 'Top Hat',
    emoji: '🎩',
    type: 'model',
    category: 'accessories',
    modelUrl: '/ar-assets/top-hat.glb',
    anchorIndex: 168,
    imageUrl: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f3a9.svg',
    scale: 1.7,           // Nhỏ lại
    offsetY: 1,         // Hạ xuống thấp hơn
    offsetZ: -0.7,        // Lùi lại gần đầu hơn
    rotation: [0, 0, 0],
  },
  {
    id: 'cap',
    label: 'Billed Cap',
    emoji: '🧢',
    type: 'overlay',
    category: 'accessories',
    anchorIndex: 10,
    imageUrl: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f9e2.svg',
    scale: 0.55,
    offsetY: -0.15,
  },
  {
    id: 'butterfly',
    label: 'Butterfly',
    emoji: '🦋',
    type: 'overlay',
    category: 'accessories',
    anchorIndex: 10,
    imageUrl: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f98b.svg',
    scale: 0.4,
    offsetY: -0.25,
  },
  {
    id: 'flower',
    label: 'Flower',
    emoji: '🌸',
    type: 'overlay',
    category: 'accessories',
    anchorIndex: 10,
    imageUrl: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f338.svg',
    scale: 0.35,
    offsetY: -0.2,
  },
  {
    id: 'trash-can',
    label: 'Trash Can',
    emoji: '🗑️',
    type: 'model',
    category: 'accessories',
    modelUrl: '/ar-assets/Trashcan.glb',
    anchorIndex: 168,
    imageUrl: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f5d1.svg',
    scale: 1.5,           // Nhỏ lại
    offsetY: 0.3,        // Số ÂM (-) để hạ xuống thấp hơn, số DƯƠNG (+) sẽ bay lên trời!
    offsetZ: -0.7,        // Lùi lại gần đầu hơn
    rotation: [0, 0, 0],
  },

  // === Fun (overlay) ===
  {
    id: 'clown',
    label: 'Clown',
    emoji: '🤡',
    type: 'overlay',
    category: 'fun',
    anchorIndex: 1,
    imageUrl: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f921.svg',
    scale: 0.9,
    offsetY: 0,
  },
  {
    id: 'hearts',
    label: 'Heart Eyes',
    emoji: '😍',
    type: 'overlay',
    category: 'fun',
    anchorIndex: 1,
    imageUrl: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f60d.svg',
    scale: 0.85,
    offsetY: 0,
  },
  {
    id: 'star_eyes',
    label: 'Star Eyes',
    emoji: '🤩',
    type: 'overlay',
    category: 'fun',
    anchorIndex: 1,
    imageUrl: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f929.svg',
    scale: 0.85,
    offsetY: 0,
  },
  {
    id: 'dog',
    label: 'Dog',
    emoji: '🐶',
    type: 'overlay',
    category: 'fun',
    anchorIndex: 1,
    imageUrl: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f436.svg',
    scale: 0.9,
    offsetY: 0,
  },
  {
    id: 'nerd',
    label: 'Nerd',
    emoji: '🤓',
    type: 'overlay',
    category: 'fun',
    anchorIndex: 168,
    imageUrl: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f913.svg',
    scale: 0.8,
    offsetY: 0,
  },
  {
    id: 'nose_red',
    label: 'Red Nose',
    emoji: '🔴',
    type: 'overlay',
    category: 'fun',
    anchorIndex: 1,
    imageUrl: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f534.svg',
    scale: 0.15,
    offsetY: 0,
  },
]

// ─── Categories ────────────────────────────────────────────

export const AR_CATEGORIES = [
  { id: 'facepaint', emoji: '🎨', label: 'Face Paint' },
  { id: 'accessories', emoji: '👑', label: 'Accessories' },
  { id: 'fun', emoji: '😜', label: 'Fun' },
] as const
