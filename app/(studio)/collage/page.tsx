'use client'

import { AssetPanel } from '@/components/shared/AssetPanel'
import { TextPanel } from '@/components/shared/TextPanel'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/toast'
import { useHistory } from '@/hooks/use-history'
import { downloadUrl } from '@/lib/download'
import { TEXT_PRESETS } from '@/lib/shared-assets'
import { Download, Grid, GripVertical, Layers, Loader2, Redo2, RotateCcw, Trash2, Type, Undo2, UploadCloud, X } from 'lucide-react'
import { useCallback, useRef, useState } from 'react'
import { useDropzone } from 'react-dropzone'

// ─── Layout templates ────────────────────────────────────────

interface LayoutTemplate {
  id: string
  label: string
  emoji: string
  cells: number
  positions: (w: number, h: number, pad: number) => { x: number; y: number; w: number; h: number }[]
}

const LAYOUTS: LayoutTemplate[] = [
  {
    id: 'grid2x2', label: '2×2 Grid', emoji: '⬜', cells: 4,
    positions: (w, h, p) => {
      const cw = (w - p * 3) / 2, ch = (h - p * 3) / 2
      return [
        { x: p, y: p, w: cw, h: ch },
        { x: p * 2 + cw, y: p, w: cw, h: ch },
        { x: p, y: p * 2 + ch, w: cw, h: ch },
        { x: p * 2 + cw, y: p * 2 + ch, w: cw, h: ch },
      ]
    },
  },
  {
    id: 'grid3x3', label: '3×3 Grid', emoji: '🔲', cells: 9,
    positions: (w, h, p) => {
      const cw = (w - p * 4) / 3, ch = (h - p * 4) / 3
      const result = []
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
          result.push({ x: p + c * (cw + p), y: p + r * (ch + p), w: cw, h: ch })
        }
      }
      return result
    },
  },
  {
    id: 'hero_left', label: 'Hero Left', emoji: '◧', cells: 3,
    positions: (w, h, p) => {
      const big = (w - p * 3) * 0.6
      const smW = w - p * 3 - big
      const smH = (h - p * 3) / 2
      return [
        { x: p, y: p, w: big, h: h - p * 2 },
        { x: p * 2 + big, y: p, w: smW, h: smH },
        { x: p * 2 + big, y: p * 2 + smH, w: smW, h: smH },
      ]
    },
  },
  {
    id: 'hero_top', label: 'Hero Top', emoji: '⬒', cells: 3,
    positions: (w, h, p) => {
      const bigH = (h - p * 3) * 0.6
      const smW = (w - p * 3) / 2
      const smH = h - p * 3 - bigH
      return [
        { x: p, y: p, w: w - p * 2, h: bigH },
        { x: p, y: p * 2 + bigH, w: smW, h: smH },
        { x: p * 2 + smW, y: p * 2 + bigH, w: smW, h: smH },
      ]
    },
  },
  {
    id: 'strip_h', label: 'Strip H', emoji: '▬', cells: 3,
    positions: (w, h, p) => {
      const cw = (w - p * 4) / 3
      return [
        { x: p, y: p, w: cw, h: h - p * 2 },
        { x: p * 2 + cw, y: p, w: cw, h: h - p * 2 },
        { x: p * 3 + cw * 2, y: p, w: cw, h: h - p * 2 },
      ]
    },
  },
  {
    id: 'strip_v', label: 'Strip V', emoji: '▮', cells: 3,
    positions: (w, h, p) => {
      const ch = (h - p * 4) / 3
      return [
        { x: p, y: p, w: w - p * 2, h: ch },
        { x: p, y: p * 2 + ch, w: w - p * 2, h: ch },
        { x: p, y: p * 3 + ch * 2, w: w - p * 2, h: ch },
      ]
    },
  },
  {
    id: 'focus', label: 'Focus', emoji: '🎯', cells: 5,
    positions: (w, h, p) => {
      const bigW = (w - p * 3) * 0.6
      const bigH = (h - p * 3) * 0.6
      const smW = w - p * 3 - bigW
      const smSide = (bigH - p) / 2
      const smH = (h - p * 3) - bigH
      return [
        { x: p, y: p, w: bigW, h: bigH },
        { x: p * 2 + bigW, y: p, w: smW, h: smSide },
        { x: p * 2 + bigW, y: p * 2 + smSide, w: smW, h: smSide },
        { x: p, y: p * 2 + bigH, w: (w - p * 3) / 2, h: smH },
        { x: p * 2 + (w - p * 3) / 2, y: p * 2 + bigH, w: (w - p * 3) / 2, h: smH },
      ]
    },
  },
  {
    id: 'l_shape', label: 'L-Shape', emoji: '⌐', cells: 4,
    positions: (w, h, p) => {
      const bigW = (w - p * 3) * 0.65
      const bigH = (h - p * 3) * 0.65
      const smW = w - p * 3 - bigW
      const smH = h - p * 3 - bigH
      return [
        { x: p, y: p, w: bigW, h: bigH },
        { x: p * 2 + bigW, y: p, w: smW, h: bigH },
        { x: p, y: p * 2 + bigH, w: bigW, h: smH },
        { x: p * 2 + bigW, y: p * 2 + bigH, w: smW, h: smH },
      ]
    },
  },
  {
    id: 'triptych', label: 'Triptych', emoji: '🖼️', cells: 3,
    positions: (w, h, p) => {
      const sideW = (w - p * 4) * 0.25
      const centerW = (w - p * 4) * 0.5
      return [
        { x: p, y: p, w: sideW, h: h - p * 2 },
        { x: p * 2 + sideW, y: p, w: centerW, h: h - p * 2 },
        { x: p * 3 + sideW + centerW, y: p, w: sideW, h: h - p * 2 },
      ]
    },
  },
]

const BG_COLORS = [
  '#0C0A09', '#ffffff', '#FF6B4A', '#F59E0B', '#10B981',
  '#3B82F6', '#8B5CF6', '#EC4899', '#1e1e1e', '#f5f5dc',
]

const BG_GRADIENTS = [
  { id: 'g1', label: 'Sunset', css: 'linear-gradient(135deg, #FF6B4A, #F59E0B)', colors: ['#FF6B4A', '#F59E0B'] },
  { id: 'g2', label: 'Ocean', css: 'linear-gradient(135deg, #3B82F6, #10B981)', colors: ['#3B82F6', '#10B981'] },
  { id: 'g3', label: 'Berry', css: 'linear-gradient(135deg, #8B5CF6, #EC4899)', colors: ['#8B5CF6', '#EC4899'] },
  { id: 'g4', label: 'Night', css: 'linear-gradient(135deg, #1e1e1e, #3B82F6)', colors: ['#1e1e1e', '#3B82F6'] },
  { id: 'g5', label: 'Dawn', css: 'linear-gradient(135deg, #F59E0B, #EC4899)', colors: ['#F59E0B', '#EC4899'] },
  { id: 'g6', label: 'Forest', css: 'linear-gradient(135deg, #10B981, #064E3B)', colors: ['#10B981', '#064E3B'] },
]

const OUTPUT_SIZES = [
  { id: 'square', label: 'Square', w: 1024, h: 1024, desc: '1024×1024' },
  { id: 'story', label: 'Story', w: 1080, h: 1920, desc: '1080×1920' },
  { id: 'landscape', label: 'Wide', w: 1920, h: 1080, desc: '1920×1080' },
  { id: 'post', label: 'Post', w: 1080, h: 1350, desc: '1080×1350' },
]

// ─── Overlay types ───────────────────────────────────────────

interface CollageOverlay {
  id: string
  type: 'asset' | 'text'
  src?: string
  text?: string
  fontFamily?: string
  fontSize?: number
  fill?: string
  stroke?: string
  strokeWidth?: number
  x: number
  y: number
  size: number
}

type SideTab = 'layout' | 'text' | 'assets'

export default function CollagePage() {
  const [images, setImages] = useState<{ id: string; url: string; file: File }[]>([])
  const [layout, setLayout] = useState<LayoutTemplate>(LAYOUTS[0])
  const [bgColor, setBgColor] = useState('#0C0A09')
  const [bgGradient, setBgGradient] = useState<typeof BG_GRADIENTS[0] | null>(null)
  const [padding, setPadding] = useState(12)
  const [borderRadius, setBorderRadius] = useState(16)
  const [outputSize, setOutputSize] = useState(OUTPUT_SIZES[0])
  const [isExporting, setIsExporting] = useState(false)
  const [overlays, setOverlays] = useState<CollageOverlay[]>([])
  const [sideTab, setSideTab] = useState<SideTab>('layout')
  const [dragIdx, setDragIdx] = useState<number | null>(null)
  const [selectedOverlay, setSelectedOverlay] = useState<string | null>(null)
  const previewRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  // Text panel state
  const [stickerText, setStickerText] = useState('')
  const [fontFamily, setFontFamily] = useState('Impact')
  const [fontSize, setFontSize] = useState(48)
  const [textColor, setTextColor] = useState('#ffffff')
  const [textStroke, setTextStroke] = useState('#000000')
  const [textStrokeWidth, setTextStrokeWidth] = useState(3)

  // Undo/redo
  const history = useHistory<CollageOverlay[]>([])

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newImages = acceptedFiles.map(file => ({
      id: `img-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      url: URL.createObjectURL(file),
      file,
    }))
    setImages(prev => [...prev, ...newImages].slice(0, layout.cells))
  }, [layout.cells])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/jpeg': [], 'image/png': [], 'image/webp': [] },
    maxFiles: layout.cells,
  })

  const removeImage = (id: string) => {
    setImages(prev => prev.filter(img => img.id !== id))
  }

  // ─── Image drag reorder ────────────────────────────────────
  const handleDragStart = (idx: number) => setDragIdx(idx)
  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault()
    if (dragIdx === null || dragIdx === idx) return
    setImages(prev => {
      const arr = [...prev]
      const [moved] = arr.splice(dragIdx, 1)
      arr.splice(idx, 0, moved)
      return arr
    })
    setDragIdx(idx)
  }
  const handleDragEnd = () => setDragIdx(null)

  // ─── Asset + Text overlay handlers ─────────────────────────
  const addAssetOverlay = (src: string) => {
    const newOverlays = [...overlays, {
      id: `ov-${Date.now()}`,
      type: 'asset' as const,
      src,
      x: 50 + Math.random() * 20 - 10,
      y: 50 + Math.random() * 20 - 10,
      size: 15,
    }]
    setOverlays(newOverlays)
    history.set(newOverlays)
  }

  const addTextOverlay = (config: { text: string; fontFamily: string; fontSize: number; fill: string; stroke: string; strokeWidth: number }) => {
    const newOverlays = [...overlays, {
      id: `txt-${Date.now()}`,
      type: 'text' as const,
      text: config.text,
      fontFamily: config.fontFamily,
      fontSize: config.fontSize,
      fill: config.fill,
      stroke: config.stroke,
      strokeWidth: config.strokeWidth,
      x: 50,
      y: 50,
      size: 20,
    }]
    setOverlays(newOverlays)
    history.set(newOverlays)
    setStickerText('')
  }

  const addTextPreset = (preset: typeof TEXT_PRESETS[0]) => {
    const newOverlays = [...overlays, {
      id: `txt-${Date.now()}`,
      type: 'text' as const,
      text: preset.label.split(' ').slice(1).join(' ') || preset.label,
      fontFamily: preset.font,
      fontSize: preset.size,
      fill: preset.fill,
      stroke: preset.stroke,
      strokeWidth: preset.strokeWidth,
      x: 50,
      y: 50,
      size: 20,
    }]
    setOverlays(newOverlays)
    history.set(newOverlays)
  }

  const removeOverlay = (id: string) => {
    const newOverlays = overlays.filter(o => o.id !== id)
    setOverlays(newOverlays)
    history.set(newOverlays)
    if (selectedOverlay === id) setSelectedOverlay(null)
  }

  const handleUndo = () => {
    history.undo()
    setOverlays(history.state)
  }

  const handleRedo = () => {
    history.redo()
    setOverlays(history.state)
  }

  // ─── Draggable overlay on preview ──────────────────────────
  const [draggingOverlayId, setDraggingOverlayId] = useState<string | null>(null)
  const dragStartPos = useRef<{ x: number; y: number; ovX: number; ovY: number } | null>(null)

  const handleOverlayPointerDown = (e: React.PointerEvent, ov: CollageOverlay) => {
    e.stopPropagation()
    e.preventDefault()
    setDraggingOverlayId(ov.id)
    setSelectedOverlay(ov.id)
    dragStartPos.current = { x: e.clientX, y: e.clientY, ovX: ov.x, ovY: ov.y }
    const el = e.currentTarget as HTMLElement
    el.setPointerCapture(e.pointerId)
  }

  const handleOverlayPointerMove = (e: React.PointerEvent) => {
    if (!draggingOverlayId || !dragStartPos.current || !previewRef.current) return
    const rect = previewRef.current.getBoundingClientRect()
    const dx = ((e.clientX - dragStartPos.current.x) / rect.width) * 100
    const dy = ((e.clientY - dragStartPos.current.y) / rect.height) * 100
    const nx = Math.max(0, Math.min(100, dragStartPos.current.ovX + dx))
    const ny = Math.max(0, Math.min(100, dragStartPos.current.ovY + dy))

    setOverlays(prev => prev.map(o => o.id === draggingOverlayId ? { ...o, x: nx, y: ny } : o))
  }

  const handleOverlayPointerUp = () => {
    if (draggingOverlayId) {
      history.set([...overlays])
    }
    setDraggingOverlayId(null)
    dragStartPos.current = null
  }

  // ─── Resize selected overlay ───────────────────────────────
  const resizeOverlay = (id: string, delta: number) => {
    setOverlays(prev => prev.map(o =>
      o.id === id ? { ...o, size: Math.max(5, Math.min(60, o.size + delta)) } : o
    ))
  }

  // ─── Export ────────────────────────────────────────────────
  const handleExport = async () => {
    if (images.length === 0) return
    setIsExporting(true)

    try {
      const W = outputSize.w
      const H = outputSize.h
      const canvas = document.createElement('canvas')
      canvas.width = W
      canvas.height = H
      const ctx = canvas.getContext('2d')!

      // Background
      if (bgGradient) {
        const grad = ctx.createLinearGradient(0, 0, W, H)
        grad.addColorStop(0, bgGradient.colors[0])
        grad.addColorStop(1, bgGradient.colors[1])
        ctx.fillStyle = grad
      } else {
        ctx.fillStyle = bgColor
      }
      if (borderRadius > 0) {
        ctx.beginPath()
        ctx.roundRect(0, 0, W, H, borderRadius * (W / 600))
        ctx.fill()
        ctx.clip()
      } else {
        ctx.fillRect(0, 0, W, H)
      }

      const positions = layout.positions(W, H, padding * (W / 600))
      const br = borderRadius * 0.6 * (W / 600)

      for (let i = 0; i < Math.min(images.length, positions.length); i++) {
        const pos = positions[i]
        const img = await loadImage(images[i].url)
        ctx.save()
        if (borderRadius > 0) {
          ctx.beginPath()
          ctx.roundRect(pos.x, pos.y, pos.w, pos.h, br)
          ctx.clip()
        }
        const scale = Math.max(pos.w / img.width, pos.h / img.height)
        const iw = img.width * scale
        const ih = img.height * scale
        const ix = pos.x + (pos.w - iw) / 2
        const iy = pos.y + (pos.h - ih) / 2
        ctx.drawImage(img, ix, iy, iw, ih)
        ctx.restore()
      }

      // Draw overlays
      for (const ov of overlays) {
        if (ov.type === 'asset' && ov.src) {
          const img = await loadImage(ov.src)
          const s = (ov.size / 100) * W
          const ox = (ov.x / 100) * W - s / 2
          const oy = (ov.y / 100) * H - s / 2
          ctx.drawImage(img, ox, oy, s, s)
        } else if (ov.type === 'text' && ov.text) {
          const scale = W / 600
          ctx.save()
          ctx.font = `bold ${(ov.fontSize || 48) * scale}px ${ov.fontFamily || 'Impact'}`
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          if (ov.strokeWidth && ov.strokeWidth > 0) {
            ctx.strokeStyle = ov.stroke || '#000000'
            ctx.lineWidth = ov.strokeWidth * scale
            ctx.strokeText(ov.text, (ov.x / 100) * W, (ov.y / 100) * H)
          }
          ctx.fillStyle = ov.fill || '#ffffff'
          ctx.fillText(ov.text, (ov.x / 100) * W, (ov.y / 100) * H)
          ctx.restore()
        }
      }

      const dataUrl = canvas.toDataURL('image/png')
      downloadUrl(dataUrl, `collage_${outputSize.id}.png`)
      toast('Collage exported!', 'success')
    } catch (err) {
      console.error('Export error:', err)
      toast('Export failed. Please try again.', 'error')
    } finally {
      setIsExporting(false)
    }
  }

  // ─── Preview dimensions ────────────────────────────────────
  const previewAspect = outputSize.w / outputSize.h
  const previewMaxW = previewAspect >= 1 ? 600 : Math.round(480 * previewAspect)
  const previewMaxH = previewAspect >= 1 ? Math.round(600 / previewAspect) : 480

  const SIDE_TABS: { id: SideTab; label: string; icon: React.ReactNode }[] = [
    { id: 'layout', label: 'Layout', icon: <Grid className="w-3.5 h-3.5" /> },
    { id: 'text', label: 'Text', icon: <Type className="w-3.5 h-3.5" /> },
    { id: 'assets', label: 'Assets', icon: <Layers className="w-3.5 h-3.5" /> },
  ]

  return (
    <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
      {/* Left: Controls — mobile: fixed 40vh with scroll, desktop: full height */}
      <div className="w-full lg:w-[340px] shrink-0 bg-[var(--panel-bg)] border-b lg:border-b-0 lg:border-r border-[var(--overlay-border)] overflow-y-auto h-[40vh] lg:h-screen">
        {/* Header */}
        <div className="p-5 pb-3">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#EC4899] to-[#F59E0B] flex items-center justify-center">
              <Grid className="w-4.5 h-4.5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[var(--text-primary)]">Collage Maker</h2>
              <p className="text-xs text-[var(--text-muted)]">Combine images into one design</p>
            </div>
          </div>

          {/* Tab switcher */}
          <div className="flex gap-1 bg-[var(--card-bg)] rounded-xl p-1">
            {SIDE_TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setSideTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                  sideTab === tab.id
                    ? 'bg-[#FF6B4A]/15 text-[#FF6B4A]'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
                }`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="px-5 pb-5 space-y-5">
          {/* ── LAYOUT TAB ── */}
          {sideTab === 'layout' && (
            <>
              {/* Upload */}
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-2 block">
                  Images ({images.length}/{layout.cells})
                </label>
                <div {...getRootProps()} className={`rounded-xl border-2 border-dashed py-5 flex flex-col items-center cursor-pointer transition-all
                  ${isDragActive ? 'border-[#FF6B4A] bg-[#FF6B4A]/5' : 'border-[var(--overlay-border)] hover:border-[var(--overlay-border-hover)]'}`}
                >
                  <input {...getInputProps()} />
                  <UploadCloud className="w-5 h-5 text-[var(--text-muted)] mb-1.5" />
                  <p className="text-xs text-[var(--text-tertiary)]">{isDragActive ? 'Drop here' : 'Drop images or click to upload'}</p>
                </div>

                {images.length > 0 && (
                  <div className="grid grid-cols-4 gap-1.5 mt-3">
                    {images.map((img, idx) => (
                      <div
                        key={img.id}
                        className={`relative aspect-square rounded-lg overflow-hidden group cursor-grab active:cursor-grabbing ${
                          dragIdx === idx ? 'ring-2 ring-[#FF6B4A] opacity-60' : ''
                        }`}
                        draggable
                        onDragStart={() => handleDragStart(idx)}
                        onDragOver={(e) => handleDragOver(e, idx)}
                        onDragEnd={handleDragEnd}
                      >
                        <img src={img.url} alt="" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-1 transition-opacity">
                          <GripVertical className="w-3 h-3 text-white/60" />
                          <button onClick={() => removeImage(img.id)} className="cursor-pointer">
                            <Trash2 className="w-3.5 h-3.5 text-white" />
                          </button>
                        </div>
                        <span className="absolute top-1 left-1 text-[9px] font-bold text-white bg-black/50 px-1 rounded">{idx + 1}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Layout */}
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-2 block">Layout</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {LAYOUTS.map(l => (
                    <button
                      key={l.id}
                      onClick={() => { setLayout(l); setImages(prev => prev.slice(0, l.cells)) }}
                      className={`py-2.5 rounded-lg text-center transition-all cursor-pointer ${
                        layout.id === l.id
                          ? 'bg-[#FF6B4A]/15 text-[#FF6B4A] border border-[#FF6B4A]/20'
                          : 'bg-[var(--card-bg)] text-[var(--text-tertiary)] border border-[var(--overlay-border)] hover:bg-[var(--card-bg-hover)]'
                      }`}
                    >
                      <span className="text-base block">{l.emoji}</span>
                      <span className="text-[9px] font-medium">{l.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Output size */}
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-2 block">Output Size</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {OUTPUT_SIZES.map(s => (
                    <button
                      key={s.id}
                      onClick={() => setOutputSize(s)}
                      className={`py-2 rounded-lg text-center transition-all cursor-pointer ${
                        outputSize.id === s.id
                          ? 'bg-[#FF6B4A]/15 text-[#FF6B4A] border border-[#FF6B4A]/20'
                          : 'bg-[var(--card-bg)] text-[var(--text-tertiary)] border border-[var(--overlay-border)] hover:bg-[var(--card-bg-hover)]'
                      }`}
                    >
                      <span className="text-[10px] font-semibold block">{s.label}</span>
                      <span className="text-[8px] opacity-60">{s.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Background solid */}
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-2 block">Background</label>
                <div className="grid grid-cols-5 gap-1.5">
                  {BG_COLORS.map(color => (
                    <button
                      key={color}
                      onClick={() => { setBgColor(color); setBgGradient(null) }}
                      className={`aspect-square rounded-lg border-2 transition-all cursor-pointer ${
                        bgColor === color && !bgGradient ? 'border-[#FF6B4A] scale-110' : 'border-[var(--overlay-border)]'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <input type="color" value={bgColor} onChange={e => { setBgColor(e.target.value); setBgGradient(null) }} className="w-7 h-7 rounded cursor-pointer border border-[var(--overlay-border)]" />
                  <span className="text-xs text-[var(--text-muted)] font-mono uppercase">{bgGradient ? bgGradient.label : bgColor}</span>
                </div>
              </div>

              {/* Gradients */}
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-2 block">Gradients</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {BG_GRADIENTS.map(g => (
                    <button
                      key={g.id}
                      onClick={() => setBgGradient(g)}
                      className={`h-10 rounded-lg border-2 transition-all cursor-pointer ${
                        bgGradient?.id === g.id ? 'border-[#FF6B4A] scale-105' : 'border-[var(--overlay-border)]'
                      }`}
                      style={{ background: g.css }}
                      title={g.label}
                    />
                  ))}
                </div>
              </div>

              {/* Spacing */}
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-1 block">
                  Padding: {padding}px
                </label>
                <input type="range" min="0" max="40" value={padding} onChange={e => setPadding(Number(e.target.value))}
                  className="w-full" style={{ background: `linear-gradient(to right, #FF6B4A ${padding * 2.5}%, rgba(255,255,255,0.06) ${padding * 2.5}%)` }}
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-1 block">
                  Corners: {borderRadius}px
                </label>
                <input type="range" min="0" max="40" value={borderRadius} onChange={e => setBorderRadius(Number(e.target.value))}
                  className="w-full" style={{ background: `linear-gradient(to right, #FF6B4A ${borderRadius * 2.5}%, rgba(255,255,255,0.06) ${borderRadius * 2.5}%)` }}
                />
              </div>
            </>
          )}

          {/* ── TEXT TAB ── */}
          {sideTab === 'text' && (
            <TextPanel
              text={stickerText}
              onTextChange={setStickerText}
              fontFamily={fontFamily}
              onFontChange={setFontFamily}
              fontSize={fontSize}
              onSizeChange={setFontSize}
              fillColor={textColor}
              onFillChange={setTextColor}
              strokeColor={textStroke}
              onStrokeChange={setTextStroke}
              strokeWidth={textStrokeWidth}
              onStrokeWidthChange={setTextStrokeWidth}
              onAddText={addTextOverlay}
              onAddPreset={addTextPreset}
            />
          )}

          {/* ── ASSETS TAB ── */}
          {sideTab === 'assets' && (
            <AssetPanel onAddAsset={addAssetOverlay} />
          )}

          {/* Overlay list + Undo/Redo + Actions — always visible */}
          {overlays.length > 0 && (
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-2 block">
                Overlays ({overlays.length})
              </label>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {overlays.map(ov => (
                  <div
                    key={ov.id}
                    onClick={() => setSelectedOverlay(ov.id === selectedOverlay ? null : ov.id)}
                    className={`flex items-center gap-2 px-2.5 py-2 rounded-lg border transition-all cursor-pointer ${
                      selectedOverlay === ov.id
                        ? 'bg-[#FF6B4A]/10 border-[#FF6B4A]/20'
                        : 'bg-[var(--card-bg)] border-[var(--overlay-border)] hover:bg-[var(--card-bg-hover)]'
                    }`}
                  >
                    {ov.type === 'asset' && ov.src ? (
                      <img src={ov.src} alt="" className="w-5 h-5 shrink-0" />
                    ) : (
                      <Type className="w-4 h-4 text-[var(--text-tertiary)] shrink-0" />
                    )}
                    <span className="text-xs text-[var(--text-secondary)] flex-1 truncate" style={ov.type === 'text' ? { fontFamily: ov.fontFamily, color: ov.fill } : undefined}>
                      {ov.type === 'text' ? ov.text : 'Sticker'}
                    </span>
                    {selectedOverlay === ov.id && (
                      <div className="flex items-center gap-1">
                        <button onClick={(e) => { e.stopPropagation(); resizeOverlay(ov.id, -2) }} className="w-5 h-5 rounded bg-[var(--card-bg-hover)] flex items-center justify-center text-[var(--text-secondary)] hover:text-white text-[10px] cursor-pointer">−</button>
                        <button onClick={(e) => { e.stopPropagation(); resizeOverlay(ov.id, 2) }} className="w-5 h-5 rounded bg-[var(--card-bg-hover)] flex items-center justify-center text-[var(--text-secondary)] hover:text-white text-[10px] cursor-pointer">+</button>
                      </div>
                    )}
                    <button onClick={(e) => { e.stopPropagation(); removeOverlay(ov.id) }} className="cursor-pointer">
                      <X className="w-3 h-3 text-[var(--text-tertiary)] hover:text-white" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2 pt-2">
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" className="flex-1 text-[var(--text-tertiary)]" onClick={handleUndo} disabled={!history.canUndo}>
                <Undo2 className="w-4 h-4" /> Undo
              </Button>
              <Button variant="ghost" size="sm" className="flex-1 text-[var(--text-tertiary)]" onClick={handleRedo} disabled={!history.canRedo}>
                <Redo2 className="w-4 h-4" /> Redo
              </Button>
            </div>
            <Button className="w-full gap-2" onClick={handleExport} disabled={images.length === 0 || isExporting}>
              {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              Export Collage ({outputSize.desc})
            </Button>
            <Button variant="ghost" size="sm" className="w-full text-[var(--text-tertiary)]" onClick={() => { setImages([]); setOverlays([]); setSelectedOverlay(null) }}>
              <RotateCcw className="w-4 h-4" /> Reset All
            </Button>
          </div>
        </div>
      </div>

      {/* Right: Preview */}
      <div
        className="flex-1 flex items-center justify-center p-4 lg:p-8 pb-24 lg:pb-8 bg-[var(--canvas-bg)]"
        onClick={() => setSelectedOverlay(null)}
      >
        <div
          ref={previewRef}
          className="relative shadow-2xl overflow-hidden"
          style={{
            width: `min(80vw, ${previewMaxW}px)`,
            height: `min(80vh, ${previewMaxH}px)`,
            background: bgGradient ? bgGradient.css : bgColor,
            borderRadius: `${borderRadius}px`,
            aspectRatio: `${outputSize.w} / ${outputSize.h}`,
          }}
          onPointerMove={handleOverlayPointerMove}
          onPointerUp={handleOverlayPointerUp}
        >
          {images.length === 0 ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-[var(--text-muted)]">
              <Grid className="w-12 h-12 mb-3 opacity-30" />
              <p className="text-sm font-medium">Upload images to start</p>
              <p className="text-xs opacity-50 mt-1">Select a layout and add {layout.cells} images</p>
            </div>
          ) : (
            layout.positions(600, 600 / previewAspect * (outputSize.h / outputSize.w) * previewAspect, padding).map((pos, i) => {
              const refW = 600
              const refH = 600 / previewAspect * (outputSize.h / outputSize.w) * previewAspect
              const img = images[i]
              return (
                <div
                  key={i}
                  className="absolute overflow-hidden"
                  style={{
                    left: `${(pos.x / refW) * 100}%`,
                    top: `${(pos.y / refH) * 100}%`,
                    width: `${(pos.w / refW) * 100}%`,
                    height: `${(pos.h / refH) * 100}%`,
                    borderRadius: `${borderRadius * 0.6}px`,
                    backgroundColor: img ? undefined : 'rgba(255,255,255,0.03)',
                    border: img ? undefined : '2px dashed rgba(255,255,255,0.06)',
                  }}
                >
                  {img ? (
                    <img src={img.url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex items-center justify-center h-full text-[var(--text-muted)] text-xs">
                      {i + 1}
                    </div>
                  )}
                </div>
              )
            })
          )}

          {/* Draggable overlays in preview */}
          {overlays.map(ov => (
            <div
              key={ov.id}
              className={`absolute cursor-grab active:cursor-grabbing select-none ${
                selectedOverlay === ov.id ? 'ring-2 ring-[#FF6B4A] ring-offset-1 ring-offset-transparent' : ''
              }`}
              style={{
                left: `${ov.x}%`,
                top: `${ov.y}%`,
                transform: 'translate(-50%, -50%)',
                zIndex: draggingOverlayId === ov.id ? 50 : 10,
              }}
              onPointerDown={(e) => handleOverlayPointerDown(e, ov)}
              onClick={(e) => e.stopPropagation()}
            >
              {ov.type === 'asset' && ov.src ? (
                <img
                  src={ov.src}
                  alt=""
                  className="pointer-events-none"
                  style={{ width: `${ov.size * 3}px`, height: `${ov.size * 3}px` }}
                  draggable={false}
                />
              ) : (
                <span
                  className="pointer-events-none whitespace-nowrap"
                  style={{
                    fontFamily: ov.fontFamily || 'Impact',
                    fontSize: `${(ov.fontSize || 48) * 0.5}px`,
                    fontWeight: 'bold',
                    color: ov.fill || '#ffffff',
                    textShadow: ov.strokeWidth && ov.strokeWidth > 0
                      ? `0 0 ${ov.strokeWidth}px ${ov.stroke || '#000'}, 0 0 ${ov.strokeWidth * 2}px ${ov.stroke || '#000'}`
                      : undefined,
                    WebkitTextStroke: ov.strokeWidth && ov.strokeWidth > 0 ? `${ov.strokeWidth * 0.5}px ${ov.stroke || '#000'}` : undefined,
                  }}
                >
                  {ov.text}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}
