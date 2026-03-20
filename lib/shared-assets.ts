// ─── Shared constants for Text and Asset panels ─────────────

export const emoji = (code: string) => `https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/svg/${code}.svg`
export const dicebear = (style: string, seed: string) => `https://api.dicebear.com/7.x/${style}/svg?seed=${seed}&backgroundColor=transparent`

export const FONTS = [
  { value: 'Anton', label: 'Anton', sample: 'BOLD' },
  { value: 'Archivo Black', label: 'Archivo Black', sample: 'THICK' },
  { value: 'Comic Neue', label: 'Comic Neue', sample: 'Fun!' },
  { value: 'Courier Prime', label: 'Courier Prime', sample: 'CODE' },
  { value: 'Lora', label: 'Lora', sample: 'Serif' },
  { value: 'Nunito', label: 'Nunito', sample: 'Clean' },
  { value: 'Fira Sans', label: 'Fira Sans', sample: 'Modern' },
  { value: 'Fira Code', label: 'Fira Code', sample: 'MONO' },
]

export const TEXT_PRESETS = [
  { label: '🔥 Meme', font: 'Anton', fill: '#ffffff', stroke: '#000000', strokeWidth: 3, size: 72 },
  { label: '✨ Neon', font: 'Archivo Black', fill: '#00e5ff', stroke: '#000000', strokeWidth: 2, size: 60 },
  { label: '💖 Pop', font: 'Comic Neue', fill: '#ff4081', stroke: '#ffffff', strokeWidth: 2, size: 56 },
  { label: '🎮 Cyber', font: 'Courier Prime', fill: '#39ff14', stroke: '#000000', strokeWidth: 2, size: 48 },
  { label: '⚡ Bold', font: 'Archivo Black', fill: '#F59E0B', stroke: '#000000', strokeWidth: 3, size: 64 },
  { label: '🌊 Wave', font: 'Lora', fill: '#60a5fa', stroke: '#1e3a5f', strokeWidth: 2, size: 52 },
  { label: '🍿 Fun', font: 'Comic Neue', fill: '#ffeb3b', stroke: '#ff9800', strokeWidth: 2, size: 60 },
  { label: '❄️ Frost', font: 'Nunito', fill: '#e0f7fa', stroke: '#006064', strokeWidth: 2, size: 50 },
]

export const TEMPLATE_CATEGORIES = {
  emojis: { name: '😀 Emojis', items: [
    '1f600', '1f601', '1f602', '1f923', '1f603', '1f604', '1f605', '1f606', '1f609', '1f60a',
    '1f60b', '1f60e', '1f60d', '1f618', '1f617', '1f619', '1f61a', '263a', '1f642', '1f917',
    '1f929', '1f914', '1f928', '1f610', '1f611', '1f636', '1f644', '1f60f', '1f623', '1f625',
    '1f62e', '1f910', '1f62f', '1f62a', '1f62b', '1f634', '1f60c', '1f61b', '1f61c', '1f61d',
    '1f924', '1f612', '1f613', '1f614', '1f615', '1f643', '1f911', '1f632', '1f637', '1f912',
    '1f915', '1f922', '1f92e', '1f927', '1f635', '1f92f', '1f920', '1f973', '1f608', '1f47f',
    '1f479', '1f47a', '1f480', '2620', '1f47b', '1f47d', '1f47e', '1f916', '1f4a9', '1f63a',
    '1f638', '1f639', '1f63b', '1f63c', '1f63d', '1f640', '1f63f', '1f63e', '1f648', '1f649',
    '1f64a', '1f974', '1f97a', '1f92a', '1f92b', '1f92c', '1f92d', '1f970', '1f975', '1f976',
    '1f978', '1fae0', '1fae1', '1fae2', '1fae3', '1fae4', '1fae5', '1fae6', '1f90c', '1f972'
  ].map(emoji) },

  hands: { name: '👋 Hands', items: [
    '1f44d', '1f44e', '1f44a', '270a', '1f91b', '1f91c', '270c', '1f91e', '1f91f', '1f918',
    '1f44c', '1f90c', '1f90f', '1f448', '1f449', '1f446', '1f447', '261d', '270b', '1f91a',
    '1f596', '1f44b', '1f919', '1f4aa', '270d', '1f64f', '1f44f', '1f450', '1f932', '1f91d',
    '1f485', '1f9b6', '1f9b5', '1f442', '1f443', '1f9e0', '1fac0', '1fac1', '1f440', '1f441',
    '1f445', '1f444', '1f9b7', '1f9b4', '1f4a5', '1f4a6', '1f4a8', '1f573', '1f4ab', '1f4ac'
  ].map(emoji) },

  hearts: { name: '❤️ Hearts', items: [
    '2764', '1f9e1', '1f49b', '1f49a', '1f499', '1f49c', '1f90e', '1f5a4', '1f90d', '1fa76',
    '2763', '1f495', '1f49e', '1f493', '1f497', '1f496', '1f498', '1f49d', '1f49f', '1f48c',
    '1f48b', '1f48d', '1f490', '1f339', '1f940', '1f33a', '1f338', '1f4ae', '1f3f5', '1f33b',
    '1f33c', '1f337', '1f331', '1fab4', '1f33f', '2618', '1f340', '1f341', '1f342', '1f343',
    '1fab9', '1faba', '1fab7', '1fab8', '1f48e', '1fa77', '1fa78', '1f48a', '1f489', '1fa79'
  ].map(emoji) },

  animals: { name: '🐾 Animals', items: [
    '1f436', '1f431', '1f98a', '1f43b', '1f43c', '1f428', '1f42f', '1f981', '1f42e', '1f437',
    '1f438', '1f435', '1f984', '1f987', '1f989', '1f419', '1f98b', '1f41b', '1f40d', '1f422',
    '1f995', '1f433', '1f412', '1f98d', '1f9a7', '1f415', '1f9ae', '1f429', '1f43a', '1f99d',
    '1f408', '1f405', '1f406', '1f434', '1f9ac', '1f98c', '1f402', '1f403', '1f404', '1f416',
    '1f417', '1f43d', '1f40f', '1f411', '1f410', '1f42a', '1f42b', '1f999', '1f992', '1f418',
  ].map(emoji) },

  food: { name: '🍕 Food', items: [
    '1f34e', '1f34f', '1f350', '1f34a', '1f34b', '1f34c', '1f349', '1f347', '1f353', '1f348',
    '1f352', '1f351', '1f96d', '1f34d', '1f965', '1f95d', '1f345', '1f346', '1f951', '1f966',
    '1f96c', '1f952', '1f336', '1f954', '1f955', '1f33d', '1f360', '1f95c', '1f36f', '1f950',
    '1f35e', '1f956', '1f968', '1f9c0', '1f95a', '1f373', '1f953', '1f356', '1f357', '1f35f',
    '1f355', '1f32d', '1f354', '1f32e', '1f32f', '1f959', '1f9c6', '1f372', '1f958', '1f35c',
  ].map(emoji) },

  nature: { name: '🌿 Nature', items: [
    '1f332', '1f333', '1f334', '1f335', '1f337', '1f33b', '1f339', '1f340', '1f341', '1f342',
    '1f343', '1f344', '2600', '1f319', '2b50', '2601', '26a1', '1f308', '2602', '2744',
    '1f30d', '1f30e', '1f30f', '1f311', '1f312', '1f313', '1f314', '1f315', '1f316', '1f317',
    '1f318', '1f31a', '1f31b', '1f31c', '1f31d', '1f31e', '1f31f', '1f320', '1f321', '26c5',
    '26c8', '1f324', '1f325', '1f326', '1f327', '1f328', '1f329', '1f32a', '1f32b', '1f32c',
  ].map(emoji) },

  shapes: { name: '⬡ Shapes', items: [
    ...['star', 'heart', 'ring', 'polygon', 'burst', 'circle', 'square', 'triangle', 'diamond', 'hexagon', 'pentagon', 'arrow', 'wave', 'shield', 'badge', 'ribbon'].map(seed => dicebear('shapes', seed)),
    ...['2b50', '2b55', '274c', '2714', '2795', '2796', '2716', '2797', '1f4a0', '1f534',
         '1f535', '26aa', '26ab', '1f7e0', '1f7e1', '1f7e2', '1f7e3', '1f7e4', '1f536', '1f537',
         '1f538', '1f539', '1f53a', '1f53b', '1f53c', '1f53d', '25aa', '25ab', '25fe', '25fd',
    ].map(emoji)
  ]},

  avatars: { name: '👤 Avatars', items: [
    ...Array.from({length: 20}).map((_, i) => dicebear('avataaars', `Avatar${i}`)),
    ...Array.from({length: 20}).map((_, i) => dicebear('bottts', `Bot${i}`)),
    ...Array.from({length: 15}).map((_, i) => dicebear('adventurer', `Adv${i}`)),
    ...Array.from({length: 15}).map((_, i) => dicebear('fun-emoji', `Fun${i}`)),
  ]},
}

export type TemplateCategory = keyof typeof TEMPLATE_CATEGORIES
