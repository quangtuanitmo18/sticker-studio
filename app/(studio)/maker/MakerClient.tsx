'use client'

import { PanelSection } from '@/components/shared/PanelSection'
import { SidebarHeader } from '@/components/shared/SidebarHeader'
import { Loading } from '@/components/ui/Loading'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/toast'
import { downloadBlob, downloadUrl } from '@/lib/download'
import { EXPORT_FORMATS, exportForPlatform, formatFileSize } from '@/lib/export-formats'
import { FRAME_CATEGORIES, STICKER_FRAMES, applyFrameToImage } from '@/lib/frame-templates'
import { ANIMATION_PRESETS, createAnimatedGif } from '@/lib/gif-encoder'
import { FILTER_CATEGORIES, IMAGE_FILTERS, applyFilterToImage } from '@/lib/image-filters'
import { smartCrop } from '@/lib/smart-crop'
import {
  ChevronDown,
  ChevronUp,
  Download,
  Frame,
  GripVertical,
  Instagram,
  Layers,
  LayoutTemplate,
  LoaderCircle as Loader2,
  Monitor,
  Palette,
  Plus,
  Redo2,
  Settings,
  Share2,
  Smartphone,
  Square, Trash2,
  Twitter,
  Type,
  Undo2,
  UploadCloud,
  Wand2,
  ZoomIn, ZoomOut,
} from 'lucide-react'
import dynamic from 'next/dynamic'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { CanvasElement } from './CanvasEditor'

const CanvasEditor = dynamic(() => import('./CanvasEditor'), { ssr: false })

// ─── Data ──────────────────────────────────────────────────
const OUTLINE_PRESETS = [
  { color: '#ffffff', label: 'White' },
  { color: '#000000', label: 'Black' },
  { color: '#FF6B4A', label: 'Coral' },
  { color: '#F59E0B', label: 'Amber' },
  { color: '#10B981', label: 'Green' },
  { color: '#3B82F6', label: 'Blue' },
  { color: '#8B5CF6', label: 'Purple' },
  { color: '#EC4899', label: 'Pink' },
]

interface GradientPreset {
  id: string
  label: string
  colors: [string, string]
  css: string
}

const OUTLINE_GRADIENTS: GradientPreset[] = [
  { id: 'sunset', label: 'Sunset', colors: ['#FF6B4A', '#F59E0B'], css: 'linear-gradient(135deg, #FF6B4A, #F59E0B)' },
  { id: 'ocean', label: 'Ocean', colors: ['#3B82F6', '#10B981'], css: 'linear-gradient(135deg, #3B82F6, #10B981)' },
  { id: 'berry', label: 'Berry', colors: ['#8B5CF6', '#EC4899'], css: 'linear-gradient(135deg, #8B5CF6, #EC4899)' },
  { id: 'neon', label: 'Neon', colors: ['#39ff14', '#00e5ff'], css: 'linear-gradient(135deg, #39ff14, #00e5ff)' },
  { id: 'fire', label: 'Fire', colors: ['#FF6B4A', '#dc2626'], css: 'linear-gradient(135deg, #FF6B4A, #dc2626)' },
  { id: 'gold', label: 'Gold', colors: ['#F59E0B', '#d97706'], css: 'linear-gradient(135deg, #F59E0B, #d97706)' },
]

const CANVAS_SIZES = [
  { w: 512, h: 512, label: '512×512', icon: Monitor },
  { w: 600, h: 600, label: '600×600', icon: Monitor },
  { w: 1024, h: 1024, label: '1024×1024', icon: Monitor },
  { w: 1080, h: 1080, label: 'Instagram', icon: Instagram },
  { w: 800, h: 418, label: 'Twitter', icon: Twitter },
  { w: 300, h: 300, label: 'Mobile', icon: Smartphone },
]

const FONTS = [
  { value: 'Anton', label: 'Anton', sample: 'BOLD' },
  { value: 'Archivo Black', label: 'Archivo Black', sample: 'THICK' },
  { value: 'Comic Neue', label: 'Comic Neue', sample: 'Fun!' },
  { value: 'Courier Prime', label: 'Courier Prime', sample: 'CODE' },
  { value: 'Lora', label: 'Lora', sample: 'Serif' },
  { value: 'Nunito', label: 'Nunito', sample: 'Clean' },
  { value: 'Fira Sans', label: 'Fira Sans', sample: 'Modern' },
  { value: 'Fira Code', label: 'Fira Code', sample: 'MONO' },
]

const TEXT_PRESETS = [
  { label: '🔥 Meme', font: 'Anton', fill: '#ffffff', stroke: '#000000', strokeWidth: 3, size: 72 },
  { label: '✨ Neon', font: 'Archivo Black', fill: '#00e5ff', stroke: '#000000', strokeWidth: 2, size: 60 },
  { label: '💖 Pop', font: 'Comic Neue', fill: '#ff4081', stroke: '#ffffff', strokeWidth: 2, size: 56 },
  { label: '🎮 Cyber', font: 'Courier Prime', fill: '#39ff14', stroke: '#000000', strokeWidth: 2, size: 48 },
  { label: '⚡ Bold', font: 'Archivo Black', fill: '#F59E0B', stroke: '#000000', strokeWidth: 3, size: 64 },
  { label: '🌊 Wave', font: 'Lora', fill: '#60a5fa', stroke: '#1e3a5f', strokeWidth: 2, size: 52 },
  { label: '🍿 Fun', font: 'Comic Neue', fill: '#ffeb3b', stroke: '#ff9800', strokeWidth: 2, size: 60 },
  { label: '❄️ Frost', font: 'Nunito', fill: '#e0f7fa', stroke: '#006064', strokeWidth: 2, size: 50 },
]

const emoji = (code: string) => `https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/svg/${code}.svg`
const dicebear = (style: string, seed: string) => `https://api.dicebear.com/7.x/${style}/svg?seed=${seed}&backgroundColor=transparent`

const TEMPLATE_CATEGORIES = {
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
    '1f9a3', '1f98f', '1f99b', '1f401', '1f400', '1f439', '1f430', '1f407', '1f43f', '1f994',
    '1f9a5', '1f9a6', '1f9a8', '1f998', '1f9a1', '1f40a', '1f422', '1f998', '1f9a5', '1f40b',
    '1f42c', '1f420', '1f41f', '1f421', '1f988', '1f419', '1f41a', '1f40c', '1f98e', '1f997',
    '1f577', '1f578', '1f982', '1f99e', '1f9a0', '1f40e', '1f414', '1f413', '1f423', '1f424',
    '1f425', '1f426', '1f427', '1f985', '1f986', '1f9a2', '1f989', '1f99a', '1f9a9', '1f99c'
  ].map(emoji) },

  food: { name: '🍕 Food', items: [
    '1f34e', '1f34f', '1f350', '1f34a', '1f34b', '1f34c', '1f349', '1f347', '1f353', '1f348',
    '1f352', '1f351', '1f96d', '1f34d', '1f965', '1f95d', '1f345', '1f346', '1f951', '1f966',
    '1f96c', '1f952', '1f336', '1f954', '1f955', '1f33d', '1f360', '1f95c', '1f36f', '1f950',
    '1f35e', '1f956', '1f968', '1f9c0', '1f95a', '1f373', '1f953', '1f356', '1f357', '1f35f',
    '1f355', '1f32d', '1f354', '1f32e', '1f32f', '1f959', '1f9c6', '1f372', '1f958', '1f35c',
    '1f35d', '1f363', '1f371', '1f35b', '1f359', '1f35a', '1f358', '1f365', '1f361', '1f362',
    '1f364', '1f366', '1f367', '1f368', '1f369', '1f36a', '1f382', '1f370', '1f9c1', '1f36e',
    '1f36c', '1f36d', '1f36b', '1f37f', '1f9c2', '1f9c3', '1f9c4', '1f9c5', '1f9c7', '1f9c8',
    '1f9c9', '1f9ca', '1f37a', '1f37b', '1f377', '1f378', '1f379', '1f37e', '1f376', '2615',
    '1f375', '1f9cb', '1f964', '1f962', '1f37d', '1f944', '1f374', '1f52a', '1fad6', '1fad7'
  ].map(emoji) },

  nature: { name: '🌿 Nature', items: [
    '1f332', '1f333', '1f334', '1f335', '1f337', '1f33b', '1f339', '1f340', '1f341', '1f342',
    '1f343', '1f344', '2600', '1f319', '2b50', '2601', '26a1', '1f308', '2602', '2744',
    '1f30d', '1f30e', '1f30f', '1f311', '1f312', '1f313', '1f314', '1f315', '1f316', '1f317',
    '1f318', '1f31a', '1f31b', '1f31c', '1f31d', '1f31e', '1f31f', '1f320', '1f321', '26c5',
    '26c8', '1f324', '1f325', '1f326', '1f327', '1f328', '1f329', '1f32a', '1f32b', '1f32c',
    '1f300', '2614', '26f1', '2603', '26c4', '2604', '1f525', '1f4a7', '1f30a', '1f338',
    '1f33a', '1f33c', '1f33e', '1f33f', '2618', '1f331', '1f4ae', '1f3f5', '1fab4', '1fabb',
    '1fab7', '1fab8', '1fab9', '1faba', '1f940', '1f490', '1f30b', '1f3d4', '1f3d5', '1f3d6'
  ].map(emoji) },

  sports: { name: '⚽ Sports', items: [
    '26bd', '1f3c0', '1f3c8', '26be', '1f94e', '1f3be', '1f3d0', '1f3c9', '1f94f', '1fa83',
    '1f3b1', '1f3d3', '1f3f8', '1f3d2', '1f3d1', '1f94d', '1f3cf', '1f945', '26f3', '1fa81',
    '1f94a', '1f94b', '1f93a', '1f3c7', '26f7', '1f3c2', '1f3cb', '1f93c', '1f93d', '1f93e',
    '1f3ca', '1f6b4', '1f6b5', '1f938', '1f93b', '1f3af', '1f3a3', '1f3bd', '1f3bf', '1f6f7',
    '1f94c', '1fa80', '1fa82', '1f3c6', '1f3c5', '1f947', '1f948', '1f949', '1f396', '1f397',
    '1f3aa', '1f3ad', '1f3a8', '1f3ac', '1f3a4', '1f3a7', '1f3b5', '1f3b6', '1f3b8', '1f3b9'
  ].map(emoji) },

  travel: { name: '✈️ Travel', items: [
    '1f697', '1f695', '1f699', '1f68c', '1f68e', '1f3ce', '1f693', '1f691', '1f692', '1f690',
    '1f69a', '1f69b', '1f69c', '1f3cd', '1f6f5', '1f6fa', '1f6b2', '1f6f4', '1f6f9', '1f6fc',
    '1f68f', '1f6e3', '1f6e4', '26fd', '1f6a7', '2693', '26f5', '1f6f6', '1f6a4', '1f6f3',
    '26f4', '1f6e5', '1f6a2', '2708', '1f6e9', '1f6eb', '1f6ec', '1fa82', '1f4ba', '1f681',
    '1f69f', '1f6a0', '1f6a1', '1f680', '1f6f8', '1f6f0', '1f6ce', '1f9f3', '1f3e0', '1f3e1',
    '1f3d8', '1f3d9', '1f3da', '1f3db', '1f3dc', '1f3dd', '1f3de', '1f3df', '1f5fc', '1f5fd'
  ].map(emoji) },

  objects: { name: '💎 Objects', items: [
    '1f4bb', '1f4f1', '1f4f7', '1f4fa', '1f579', '1f3ae', '1f4fb', '1f52d', '1f52c', '1f4a1',
    '1f4d6', '1f4b0', '1f48e', '1f381', '1f388', '1f389', '1f392', '1f45f', '1f451', '1f3a9',
    '231a', '1f4f2', '1f4f8', '1f4f9', '1f50d', '1f50e', '1f50f', '1f510', '1f511', '1f512',
    '1f513', '1f514', '1f515', '1f526', '1f527', '1f528', '1f529', '1f52a', '1f52e', '1f52f',
    '1f530', '1f531', '1f532', '1f533', '2702', '1f4ce', '1f587', '1f4cc', '1f4cd', '1f4cf',
    '1f4d0', '1f4da', '1f4d5', '1f4d7', '1f4d8', '1f4d9', '1f4d3', '1f4d4', '1f4dd', '1f4bc',
    '1f4e6', '1f4e7', '1f4e8', '1f4e9', '1f4ea', '1f4eb', '1f4ec', '1f4ed', '1f4ee', '1f50a',
    '1fa9f', '1f4a3', '1f4a2', '1f4ab', '1f4ac', '1f4ad', '1f4ae', '1f5e8', '1f5ef', '1f321'
  ].map(emoji) },

  shapes: { name: '⬡ Shapes', items: [
    ...['star', 'heart', 'ring', 'polygon', 'burst', 'circle', 'square', 'triangle', 'diamond', 'hexagon', 'pentagon', 'arrow', 'wave', 'shield', 'badge', 'ribbon'].map(seed => dicebear('shapes', seed)),
    ...['2b50', '2b55', '274c', '2714', '2795', '2796', '2716', '2797', '1f4a0', '1f534',
         '1f535', '26aa', '26ab', '1f7e0', '1f7e1', '1f7e2', '1f7e3', '1f7e4', '1f536', '1f537',
         '1f538', '1f539', '1f53a', '1f53b', '1f53c', '1f53d', '25aa', '25ab', '25fe', '25fd',
         '25fc', '25fb', '2b1b', '2b1c', '1f7e5', '1f7e7', '1f7e8', '1f7e9', '1f7ea', '1f7eb',
         '25b6', '25c0', '23e9', '23ea', '23eb', '23ec', '2753', '2754', '2755', '2757',
         '2733', '2734', '2747', '203c', '2049', '3030', '00a9', '00ae', '2122', '1f170'].map(emoji)
  ]},

  avatars: { name: '👤 Avatars', items: [
    ...Array.from({length: 20}).map((_, i) => dicebear('avataaars', `Avatar${i}`)),
    ...Array.from({length: 20}).map((_, i) => dicebear('bottts', `Bot${i}`)),
    ...Array.from({length: 15}).map((_, i) => dicebear('adventurer', `Adv${i}`)),
    ...Array.from({length: 15}).map((_, i) => dicebear('fun-emoji', `Fun${i}`)),
    ...Array.from({length: 15}).map((_, i) => dicebear('micah', `Micah${i}`)),
    ...Array.from({length: 15}).map((_, i) => dicebear('lorelei', `Lore${i}`)),
    ...Array.from({length: 10}).map((_, i) => dicebear('notionists', `Notion${i}`)),
    ...Array.from({length: 10}).map((_, i) => dicebear('pixel-art', `Pixel${i}`))
  ]},

  flags: { name: '🏁 Flags', items: [
    '1f3c1', '1f6a9', '1f38c', '1f3f4', '1f3f3', '1f1fa-1f1f8', '1f1ec-1f1e7', '1f1e9-1f1ea',
    '1f1eb-1f1f7', '1f1ef-1f1f5', '1f1e8-1f1f3', '1f1f0-1f1f7', '1f1e7-1f1f7', '1f1ee-1f1f3',
    '1f1ee-1f1f9', '1f1ea-1f1f8', '1f1f7-1f1fa', '1f1e8-1f1e6', '1f1e6-1f1fa', '1f1f2-1f1fd',
    '1f1f9-1f1f7', '1f1f3-1f1f1', '1f1f8-1f1ea', '1f1f3-1f1f4', '1f1e9-1f1f0', '1f1eb-1f1ee',
    '1f1f5-1f1f1', '1f1e8-1f1ed', '1f1e6-1f1f9', '1f1e7-1f1ea', '1f1f5-1f1f9', '1f1ec-1f1f7',
    '1f1ee-1f1ea', '1f1f8-1f1ec', '1f1f9-1f1ed', '1f1fb-1f1f3', '1f1f5-1f1ed', '1f1ee-1f1e9',
    '1f1f2-1f1fe', '1f1e6-1f1ea', '1f1f8-1f1e6', '1f1ea-1f1ec', '1f1ff-1f1e6', '1f1f3-1f1ec',
    '1f1f0-1f1ea', '1f1ec-1f1ed', '1f1e8-1f1f4', '1f1e6-1f1f7', '1f1e8-1f1f1', '1f1f5-1f1ea'
  ].map(emoji) }
}

type LeftTab = 'canvas' | 'layers' | 'settings'
type RightTab = 'border' | 'text' | 'templates' | 'filters' | 'frames' | 'export'
type TemplateCategory = keyof typeof TEMPLATE_CATEGORIES

const LEFT_TABS = [
  { key: 'canvas' as LeftTab, icon: Monitor, label: 'Canvas' },
  { key: 'layers' as LeftTab, icon: Layers, label: 'Layers' },
  { key: 'settings' as LeftTab, icon: Settings, label: 'Settings' },
]

const RIGHT_TABS = [
  { key: 'border' as RightTab, icon: Square, label: 'Border' },
  { key: 'text' as RightTab, icon: Type, label: 'Text' },
  { key: 'filters' as RightTab, icon: Palette, label: 'Filters' },
  { key: 'frames' as RightTab, icon: Frame, label: 'Frames' },
  { key: 'templates' as RightTab, icon: LayoutTemplate, label: 'Assets' },
  { key: 'export' as RightTab, icon: Share2, label: 'Export' },
]


// ─── Component ─────────────────────────────────────────────
export default function MakerPage() {
  // File & processing state
  const [file, setFile] = useState<File | null>(null)
  const [originalUrl, setOriginalUrl] = useState<string | null>(null)
  const [processedUrl, setProcessedUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  // Canvas elements
  const [elements, setElements] = useState<CanvasElement[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [isProcessingCanvas, setIsProcessingCanvas] = useState(false)
  const dragRef = useRef<{ dragIdx: number; overIdx: number } | null>(null)
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null)

  // Panel state
  const [leftTab, setLeftTab] = useState<LeftTab>('canvas')
  const [rightTab, setRightTab] = useState<RightTab>('border')
  const [activeTemplateCategory, setActiveTemplateCategory] = useState<TemplateCategory>('emojis')

  // Canvas settings
  const [canvasW, setCanvasW] = useState(600)
  const [canvasH, setCanvasH] = useState(600)
  const [zoom, setZoom] = useState(100)
  const [exportFormat, setExportFormat] = useState<'png' | 'jpeg' | 'webp'>('png')
  const [exportQuality, setExportQuality] = useState(90)

  // Border controls
  const [outlineWidth, setOutlineWidth] = useState(15)
  const [shadowBlur, setShadowBlur] = useState(15)
  const [outlineColor, setOutlineColor] = useState('#ffffff')
  const [outlineGradient, setOutlineGradient] = useState<GradientPreset | null>(null)

  // Text controls
  const [stickerText, setStickerText] = useState('')
  const [textColor, setTextColor] = useState('#ffffff')
  const [textOutlineColor, setTextOutlineColor] = useState('#000000')
  const [fontFamily, setFontFamily] = useState('Impact')
  const [fontSize, setFontSize] = useState(60)
  const [textStrokeWidth, setTextStrokeWidth] = useState(2)

  // Filter & frame state
  const [activeFilter, setActiveFilter] = useState('none')
  const [activeFilterCategory, setActiveFilterCategory] = useState<string>('color')
  const [activeFrame, setActiveFrame] = useState('none')
  const [activeFrameCategory, setActiveFrameCategory] = useState<string>('basic')
  const [frameBorderWidth, setFrameBorderWidth] = useState(4)
  const [isApplyingFilter, setIsApplyingFilter] = useState(false)
  const [isUpscaling, setIsUpscaling] = useState(false)
  const [isExportingPlatform, setIsExportingPlatform] = useState(false)
  const [selectedAnimation, setSelectedAnimation] = useState('bounce')
  const [isExportingGif, setIsExportingGif] = useState(false)
  const [isSmartCropping, setIsSmartCropping] = useState(false)

  // ─── Selected text syncing ──────────────────────────────
  const selectedElement = elements.find(e => e.id === selectedId)
  const isTextSelected = selectedElement?.type === 'text'

  // When selecting a text element, populate controls with its values and switch tab
  useEffect(() => {
    if (!isTextSelected || !selectedElement) return
    setRightTab('text')
    setStickerText(selectedElement.text || '')
    setFontFamily(selectedElement.fontFamily || 'Anton')
    setFontSize(selectedElement.fontSize || 60)
    setTextColor(selectedElement.fill || '#ffffff')
    setTextOutlineColor(selectedElement.stroke || '#000000')
    setTextStrokeWidth(selectedElement.strokeWidth || 2)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId])

  // Update a property on the selected text element
  const updateSelectedText = useCallback((patch: Partial<CanvasElement>) => {
    if (!selectedId) return
    setElements(prev => prev.map(el =>
      el.id === selectedId && el.type === 'text' ? { ...el, ...patch } : el
    ))
  }, [selectedId, setElements])

  // ─── generateOutline ────────────────────────────────────
  const generateOutline = useCallback(async (
    imageUrl: string, width: number, blur: number, color: string, gradient?: GradientPreset | null
  ) => {
    return new Promise<string>((resolve, reject) => {
      const img = new Image()
      if (!imageUrl.startsWith('data:') && !imageUrl.startsWith('blob:')) {
        img.crossOrigin = "anonymous"
      }
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        if (!ctx) return reject('No 2d context')
        const padding = width + blur + 10
        canvas.width = img.width + padding * 2
        canvas.height = img.height + padding * 2
        const silCanvas = document.createElement('canvas')
        silCanvas.width = img.width
        silCanvas.height = img.height
        const silCtx = silCanvas.getContext('2d')
        if (!silCtx) return reject('No 2d context')
        silCtx.drawImage(img, 0, 0)
        silCtx.globalCompositeOperation = 'source-in'
        if (gradient) {
          const grad = silCtx.createLinearGradient(0, 0, silCanvas.width, silCanvas.height)
          grad.addColorStop(0, gradient.colors[0])
          grad.addColorStop(1, gradient.colors[1])
          silCtx.fillStyle = grad
        } else {
          silCtx.fillStyle = color
        }
        silCtx.fillRect(0, 0, silCanvas.width, silCanvas.height)
        const outCanvas = document.createElement('canvas')
        outCanvas.width = canvas.width
        outCanvas.height = canvas.height
        const outCtx = outCanvas.getContext('2d')
        if (!outCtx) return reject('No 2d context')
        const centerX = padding
        const centerY = padding
        const steps = 36
        for (let i = 0; i < steps; i++) {
          const angle = (i * Math.PI * 2) / steps
          const x = centerX + Math.cos(angle) * width
          const y = centerY + Math.sin(angle) * width
          outCtx.drawImage(silCanvas, x, y)
        }
        ctx.shadowColor = 'rgba(0, 0, 0, 0.4)'
        ctx.shadowBlur = blur
        ctx.shadowOffsetX = 0
        ctx.shadowOffsetY = 4
        ctx.drawImage(outCanvas, 0, 0)
        ctx.shadowColor = 'transparent'
        ctx.shadowBlur = 0
        ctx.shadowOffsetX = 0
        ctx.shadowOffsetY = 0
        ctx.drawImage(img, centerX, centerY)
        resolve(canvas.toDataURL('image/png'))
      }
      img.onerror = () => reject(new Error('Failed to load image for canvas processing'))
      img.src = imageUrl
    })
  }, [])

  useEffect(() => {
    if (!processedUrl) return
    let isMounted = true
    setIsProcessingCanvas(true)
    generateOutline(processedUrl, outlineWidth, shadowBlur, outlineColor, outlineGradient)
      .then(url => {
        if (!isMounted) return
        // Load image to get natural dimensions for proper centering
        const img = new Image()
        img.onload = () => {
          if (!isMounted) return
          const imgW = img.naturalWidth
          const imgH = img.naturalHeight
          // Fit to ~80% of canvas, preserving aspect ratio
          const padding = 0.8
          const maxW = canvasW * padding
          const maxH = canvasH * padding
          const scale = Math.min(maxW / imgW, maxH / imgH, 1)
          const fitW = imgW * scale
          const fitH = imgH * scale
          // Center on canvas
          const cx = (canvasW - fitW) / 2
          const cy = (canvasH - fitH) / 2

          setElements(prev => {
            const existing = prev.find(e => e.type === 'main-sticker')
            if (existing) {
              return prev.map(e => e.type === 'main-sticker' ? { ...e, src: url } : e)
            } else {
              return [{ id: 'main-sticker', type: 'main-sticker' as const, src: url, x: cx, y: cy, width: fitW, height: fitH }, ...prev]
            }
          })
          setIsProcessingCanvas(false)
        }
        img.onerror = () => {
          if (isMounted) { setError('Failed to load processed image'); setIsProcessingCanvas(false) }
        }
        img.src = url
      })
      .catch(err => {
        console.error("Canvas error:", err)
        if (isMounted) { setError("Failed to generate sticker outline"); setIsProcessingCanvas(false) }
      })
    return () => { isMounted = false }
  }, [processedUrl, outlineWidth, shadowBlur, outlineColor, outlineGradient, generateOutline, canvasW, canvasH])

  // ─── onDrop ─────────────────────────────────────────────
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const selectedFile = acceptedFiles[0]
    if (!selectedFile) return
    setFile(selectedFile)
    const objectUrl = URL.createObjectURL(selectedFile)
    setOriginalUrl(objectUrl)
    setProcessedUrl(null)
    setElements([])
    setError(null)
    setLoading(true)
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.readAsDataURL(selectedFile)
        reader.onload = (e) => {
          const img = new Image()
          img.onload = () => {
            const canvas = document.createElement('canvas')
            let width = img.width
            let height = img.height
            const MAX = 1024
            if (width > height) { if (width > MAX) { height *= MAX / width; width = MAX } }
            else { if (height > MAX) { width *= MAX / height; height = MAX } }
            canvas.width = width
            canvas.height = height
            const ctx = canvas.getContext('2d')
            if (ctx) {
              ctx.drawImage(img, 0, 0, width, height)
              const mimeType = selectedFile.type === 'image/png' ? 'image/png' : 'image/jpeg'
              const quality = mimeType === 'image/jpeg' ? 0.8 : undefined
              resolve(canvas.toDataURL(mimeType, quality))
            } else { resolve(e.target?.result as string) }
          }
          img.onerror = () => reject(new Error('Failed to load image'))
          img.src = e.target?.result as string
        }
        reader.onerror = error => reject(error)
      })
      // Try client-side background removal first (free, no API key needed)
      let bgRemoved = false
      try {
        const { removeBackground } = await import('@imgly/background-removal')
        const imgBlob = await fetch(base64).then(r => r.blob())
        const resultBlob = await removeBackground(imgBlob, {
          progress: (key: string, current: number, total: number) => {
            if (key === 'compute:inference') {
              const pct = Math.round((current / total) * 100)
              console.log(`[bg-removal] Processing: ${pct}%`)
            }
          },
        })
        const reader2 = new FileReader()
        const resultUrl = await new Promise<string>((resolve) => {
          reader2.onload = () => resolve(reader2.result as string)
          reader2.readAsDataURL(resultBlob)
        })
        setProcessedUrl(resultUrl)
        bgRemoved = true
      } catch (clientErr) {
        console.warn('[bg-removal] Client-side failed, trying API fallback...', clientErr)
      }

      // Fallback to server API if client-side failed
      if (!bgRemoved) {
        try {
          const response = await fetch('/api/remove-bg', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ imageUrl: base64 })
          })
          if (!response.ok) {
            const errData = await response.json()
            throw new Error(errData.error || 'Failed to remove background')
          }
          const resultData = await response.json()
          setProcessedUrl(resultData.url)
        } catch (apiErr: any) {
          console.warn('[bg-removal] API fallback also failed:', apiErr.message)
          // Use original image if both methods fail
          setProcessedUrl(objectUrl)
          toast('Background removal unavailable — using original image', 'info')
        }
      }
    } catch (err: any) {
      console.error(err)
      const msg = err.message || 'An unexpected error occurred.'
      const cleanMsg = msg.includes('{') ? msg.split('{')[0].trim() || 'Background removal failed.' : msg.length > 120 ? msg.slice(0, 120) + '...' : msg
      setError(cleanMsg)
      setProcessedUrl(objectUrl)
    } finally { setLoading(false) }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/jpeg': [], 'image/png': [], 'image/webp': [] },
    maxFiles: 1
  })

  // ─── Export ─────────────────────────────────────────────
  const handleExport = async (dataUrl: string) => {
    const ext = exportFormat
    downloadUrl(dataUrl, `sticker.${ext}`)
    toast('Sticker exported! 🎨', 'success')
  }
  const [exportAction, setExportAction] = useState<'download' | 'platform' | 'gif' | null>(null)
  const pendingPlatformFormatRef = useRef<string | null>(null)
  useEffect(() => {
    if (exportAction && (window as any).exportCanvas) { (window as any).exportCanvas() }
  }, [exportAction])
  const handleCanvasExport = async (dataUrl: string) => {
    const action = exportAction
    setExportAction(null)
    if (action === 'download') {
      handleExport(dataUrl)
    } else if (action === 'platform' && pendingPlatformFormatRef.current) {
      // Platform export with full canvas
      setIsExportingPlatform(true)
      try {
        const result = await exportForPlatform(dataUrl, pendingPlatformFormatRef.current, 'sticker')
        downloadBlob(result.blob, result.filename)
        const sizeStr = formatFileSize(result.fileSize)
        const statusMsg = result.withinLimits ? '✅' : '⚠️ Over size limit'
        toast(`Exported for ${result.format.label} (${sizeStr}) ${statusMsg}`, result.withinLimits ? 'success' : 'info')
      } catch (err) {
        console.error('Platform export error:', err)
        toast('Export failed', 'error')
      } finally {
        setIsExportingPlatform(false)
        pendingPlatformFormatRef.current = null
      }
    } else if (action === 'gif') {
      // GIF export with full canvas
      setIsExportingGif(true)
      try {
        const blob = await createAnimatedGif(dataUrl, selectedAnimation, canvasW)
        downloadBlob(blob, `sticker_${selectedAnimation}.gif`)
        toast('Animated GIF exported!', 'success')
      } catch (err) {
        console.error('GIF export error:', err)
        toast('GIF export failed', 'error')
      } finally {
        setIsExportingGif(false)
      }
    }
  }

  // ─── Text handlers ──────────────────────────────────────
  const handleAddText = () => {
    if (!stickerText) return
    setElements(prev => [...prev, {
      id: `text-${Date.now()}`, type: 'text', text: stickerText, x: 150, y: 150,
      fontSize, fontFamily, fill: textColor, stroke: textOutlineColor, strokeWidth: textStrokeWidth,
    }])
    setStickerText('')
    toast('Text added to canvas', 'info')
  }

  const handleAddTextPreset = (preset: typeof TEXT_PRESETS[0]) => {
    setElements(prev => [...prev, {
      id: `text-${Date.now()}`, type: 'text', text: 'Text', x: 150, y: 150,
      fontSize: preset.size, fontFamily: preset.font, fill: preset.fill, stroke: preset.stroke, strokeWidth: preset.strokeWidth,
    }])
    toast(`Added "${preset.label}" text preset`, 'info')
  }

  const handleAddTemplate = (src: string) => {
    setElements(prev => [...prev, {
      id: `template-${Date.now()}`, type: 'image', src, x: 150, y: 150,
    }])
  }

  // ─── Layer helpers ──────────────────────────────────────
  const moveElement = (id: string, dir: 'up' | 'down') => {
    setElements(prev => {
      const idx = prev.findIndex(e => e.id === id)
      if (idx < 0) return prev
      const newArr = [...prev]
      const swap = dir === 'up' ? idx + 1 : idx - 1
      if (swap < 0 || swap >= newArr.length) return prev
      ;[newArr[idx], newArr[swap]] = [newArr[swap], newArr[idx]]
      return newArr
    })
  }

  const duplicateElement = (id: string) => {
    const el = elements.find(e => e.id === id)
    if (!el) return
    setElements(prev => [...prev, { ...el, id: `${el.type}-${Date.now()}`, x: el.x + 20, y: el.y + 20 }])
    toast('Element duplicated', 'info')
  }

  const deleteElement = (id: string) => {
    setElements(prev => prev.filter(e => e.id !== id))
    if (selectedId === id) setSelectedId(null)
  }

  const getElementLabel = (el: CanvasElement) => {
    if (el.type === 'main-sticker') return '🎯 Main Sticker'
    if (el.type === 'text') return `Aa "${(el.text || '').slice(0, 12)}"`
    return '🖼️ Image'
  }

  const handleReset = () => {
    setFile(null); setOriginalUrl(null); setProcessedUrl(null); setElements([]); setError(null)
    setActiveFilter('none'); setActiveFrame('none')
  }

  // ─── Filter handler ─────────────────────────────────────
  const handleApplyFilter = async (filterId: string) => {
    if (!processedUrl || isApplyingFilter) return
    setActiveFilter(filterId)
    setIsApplyingFilter(true)
    try {
      if (filterId === 'none') {
        // Restore to clean outline from processedUrl
        const cleanUrl = await generateOutline(processedUrl, outlineWidth, shadowBlur, outlineColor, outlineGradient)
        setElements(prev => prev.map(e =>
          e.type === 'main-sticker' ? { ...e, src: cleanUrl } : e
        ))
      } else {
        const filteredUrl = await applyFilterToImage(processedUrl, filterId)
        setElements(prev => prev.map(e =>
          e.type === 'main-sticker' ? { ...e, src: filteredUrl } : e
        ))
      }
    } catch (err) {
      console.error('Filter error:', err)
      toast('Failed to apply filter', 'error')
    } finally {
      setIsApplyingFilter(false)
    }
  }

  // ─── Frame handler ──────────────────────────────────────
  const handleApplyFrame = async (frameId: string) => {
    if (!processedUrl) return
    setActiveFrame(frameId)
    try {
      if (frameId === 'none') {
        // Restore to clean outline from processedUrl
        const cleanUrl = await generateOutline(processedUrl, outlineWidth, shadowBlur, outlineColor, outlineGradient)
        setElements(prev => prev.map(e =>
          e.type === 'main-sticker' ? { ...e, src: cleanUrl } : e
        ))
      } else {
        const framedUrl = await applyFrameToImage(processedUrl, frameId, outlineColor, frameBorderWidth)
        setElements(prev => prev.map(e =>
          e.type === 'main-sticker' ? { ...e, src: framedUrl } : e
        ))
      }
    } catch (err) {
      console.error('Frame error:', err)
      toast('Failed to apply frame', 'error')
    }
  }

  // ─── AI Upscale handler ─────────────────────────────────
  const handleUpscale = async () => {
    if (!processedUrl || isUpscaling) return
    setIsUpscaling(true)
    try {
      const base64 = processedUrl.startsWith('data:')
        ? processedUrl.split(',')[1]
        : await fetch(processedUrl).then(r => r.arrayBuffer()).then(b => btoa(String.fromCharCode(...new Uint8Array(b))))
      const mimeType = processedUrl.startsWith('data:image/png') ? 'image/png' : 'image/jpeg'
      
      const res = await fetch('/api/upscale', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64, mimeType, scale: 2 }),
      })
      if (!res.ok) throw new Error('Upscale failed')
      const data = await res.json()
      const upscaledUrl = `data:${data.mimeType};base64,${data.imageBase64}`
      setProcessedUrl(upscaledUrl)
      toast('Image upscaled! ✨', 'success')
    } catch (err) {
      console.error('Upscale error:', err)
      toast('Upscaling failed. AI service may be unavailable.', 'error')
    } finally {
      setIsUpscaling(false)
    }
  }

  // ─── GIF export handler ─────────────────────────────────
  const handleGifExport = async () => {
    const mainSticker = elements.find(e => e.type === 'main-sticker')
    if (!mainSticker?.src) {
      toast('No sticker to animate', 'error')
      return
    }
    setExportAction('gif')
  }

  // ─── Smart crop handler ─────────────────────────────────
  const handleSmartCrop = async () => {
    if (!processedUrl || isSmartCropping) return
    setIsSmartCropping(true)
    try {
      const result = await smartCrop(processedUrl, { padding: 20, square: true })
      setProcessedUrl(result.dataUrl)
      setElements(prev => prev.map(e =>
        e.type === 'main-sticker' ? { ...e, src: result.dataUrl } : e
      ))
      toast(`Smart cropped (${result.cropRect.w}×${result.cropRect.h})`, 'success')
    } catch (err) {
      console.error('Smart crop error:', err)
      toast('Smart crop failed', 'error')
    } finally {
      setIsSmartCropping(false)
    }
  }

  // ─── Platform export handler ────────────────────────────
  const handlePlatformExport = async (formatId: string) => {
    const mainSticker = elements.find(e => e.type === 'main-sticker')
    if (!mainSticker?.src) {
      toast('No sticker to export', 'error')
      return
    }
    pendingPlatformFormatRef.current = formatId
    setExportAction('platform')
  }

  // ═══════════════════════════════════════════════════════
  // No file: full-canvas dropzone
  // ═══════════════════════════════════════════════════════
  if (!file) {
    return (
      <div className="flex-1 flex items-center justify-center p-6 md:pb-16">
        <div
          {...getRootProps()}
          className={`w-full max-w-3xl aspect-4/3 rounded-3xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all duration-300 ${
            isDragActive
              ? 'border-[#FF6B4A] bg-[#FF6B4A]/5 scale-[1.01]'
              : 'border-(--overlay-border) hover:border-(--overlay-border-hover) hover:bg-(--card-bg)'
          }`}
        >
          <input {...getInputProps()} />
          <div className="w-16 h-16 rounded-2xl bg-(--card-bg-hover) flex items-center justify-center mb-6">
            <UploadCloud className="w-7 h-7 text-(--text-tertiary)" />
          </div>
          <p className="text-lg font-semibold text-(--text-secondary) mb-1">
            {isDragActive ? 'Drop your image here' : 'Drop an image to start'}
          </p>
          <p className="text-sm text-(--text-muted)">PNG, JPG, or WebP • Max 5MB</p>
          <button className="mt-6 px-6 py-2.5 rounded-xl bg-(--card-bg-hover) text-sm font-semibold text-(--text-secondary) hover:bg-white/10 hover:text-white transition-all cursor-pointer">
            Browse Files
          </button>
        </div>
      </div>
    )
  }

  // ═══════════════════════════════════════════════════════
  // Pro Editor: Left Panel | Canvas | Right Panel
  // ═══════════════════════════════════════════════════════
  return (
    <div className="flex-1 flex overflow-hidden relative">
      {error && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 px-4 py-2.5 bg-red-950/80 text-red-400 border border-red-900/50 rounded-xl text-sm backdrop-blur-sm animate-slide-up">
          {error}
        </div>
      )}

      {/* ════════ LEFT PANEL ════════ */}
      <div className="hidden md:flex w-[280px] shrink-0 bg-(--panel-bg) border-r border-(--overlay-border) flex-col overflow-hidden">
        {/* Header */}
        <SidebarHeader
          gradient="from-[#FF6B4A] to-[#F59E0B]"
          icon={<Layers className="w-4.5 h-4.5 text-white" />}
          title="Sticker Maker"
          subtitle="Create & customize stickers"
          onReset={handleReset}
          className="p-4 pb-3 border-b border-(--overlay-border)"
        />
        {/* Tab strip */}
        <div className="flex border-b border-(--overlay-border)">
          {LEFT_TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setLeftTab(tab.key)}
              className={`flex-1 flex flex-col items-center gap-1 py-3 text-[10px] font-semibold transition-all cursor-pointer ${
                leftTab === tab.key
                  ? 'text-[#FF6B4A] bg-[#FF6B4A]/5 border-b-2 border-[#FF6B4A]'
                  : 'text-(--text-muted) hover:text-(--text-secondary) hover:bg-(--card-bg)'
              }`}
            >
              <tab.icon className="w-4 h-4" strokeWidth={leftTab === tab.key ? 2.2 : 1.5} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* ── CANVAS TAB ── */}
          {leftTab === 'canvas' && (
            <div className="space-y-4">
              <PanelSection title="Canvas Size">
                <div className="grid grid-cols-2 gap-1.5">
                  {CANVAS_SIZES.map(size => (
                    <button
                      key={size.label}
                      onClick={() => { setCanvasW(size.w); setCanvasH(size.h) }}
                      className={`py-2 px-3 rounded-lg text-[11px] font-semibold text-left transition-all cursor-pointer ${
                        canvasW === size.w && canvasH === size.h
                          ? 'bg-[#FF6B4A]/15 text-[#FF6B4A] border border-[#FF6B4A]/20'
                          : 'bg-(--card-bg) text-(--text-tertiary) border border-(--overlay-border) hover:bg-(--card-bg-hover) hover:text-(--text-secondary)'
                      }`}
                    >
                      {size.label}
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-2 mt-3">
                  <div>
                    <label className="text-[10px] text-(--text-muted) block mb-1">Width</label>
                    <input type="number" value={canvasW} onChange={e => setCanvasW(Number(e.target.value))} className="w-full px-2 py-1.5 bg-[var(--input-bg)] border border-(--overlay-border) rounded-lg text-xs text-(--text-secondary) focus:border-[#FF6B4A]/30 focus:outline-none" />
                  </div>
                  <div>
                    <label className="text-[10px] text-(--text-muted) block mb-1">Height</label>
                    <input type="number" value={canvasH} onChange={e => setCanvasH(Number(e.target.value))} className="w-full px-2 py-1.5 bg-[var(--input-bg)] border border-(--overlay-border) rounded-lg text-xs text-(--text-secondary) focus:border-[#FF6B4A]/30 focus:outline-none" />
                  </div>
                </div>
              </PanelSection>



              <PanelSection title="Image">
                <div className="space-y-2">
                  <div {...getRootProps()} className="cursor-pointer">
                    <input {...getInputProps()} />
                    <Button variant="outline" size="sm" className="w-full"><UploadCloud className="w-4 h-4" /> Replace Image</Button>
                  </div>
                </div>
              </PanelSection>
            </div>
          )}

          {/* ── LAYERS TAB ── */}
          {leftTab === 'layers' && (
            <div className="space-y-1">
              {elements.length === 0 ? (
                <p className="text-xs text-(--text-muted) text-center py-8">No elements on canvas</p>
              ) : (
                elements.slice().reverse().map((el, visualIdx) => {
                  const realIdx = elements.length - 1 - visualIdx
                  return (
                    <div key={el.id}>
                      {/* Drop indicator line */}
                      {dragOverIdx === visualIdx && (
                        <div className="h-0.5 bg-[#FF6B4A] rounded-full mx-2 my-0.5 transition-all" />
                      )}
                      <div
                        draggable
                        onDragStart={() => { dragRef.current = { dragIdx: realIdx, overIdx: realIdx } }}
                        onDragOver={(e) => {
                          e.preventDefault()
                          if (dragRef.current) dragRef.current.overIdx = realIdx
                          setDragOverIdx(visualIdx)
                        }}
                        onDragEnd={() => {
                          const drag = dragRef.current
                          dragRef.current = null
                          setDragOverIdx(null)
                          if (drag && drag.dragIdx !== drag.overIdx) {
                            setElements(prev => {
                              const next = [...prev]
                              const [moved] = next.splice(drag.dragIdx, 1)
                              next.splice(drag.overIdx, 0, moved)
                              return next
                            })
                          }
                        }}
                        onClick={() => setSelectedId(el.id)}
                        className={`flex items-center gap-2 px-3 py-2.5 rounded-lg cursor-grab active:cursor-grabbing transition-all group ${
                          selectedId === el.id
                            ? 'bg-[#FF6B4A]/10 border border-[#FF6B4A]/20 text-(--text-primary)'
                            : 'bg-(--card-bg) border border-transparent text-(--text-tertiary) hover:bg-(--card-bg-hover) hover:text-(--text-secondary)'
                        }`}
                      >
                        <GripVertical className="w-3 h-3 text-(--text-muted) shrink-0" />
                        <span className="text-xs font-medium flex-1 truncate">{getElementLabel(el)}</span>
                        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={(e) => { e.stopPropagation(); moveElement(el.id, 'up') }} className="w-5 h-5 rounded flex items-center justify-center hover:bg-(--card-bg-hover) cursor-pointer"><ChevronUp className="w-3 h-3" /></button>
                          <button onClick={(e) => { e.stopPropagation(); moveElement(el.id, 'down') }} className="w-5 h-5 rounded flex items-center justify-center hover:bg-(--card-bg-hover) cursor-pointer"><ChevronDown className="w-3 h-3" /></button>
                          <button onClick={(e) => { e.stopPropagation(); duplicateElement(el.id) }} className="w-5 h-5 rounded flex items-center justify-center hover:bg-(--card-bg-hover) cursor-pointer"><Plus className="w-3 h-3" /></button>
                          <button onClick={(e) => { e.stopPropagation(); deleteElement(el.id) }} className="w-5 h-5 rounded flex items-center justify-center text-red-400 hover:bg-red-400/10 cursor-pointer"><Trash2 className="w-3 h-3" /></button>
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
              {/* Drop indicator at the very bottom */}
              {dragOverIdx === elements.length && (
                <div className="h-0.5 bg-[#FF6B4A] rounded-full mx-2 my-0.5" />
              )}
            </div>
          )}

          {/* ── SETTINGS TAB ── */}
          {leftTab === 'settings' && (
            <div className="space-y-4">
              <PanelSection title="Export Format">
                <div className="flex gap-1">
                  {(['png', 'jpeg', 'webp'] as const).map(fmt => (
                    <button
                      key={fmt}
                      onClick={() => setExportFormat(fmt)}
                      className={`flex-1 py-2 rounded-lg text-xs font-semibold uppercase transition-all cursor-pointer ${
                        exportFormat === fmt ? 'bg-[#FF6B4A] text-white' : 'bg-[var(--input-bg)] text-(--text-muted) hover:bg-(--card-bg-hover) hover:text-(--text-secondary)'
                      }`}
                    >
                      {fmt}
                    </button>
                  ))}
                </div>
              </PanelSection>

              {exportFormat !== 'png' && (
                <PanelSection title="Quality">
                  <div className="flex items-center gap-3">
                    <input type="range" min="10" max="100" value={exportQuality} onChange={e => setExportQuality(Number(e.target.value))} className="flex-1" style={{ background: `linear-gradient(to right, #FF6B4A ${exportQuality}%, rgba(255,255,255,0.06) ${exportQuality}%)` }} />
                    <span className="text-xs text-(--text-tertiary) font-mono w-8 text-right">{exportQuality}%</span>
                  </div>
                </PanelSection>
              )}

              <PanelSection title="Canvas Info">
                <div className="space-y-1.5 text-xs text-(--text-muted)">
                  <div className="flex justify-between"><span>Size</span><span className="text-(--text-secondary)">{canvasW}×{canvasH}</span></div>
                  <div className="flex justify-between"><span>Elements</span><span className="text-(--text-secondary)">{elements.length}</span></div>
                  <div className="flex justify-between"><span>Zoom</span><span className="text-(--text-secondary)">{zoom}%</span></div>
                </div>
              </PanelSection>

              <Button className="w-full" onClick={() => setExportAction('download')} disabled={elements.length === 0}>
                <Download className="w-4 h-4" /> Export Sticker
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* ════════ CENTER: CANVAS ════════ */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <div className="shrink-0 h-11 border-b border-(--overlay-border) bg-[var(--background)]/90 backdrop-blur-sm flex items-center justify-between px-4">
          <div className="flex items-center gap-2 text-xs text-(--text-muted)">
            <span className="font-mono">{canvasW}×{canvasH}</span>
            <span>•</span>
            <span>{elements.length} elements</span>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" className="h-7 px-2" onClick={() => setExportAction('download')} disabled={elements.length === 0}>
              <Download className="w-3.5 h-3.5" /> Export
            </Button>
          </div>
        </div>

        {/* Canvas */}
        <div className="flex-1 relative bg-(--canvas-bg) overflow-auto pb-24 lg:pb-0">
          


          {/* Canvas Controls */}
          <div className="absolute bottom-6 right-6 z-50 flex flex-col gap-3">
            {/* Undo/Redo */}
            <div className="flex flex-col gap-2 bg-[var(--panel-bg)] p-2 rounded-2xl shadow-lg border border-[var(--overlay-border)]">
              <button title="Undo" onClick={(e) => { e.stopPropagation(); }} className="w-8 h-8 flex items-center justify-center rounded-xl bg-[var(--card-bg)] hover:bg-[var(--card-bg-hover)] text-[var(--text-secondary)] transition-all cursor-pointer"><Undo2 className="w-4 h-4" /></button>
              <button title="Redo" onClick={(e) => { e.stopPropagation(); }} className="w-8 h-8 flex items-center justify-center rounded-xl bg-[var(--card-bg)] hover:bg-[var(--card-bg-hover)] text-[var(--text-secondary)] transition-all cursor-pointer"><Redo2 className="w-4 h-4" /></button>
            </div>
            
            {/* Zoom */}
            <div className="flex flex-col gap-2 bg-[var(--panel-bg)] p-2 rounded-2xl shadow-xl border border-[var(--overlay-border)]">
              <button onClick={() => setZoom(z => Math.min(200, z + 25))} className="w-8 h-8 flex items-center justify-center rounded-xl bg-[var(--card-bg)] hover:bg-[var(--card-bg-hover)] text-[var(--text-secondary)] transition-all cursor-pointer"><ZoomIn className="w-4 h-4" /></button>
              <div className="text-[10px] font-bold text-center text-[var(--text-muted)] w-8">{zoom}%</div>
              <button onClick={() => setZoom(z => Math.max(25, z - 25))} className="w-8 h-8 flex items-center justify-center rounded-xl bg-[var(--card-bg)] hover:bg-[var(--card-bg-hover)] text-[var(--text-secondary)] transition-all cursor-pointer"><ZoomOut className="w-4 h-4" /></button>
            </div>
          </div>
          {loading ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loading text="Removing background..." size="lg" />
            </div>
          ) : isProcessingCanvas && elements.length === 0 ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loading text="Generating sticker..." size="lg" />
            </div>
          ) : (
            <div 
              style={{ 
                width: `${Math.max(100, (zoom / 100) * 100)}%`, 
                height: `${Math.max(100, (zoom / 100) * 100)}%`, 
                display: 'flex', 
                minWidth: '100%',
                minHeight: '100%' 
              }}
            >
            <div 
              className="w-full h-full flex items-center justify-center p-4 origin-top-left transition-transform duration-200"
              style={{ transform: `scale(${zoom / 100})`, width: `${(100 / zoom) * 100}%`, height: `${(100 / zoom) * 100}%` }}
            >
              <CanvasEditor
                elements={elements}
                setElements={setElements}
                selectedId={selectedId}
                setSelectedId={setSelectedId}
                onExport={handleCanvasExport}
                width={canvasW}
                height={canvasH}
              />
            </div>
            </div>
          )}
        </div>
      </div>

      {/* ════════ RIGHT PANEL ════════ */}
      <div className="hidden lg:flex w-[280px] shrink-0 bg-(--panel-bg) border-l border-(--overlay-border) flex-col overflow-hidden">
        {/* Tab strip */}
        <div className="flex border-b border-(--overlay-border)">
          {RIGHT_TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setRightTab(tab.key)}
              className={`flex-1 flex flex-col items-center gap-1 py-3 text-[10px] font-semibold transition-all cursor-pointer ${
                rightTab === tab.key
                  ? 'text-[#FF6B4A] bg-[#FF6B4A]/5 border-b-2 border-[#FF6B4A]'
                  : 'text-(--text-muted) hover:text-(--text-secondary) hover:bg-(--card-bg)'
              }`}
            >
              <tab.icon className="w-4 h-4" strokeWidth={rightTab === tab.key ? 2.2 : 1.5} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* ── BORDER TAB ── */}
          {rightTab === 'border' && (
            <div className="space-y-4 h-full overflow-y-auto">
              <PanelSection title="Outline Color">
                <div className="grid grid-cols-4 gap-1.5 mb-3">
                  {OUTLINE_PRESETS.map(p => (
                    <button
                      key={p.color}
                      onClick={() => { setOutlineColor(p.color); setOutlineGradient(null) }}
                      className={`w-full aspect-square rounded-lg border-2 transition-all cursor-pointer ${
                        outlineColor === p.color && !outlineGradient ? 'border-[#FF6B4A] scale-110' : 'border-(--overlay-border) hover:border-(--overlay-border-hover)'
                      }`}
                      style={{ backgroundColor: p.color }}
                      title={p.label}
                    />
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <input type="color" value={outlineColor} onChange={(e) => { setOutlineColor(e.target.value); setOutlineGradient(null) }} className="w-8 h-8 rounded-lg cursor-pointer border border-(--overlay-border)" />
                  <input
                    type="text"
                    value={outlineGradient ? outlineGradient.label : outlineColor}
                    onChange={(e) => { setOutlineColor(e.target.value); setOutlineGradient(null) }}
                    className="flex-1 px-2 py-1.5 bg-[var(--input-bg)] border border-(--overlay-border) rounded-lg text-xs text-(--text-secondary) font-mono uppercase focus:border-[#FF6B4A]/30 focus:outline-none"
                  />
                </div>
              </PanelSection>

              <PanelSection title="Gradient Border">
                <div className="grid grid-cols-3 gap-1.5">
                  {OUTLINE_GRADIENTS.map(g => (
                    <button
                      key={g.id}
                      onClick={() => setOutlineGradient(g)}
                      className={`h-9 rounded-lg border-2 transition-all cursor-pointer ${
                        outlineGradient?.id === g.id ? 'border-[#FF6B4A] scale-105' : 'border-(--overlay-border) hover:border-(--overlay-border-hover)'
                      }`}
                      style={{ background: g.css }}
                      title={g.label}
                    />
                  ))}
                </div>
                {outlineGradient && (
                  <button
                    onClick={() => setOutlineGradient(null)}
                    className="mt-2 w-full py-1.5 rounded-lg bg-[var(--input-bg)] text-[10px] font-semibold text-(--text-secondary) hover:bg-(--card-bg-hover) transition-all cursor-pointer"
                  >
                    Clear Gradient
                  </button>
                )}
              </PanelSection>

              <PanelSection title="Outline Width">
                <div className="flex items-center gap-3">
                  <input type="range" min="0" max="50" value={outlineWidth} onChange={(e) => setOutlineWidth(Number(e.target.value))} className="flex-1" style={{ background: `linear-gradient(to right, #FF6B4A ${outlineWidth * 2}%, rgba(255,255,255,0.06) ${outlineWidth * 2}%)` }} />
                  <span className="text-[11px] text-(--text-tertiary) font-mono w-8 text-right">{outlineWidth}px</span>
                </div>
              </PanelSection>

              <PanelSection title="Shadow Blur">
                <div className="flex items-center gap-3">
                  <input type="range" min="0" max="50" value={shadowBlur} onChange={(e) => setShadowBlur(Number(e.target.value))} className="flex-1" style={{ background: `linear-gradient(to right, #FF6B4A ${shadowBlur * 2}%, rgba(255,255,255,0.06) ${shadowBlur * 2}%)` }} />
                  <span className="text-[11px] text-(--text-tertiary) font-mono w-8 text-right">{shadowBlur}px</span>
                </div>
              </PanelSection>

              <PanelSection title="Quick Styles">
                <div className="grid grid-cols-2 gap-1.5">
                  <button onClick={() => { setOutlineColor('#ffffff'); setOutlineWidth(15); setShadowBlur(15); setOutlineGradient(null) }} className="py-2 rounded-lg bg-[var(--input-bg)] text-[11px] font-semibold text-(--text-secondary) hover:bg-(--card-bg-hover) transition-all cursor-pointer">Classic</button>
                  <button onClick={() => { setOutlineColor('#000000'); setOutlineWidth(8); setShadowBlur(0); setOutlineGradient(null) }} className="py-2 rounded-lg bg-[var(--input-bg)] text-[11px] font-semibold text-(--text-secondary) hover:bg-(--card-bg-hover) transition-all cursor-pointer">Minimal</button>
                  <button onClick={() => { setOutlineGradient(OUTLINE_GRADIENTS[0]); setOutlineWidth(20); setShadowBlur(10) }} className="py-2 rounded-lg bg-[var(--input-bg)] text-[11px] font-semibold text-(--text-secondary) hover:bg-(--card-bg-hover) transition-all cursor-pointer">🌅 Sunset</button>
                  <button onClick={() => { setOutlineGradient(OUTLINE_GRADIENTS[3]); setOutlineWidth(18); setShadowBlur(15) }} className="py-2 rounded-lg bg-[var(--input-bg)] text-[11px] font-semibold text-(--text-secondary) hover:bg-(--card-bg-hover) transition-all cursor-pointer">⚡ Neon</button>
                </div>
              </PanelSection>
            </div>
          )}

          {/* ── TEXT TAB ── */}
          {rightTab === 'text' && (
            <div className="space-y-4">
              {isTextSelected && (
                <div className="rounded-lg bg-[#FF6B4A]/8 border border-[#FF6B4A]/15 px-3 py-2 flex items-center gap-2">
                  <Type className="w-3.5 h-3.5 text-[#FF6B4A] shrink-0" />
                  <span className="text-[11px] text-[#FF6B4A]/80 leading-tight">
                    Editing: <strong className="text-[#FF6B4A]">&ldquo;{selectedElement?.text}&rdquo;</strong>
                  </span>
                </div>
              )}
              <PanelSection title="Add Text">
                <input
                  type="text"
                  placeholder="WOW!, OMG, LOL..."
                  value={stickerText}
                  onChange={(e) => { setStickerText(e.target.value); if (isTextSelected) updateSelectedText({ text: e.target.value }) }}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddText()}
                  className="w-full px-3 py-2.5 border border-(--overlay-border) rounded-xl bg-[var(--input-bg)] text-(--text-primary) placeholder:text-(--text-muted) focus:border-[#FF6B4A]/30 focus:outline-none text-sm"
                />
                <Button onClick={handleAddText} className="w-full mt-2" size="sm" disabled={!stickerText}>
                  <Plus className="w-4 h-4" /> Add to Canvas
                </Button>
              </PanelSection>

              <PanelSection title="Font">
                <div className="grid grid-cols-2 gap-1.5">
                  {FONTS.map(f => (
                    <button
                      key={f.value}
                      onClick={() => { setFontFamily(f.value); if (isTextSelected) updateSelectedText({ fontFamily: f.value }) }}
                      className={`py-2 px-2 rounded-lg text-left transition-all cursor-pointer ${
                        fontFamily === f.value
                          ? 'bg-[#FF6B4A]/15 text-[#FF6B4A] border border-[#FF6B4A]/20'
                          : 'bg-(--card-bg) text-(--text-tertiary) border border-(--overlay-border) hover:bg-(--card-bg-hover) hover:text-(--text-secondary)'
                      }`}
                    >
                      <span className="text-[10px] block text-(--text-muted)">{f.label}</span>
                      <span className="text-sm font-bold" style={{ fontFamily: f.value }}>{f.sample}</span>
                    </button>
                  ))}
                </div>
              </PanelSection>

              <PanelSection title="Size & Stroke">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-(--text-muted) block mb-1">Font Size</label>
                    <div className="flex items-center gap-1">
                      <input type="range" min="16" max="120" value={fontSize} onChange={e => { const v = Number(e.target.value); setFontSize(v); if (isTextSelected) updateSelectedText({ fontSize: v }) }} className="flex-1" style={{ background: `linear-gradient(to right, #FF6B4A ${((fontSize - 16) / 104) * 100}%, rgba(255,255,255,0.06) ${((fontSize - 16) / 104) * 100}%)` }} />
                      <span className="text-[10px] text-(--text-muted) font-mono w-6 text-right">{fontSize}</span>
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] text-(--text-muted) block mb-1">Stroke Width</label>
                    <div className="flex items-center gap-1">
                      <input type="range" min="0" max="10" value={textStrokeWidth} onChange={e => { const v = Number(e.target.value); setTextStrokeWidth(v); if (isTextSelected) updateSelectedText({ strokeWidth: v }) }} className="flex-1" style={{ background: `linear-gradient(to right, #FF6B4A ${textStrokeWidth * 10}%, rgba(255,255,255,0.06) ${textStrokeWidth * 10}%)` }} />
                      <span className="text-[10px] text-(--text-muted) font-mono w-4 text-right">{textStrokeWidth}</span>
                    </div>
                  </div>
                </div>
              </PanelSection>

              <PanelSection title="Colors">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-(--text-muted) block mb-1.5">Fill</label>
                    <div className="flex items-center gap-2">
                      <input type="color" value={textColor} onChange={(e) => { setTextColor(e.target.value); if (isTextSelected) updateSelectedText({ fill: e.target.value }) }} className="w-7 h-7 rounded cursor-pointer border border-(--overlay-border)" />
                      <span className="text-[10px] uppercase text-(--text-muted) font-mono">{textColor}</span>
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] text-(--text-muted) block mb-1.5">Stroke</label>
                    <div className="flex items-center gap-2">
                      <input type="color" value={textOutlineColor} onChange={(e) => { setTextOutlineColor(e.target.value); if (isTextSelected) updateSelectedText({ stroke: e.target.value }) }} className="w-7 h-7 rounded cursor-pointer border border-(--overlay-border)" />
                      <span className="text-[10px] uppercase text-(--text-muted) font-mono">{textOutlineColor}</span>
                    </div>
                  </div>
                </div>
              </PanelSection>

              <PanelSection title="Style Presets">
                <div className="grid grid-cols-2 gap-1.5">
                  {TEXT_PRESETS.map(preset => (
                    <button
                      key={preset.label}
                      onClick={() => handleAddTextPreset(preset)}
                      className="py-2.5 px-3 rounded-lg bg-(--card-bg) border border-(--overlay-border) text-left hover:bg-(--card-bg-hover) hover:border-(--overlay-border-hover) transition-all cursor-pointer"
                    >
                      <span className="text-[11px] font-bold block" style={{ fontFamily: preset.font, color: preset.fill, textShadow: `1px 1px 0 ${preset.stroke}` }}>
                        {preset.label}
                      </span>
                    </button>
                  ))}
                </div>
              </PanelSection>
            </div>
          )}

          {/* ── TEMPLATES/ASSETS TAB ── */}
          {rightTab === 'templates' && (
            <div className="space-y-3">
              <div className="flex flex-wrap gap-1">
                {(Object.keys(TEMPLATE_CATEGORIES) as TemplateCategory[]).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveTemplateCategory(cat)}
                    className={`px-2 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                      activeTemplateCategory === cat ? 'bg-[#FF6B4A]/15 text-[#FF6B4A]' : 'text-(--text-muted) hover:text-(--text-secondary) hover:bg-[var(--input-bg)]'
                    }`}
                  >
                    {TEMPLATE_CATEGORIES[cat].name}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-6 gap-1.5 max-h-[500px] overflow-y-auto">
                {TEMPLATE_CATEGORIES[activeTemplateCategory].items.map((src, idx) => (
                  <div
                    key={idx}
                    className="aspect-square bg-(--card-bg) rounded-lg border border-(--overlay-border) flex items-center justify-center p-1 cursor-pointer hover:border-[#FF6B4A]/30 hover:bg-(--card-bg-hover) transition-all"
                    onClick={() => handleAddTemplate(src)}
                  >
                    <img src={src} alt="Template category item" className="w-full h-full object-contain" loading="lazy" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── FILTERS TAB ── */}
          {rightTab === 'filters' && (
            <div className="space-y-4">
              {isApplyingFilter && (
                <div className="rounded-lg bg-[#FF6B4A]/8 border border-[#FF6B4A]/15 px-3 py-2 flex items-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 text-[#FF6B4A] animate-spin" />
                  <span className="text-[11px] text-[#FF6B4A]/80">Applying filter...</span>
                </div>
              )}

              <PanelSection title="Category">
                <div className="flex gap-1">
                  {FILTER_CATEGORIES.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => setActiveFilterCategory(cat.id)}
                      className={`flex-1 py-1.5 rounded-lg text-[10px] font-semibold transition-all cursor-pointer ${
                        activeFilterCategory === cat.id
                          ? 'bg-[#FF6B4A]/15 text-[#FF6B4A] border border-[#FF6B4A]/20'
                          : 'bg-(--card-bg) text-(--text-muted) border border-(--overlay-border) hover:bg-(--card-bg-hover)'
                      }`}
                    >
                      {cat.emoji} {cat.label}
                    </button>
                  ))}
                </div>
              </PanelSection>

              <PanelSection title="Filters">
                <div className="grid grid-cols-3 gap-1.5">
                  {IMAGE_FILTERS.filter(f => f.id === 'none' || f.category === activeFilterCategory).map(filter => (
                    <button
                      key={filter.id}
                      onClick={() => handleApplyFilter(filter.id)}
                      disabled={isApplyingFilter}
                      className={`py-3 rounded-lg text-center transition-all cursor-pointer ${
                        activeFilter === filter.id
                          ? 'bg-[#FF6B4A]/15 text-[#FF6B4A] border border-[#FF6B4A]/20 ring-1 ring-[#FF6B4A]/30'
                          : 'bg-(--card-bg) text-(--text-tertiary) border border-(--overlay-border) hover:bg-(--card-bg-hover) hover:text-(--text-secondary)'
                      }`}
                    >
                      <span className="text-lg block mb-0.5">{filter.emoji}</span>
                      <span className="text-[10px] font-medium">{filter.label}</span>
                    </button>
                  ))}
                </div>
              </PanelSection>

              <PanelSection title="AI Enhance">
                <Button
                  onClick={handleUpscale}
                  disabled={!processedUrl || isUpscaling}
                  className="w-full gap-2"
                  size="sm"
                >
                  {isUpscaling ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                  {isUpscaling ? 'Upscaling...' : 'AI Upscale (2×)'}
                </Button>
                <p className="text-[10px] text-(--text-muted) mt-1.5">Enhance image quality using AI</p>
              </PanelSection>
            </div>
          )}

          {/* ── FRAMES TAB ── */}
          {rightTab === 'frames' && (
            <div className="space-y-4">
              <PanelSection title="Category">
                <div className="flex gap-1">
                  {FRAME_CATEGORIES.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => setActiveFrameCategory(cat.id)}
                      className={`flex-1 py-1.5 rounded-lg text-[10px] font-semibold transition-all cursor-pointer ${
                        activeFrameCategory === cat.id
                          ? 'bg-[#FF6B4A]/15 text-[#FF6B4A] border border-[#FF6B4A]/20'
                          : 'bg-(--card-bg) text-(--text-muted) border border-(--overlay-border) hover:bg-(--card-bg-hover)'
                      }`}
                    >
                      {cat.emoji} {cat.label}
                    </button>
                  ))}
                </div>
              </PanelSection>

              <PanelSection title="Shape">
                <div className="grid grid-cols-3 gap-1.5">
                  {STICKER_FRAMES.filter(f => f.id === 'none' || f.category === activeFrameCategory).map(frame => (
                    <button
                      key={frame.id}
                      onClick={() => handleApplyFrame(frame.id)}
                      className={`py-3 rounded-lg text-center transition-all cursor-pointer ${
                        activeFrame === frame.id
                          ? 'bg-[#FF6B4A]/15 text-[#FF6B4A] border border-[#FF6B4A]/20 ring-1 ring-[#FF6B4A]/30'
                          : 'bg-(--card-bg) text-(--text-tertiary) border border-(--overlay-border) hover:bg-(--card-bg-hover) hover:text-(--text-secondary)'
                      }`}
                    >
                      <span className="text-lg block mb-0.5">{frame.emoji}</span>
                      <span className="text-[10px] font-medium">{frame.label}</span>
                    </button>
                  ))}
                </div>
              </PanelSection>

              <PanelSection title="Frame Border">
                <div className="flex items-center gap-3">
                  <input
                    type="range" min="0" max="20" value={frameBorderWidth}
                    onChange={e => setFrameBorderWidth(Number(e.target.value))}
                    className="flex-1"
                    style={{ background: `linear-gradient(to right, #FF6B4A ${frameBorderWidth * 5}%, rgba(255,255,255,0.06) ${frameBorderWidth * 5}%)` }}
                  />
                  <span className="text-[11px] text-(--text-tertiary) font-mono w-8 text-right">{frameBorderWidth}px</span>
                </div>
              </PanelSection>
            </div>
          )}

          {/* ── EXPORT TAB ── */}
          {rightTab === 'export' && (
            <div className="space-y-4">
              <PanelSection title="Platform Export">
                <div className="space-y-1.5">
                  {EXPORT_FORMATS.map(format => (
                    <button
                      key={format.id}
                      onClick={() => handlePlatformExport(format.id)}
                      disabled={isExportingPlatform || elements.length === 0}
                      className="w-full flex items-center gap-3 px-3 py-3 rounded-xl bg-(--card-bg) border border-(--overlay-border) hover:bg-(--card-bg-hover) hover:border-(--overlay-border-hover) transition-all cursor-pointer group text-left"
                    >
                      <span className="text-xl shrink-0">{format.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-semibold text-(--text-secondary) group-hover:text-white block">{format.label}</span>
                        <span className="text-[10px] text-(--text-muted)">{format.description}</span>
                      </div>
                      {isExportingPlatform ? (
                        <Loader2 className="w-4 h-4 text-(--text-muted) animate-spin shrink-0" />
                      ) : (
                        <Download className="w-4 h-4 text-(--text-muted) group-hover:text-[#FF6B4A] shrink-0 transition-colors" />
                      )}
                    </button>
                  ))}
                </div>
              </PanelSection>

              <PanelSection title="Animated GIF">
                <div className="grid grid-cols-2 gap-1.5 mb-3">
                  {ANIMATION_PRESETS.map(anim => (
                    <button
                      key={anim.id}
                      onClick={() => setSelectedAnimation(anim.id)}
                      className={`py-2 px-2 rounded-lg text-[11px] font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                        selectedAnimation === anim.id ? 'bg-[#FF6B4A]/15 text-[#FF6B4A] border border-[#FF6B4A]/30' : 'bg-[var(--input-bg)] text-(--text-tertiary) border border-(--overlay-border) hover:bg-(--card-bg-hover) hover:text-(--text-secondary)'
                      }`}
                    >
                      <span className="text-sm">{anim.emoji}</span>
                      {anim.label}
                    </button>
                  ))}
                </div>
                <Button className="w-full" onClick={handleGifExport} disabled={elements.length === 0 || isExportingGif}>
                  {isExportingGif ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                  {isExportingGif ? 'Encoding...' : 'Export as GIF'}
                </Button>
              </PanelSection>

              <PanelSection title="Smart Crop">
                <p className="text-[11px] text-(--text-muted) mb-2">Auto-crop to the main subject with padding.</p>
                <Button className="w-full" onClick={handleSmartCrop} disabled={!processedUrl || isSmartCropping}>
                  {isSmartCropping ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                  {isSmartCropping ? 'Cropping...' : 'Smart Crop'}
                </Button>
              </PanelSection>

              <PanelSection title="Standard Export">
                <div className="flex gap-1 mb-2">
                  {(['png', 'jpeg', 'webp'] as const).map(fmt => (
                    <button
                      key={fmt}
                      onClick={() => setExportFormat(fmt)}
                      className={`flex-1 py-2 rounded-lg text-xs font-semibold uppercase transition-all cursor-pointer ${
                        exportFormat === fmt ? 'bg-[#FF6B4A] text-white' : 'bg-[var(--input-bg)] text-(--text-muted) hover:bg-(--card-bg-hover) hover:text-(--text-secondary)'
                      }`}
                    >
                      {fmt}
                    </button>
                  ))}
                </div>
                <Button className="w-full" onClick={() => setExportAction('download')} disabled={elements.length === 0}>
                  <Download className="w-4 h-4" /> Export Sticker
                </Button>
              </PanelSection>
            </div>
          )}
        </div>
      </div>

      {/* ════════ MOBILE: Bottom Sheet with Tools ════════ */}
      {file && (
        <MakerMobileSheet
          rightTab={rightTab}
          onTabChange={setRightTab}
          tabs={RIGHT_TABS}
        >
          <div className="px-4 pb-5 space-y-4">
            {rightTab === 'border' && (
              <div className="space-y-4">
                <PanelSection title="Outline Width">
                  <input type="range" min="0" max="40" value={outlineWidth} onChange={e => setOutlineWidth(Number(e.target.value))} className="w-full" style={{ background: `linear-gradient(to right, #FF6B4A ${outlineWidth * 2.5}%, rgba(255,255,255,0.06) ${outlineWidth * 2.5}%)` }} />
                </PanelSection>
                <PanelSection title="Shadow">
                  <input type="range" min="0" max="50" value={shadowBlur} onChange={e => setShadowBlur(Number(e.target.value))} className="w-full" style={{ background: `linear-gradient(to right, #FF6B4A ${shadowBlur * 2}%, rgba(255,255,255,0.06) ${shadowBlur * 2}%)` }} />
                </PanelSection>
                <PanelSection title="Color">
                  <div className="grid grid-cols-4 gap-1.5">
                    {OUTLINE_PRESETS.map(p => (
                      <button key={p.color} onClick={() => { setOutlineColor(p.color); setOutlineGradient(null) }}
                        className={`aspect-square rounded-lg border-2 transition-all cursor-pointer ${outlineColor === p.color && !outlineGradient ? 'border-[#FF6B4A] scale-110' : 'border-(--overlay-border)'}`}
                        style={{ backgroundColor: p.color }} title={p.label} />
                    ))}
                  </div>
                </PanelSection>
              </div>
            )}

            {rightTab === 'text' && (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <input value={stickerText} onChange={e => { setStickerText(e.target.value); if (isTextSelected) updateSelectedText({ text: e.target.value }) }} placeholder="Type text..."
                    className="flex-1 px-3 py-2 bg-[var(--input-bg)] border border-(--overlay-border) rounded-lg text-sm text-(--text-secondary)" />
                  <Button onClick={handleAddText} disabled={!stickerText}><Plus className="w-4 h-4" /></Button>
                </div>
                <div className="grid grid-cols-4 gap-1.5">
                  {TEXT_PRESETS.map(p => (
                    <button key={p.label} onClick={() => handleAddTextPreset(p)}
                      className="py-2 rounded-lg bg-(--card-bg) border border-(--overlay-border) text-center hover:bg-(--card-bg-hover) transition-all cursor-pointer">
                      <span className="text-xs">{p.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {rightTab === 'filters' && (
              <div className="space-y-3">
                <div className="flex gap-1 overflow-x-auto">
                  {FILTER_CATEGORIES.map(c => (
                    <button key={c.id} onClick={() => setActiveFilterCategory(c.id)}
                      className={`shrink-0 py-1.5 px-3 rounded-lg text-[10px] font-semibold transition-all cursor-pointer ${activeFilterCategory === c.id ? 'bg-[#FF6B4A]/15 text-[#FF6B4A]' : 'bg-(--card-bg) text-(--text-muted)'}`}>
                      {c.emoji} {c.label}
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-4 gap-1.5">
                  {IMAGE_FILTERS.filter(f => f.id === 'none' || f.category === activeFilterCategory).map(f => (
                    <button key={f.id} onClick={() => handleApplyFilter(f.id)} disabled={isApplyingFilter}
                      className={`py-2.5 rounded-lg text-center transition-all cursor-pointer ${activeFilter === f.id ? 'bg-[#FF6B4A]/15 text-[#FF6B4A] border border-[#FF6B4A]/20' : 'bg-(--card-bg) text-(--text-tertiary) border border-(--overlay-border)'}`}>
                      <span className="text-base block">{f.emoji}</span>
                      <span className="text-[9px]">{f.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {rightTab === 'frames' && (
              <div className="space-y-3">
                <div className="flex gap-1 overflow-x-auto">
                  {FRAME_CATEGORIES.map(c => (
                    <button key={c.id} onClick={() => setActiveFrameCategory(c.id)}
                      className={`shrink-0 py-1.5 px-3 rounded-lg text-[10px] font-semibold transition-all cursor-pointer ${activeFrameCategory === c.id ? 'bg-[#FF6B4A]/15 text-[#FF6B4A]' : 'bg-(--card-bg) text-(--text-muted)'}`}>
                      {c.emoji} {c.label}
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-4 gap-1.5">
                  {STICKER_FRAMES.filter(f => f.id === 'none' || f.category === activeFrameCategory).map(f => (
                    <button key={f.id} onClick={() => handleApplyFrame(f.id)}
                      className={`py-2.5 rounded-lg text-center transition-all cursor-pointer ${activeFrame === f.id ? 'bg-[#FF6B4A]/15 text-[#FF6B4A] border border-[#FF6B4A]/20' : 'bg-(--card-bg) text-(--text-tertiary) border border-(--overlay-border)'}`}>
                      <span className="text-base block">{f.emoji}</span>
                      <span className="text-[9px]">{f.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {rightTab === 'templates' && (
              <div className="space-y-3">
                <div className="flex gap-1 overflow-x-auto">
                  {Object.keys(TEMPLATE_CATEGORIES).map(cat => (
                    <button key={cat} onClick={() => setActiveTemplateCategory(cat as TemplateCategory)}
                      className={`shrink-0 py-1.5 px-3 rounded-lg text-[10px] font-semibold transition-all cursor-pointer ${activeTemplateCategory === cat ? 'bg-[#FF6B4A]/15 text-[#FF6B4A]' : 'bg-(--card-bg) text-(--text-muted)'}`}>
                      {TEMPLATE_CATEGORIES[cat as TemplateCategory].name}
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-5 gap-1.5 max-h-[200px] overflow-y-auto">
                  {TEMPLATE_CATEGORIES[activeTemplateCategory].items.slice(0, 30).map((src, i) => (
                    <button key={i} onClick={() => handleAddTemplate(src)}
                      className="aspect-square rounded-lg bg-(--card-bg) border border-(--overlay-border) p-1 hover:bg-(--card-bg-hover) transition-all cursor-pointer">
                      <img src={src} alt="Template thumbnail" className="w-full h-full object-contain" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {rightTab === 'export' && (
              <div className="space-y-4">
                <PanelSection title="Format">
                  <div className="flex gap-1">
                    {(['png', 'jpeg', 'webp'] as const).map(fmt => (
                      <button key={fmt} onClick={() => setExportFormat(fmt)}
                        className={`flex-1 py-2 rounded-lg text-xs font-semibold uppercase transition-all cursor-pointer ${exportFormat === fmt ? 'bg-[#FF6B4A] text-white' : 'bg-[var(--input-bg)] text-(--text-muted)'}`}>
                        {fmt}
                      </button>
                    ))}
                  </div>
                </PanelSection>
                <Button className="w-full" onClick={() => setExportAction('download')} disabled={elements.length === 0}>
                  <Download className="w-4 h-4" /> Export Sticker
                </Button>
              </div>
            )}
          </div>
        </MakerMobileSheet>
      )}
    </div>
  )
}

// ─── Maker Mobile Sheet with Tab Toolbar ─────────────────────
interface MakerMobileSheetProps {
  children: React.ReactNode
  rightTab: RightTab
  onTabChange: (tab: RightTab) => void
  tabs: { key: RightTab; icon: React.ComponentType<any>; label: string }[]
}

function MakerMobileSheet({ children, rightTab, onTabChange, tabs }: MakerMobileSheetProps) {
  const [expanded, setExpanded] = useState(false)
  const dragY = useRef(0)

  const onDragStart = useCallback((e: React.PointerEvent) => {
    e.preventDefault()
    dragY.current = e.clientY
    const onMove = (ev: PointerEvent) => {
      const delta = dragY.current - ev.clientY
      if (Math.abs(delta) > 30) setExpanded(delta > 0)
    }
    const onUp = () => { window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerup', onUp) }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }, [])

  return (
    <div
      className="lg:hidden fixed bottom-14 md:bottom-0 left-0 right-0 z-[51] bg-(--panel-bg) border-t border-(--overlay-border) rounded-t-2xl shadow-[0_-4px_30px_rgba(0,0,0,0.3)] flex flex-col"
      style={{ height: expanded ? '55vh' : '56px', transition: 'height 0.3s cubic-bezier(0.32,0.72,0,1)' }}
    >
      {/* Tab toolbar */}
      <div className="shrink-0 flex items-stretch overflow-x-auto cursor-grab active:cursor-grabbing touch-manipulation" onPointerDown={onDragStart}>
        {tabs.map(tab => (
          <button key={tab.key}
            onClick={(e) => { e.stopPropagation(); onTabChange(tab.key); setExpanded(true) }}
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 text-[9px] font-semibold transition-all cursor-pointer min-w-[50px] ${
              rightTab === tab.key && expanded ? 'text-[#FF6B4A] bg-[#FF6B4A]/5' : 'text-(--text-muted)'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>
      {/* Content */}
      <div className={`flex-1 overflow-y-auto overscroll-contain ${expanded ? '' : 'overflow-hidden'}`}>
        {children}
      </div>
    </div>
  )
}
