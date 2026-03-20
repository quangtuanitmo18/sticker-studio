'use client'

import { AssetPanel } from '@/components/shared/AssetPanel'
import type { ExportFormat } from '@/components/shared/ExportFormatPanel'
import { ExportFormatPanel, canvasToExportDataUrl } from '@/components/shared/ExportFormatPanel'
import OverlayCanvas, { type CanvasElement, type OverlayCanvasHandle } from '@/components/shared/OverlayCanvas'
import { OverlayList } from '@/components/shared/OverlayList'
import { TextPanel } from '@/components/shared/TextPanel'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/toast'
import { useHistory } from '@/hooks/use-history'
import { downloadUrl } from '@/lib/download'
import { TEXT_PRESETS } from '@/lib/shared-assets'
import { Download, Grid, GripVertical, Layers, Loader2, Plus, Redo2, RotateCcw, Trash2, Type, Undo2, UploadCloud } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
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

// CollageOverlay replaced by shared CanvasElement from OverlayCanvas

type SideTab = 'layout' | 'text' | 'assets'

export default function CollagePage() {
  const [images, setImages] = useState<{ id: string; url: string; file: File }[]>([])
  const [layout, setLayout] = useState<LayoutTemplate>(LAYOUTS[0])
  const [bgColor, setBgColor] = useState('#0C0A09')
  const [bgGradient, setBgGradient] = useState<typeof BG_GRADIENTS[0] | null>(null)
  const [padding, setPadding] = useState(12)
  const [borderRadius, setBorderRadius] = useState(16)
  const [outputSize, setOutputSize] = useState(OUTPUT_SIZES[0])
  const [showExport, setShowExport] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [overlays, setOverlays] = useState<CanvasElement[]>([])
  const [sideTab, setSideTab] = useState<SideTab>('layout')
  const [dragIdx, setDragIdx] = useState<number | null>(null)
  const [selectedOverlay, setSelectedOverlay] = useState<string | null>(null)
  const [zoom, setZoom] = useState(1)
  const previewRef = useRef<HTMLDivElement>(null)
  const overlayRef = useRef<OverlayCanvasHandle>(null)
  const [previewDims, setPreviewDims] = useState({ w: 0, h: 0 })
  const [exportFormat, setExportFormat] = useState<ExportFormat>('png')
  const { toast } = useToast()

  // Text panel state
  const [stickerText, setStickerText] = useState('')
  const [fontFamily, setFontFamily] = useState('Impact')
  const [fontSize, setFontSize] = useState(48)
  const [textColor, setTextColor] = useState('#ffffff')
  const [textStroke, setTextStroke] = useState('#000000')
  const [textStrokeWidth, setTextStrokeWidth] = useState(3)

  // Undo/redo
  const history = useHistory<CanvasElement[]>([])

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

  // ─── Asset + Text overlay handlers (Konva-based) ───────────
  const addAssetOverlay = (src: string) => {
    const pw = previewDims.w || 300
    const newOverlays: CanvasElement[] = [...overlays, { id: `ov-${Date.now()}`, type: 'image' as const, src, x: pw / 2 - 30 + Math.random() * 40 - 20, y: (previewDims.h || 300) / 2 - 30, width: 60, height: 60 }]
    setOverlays(newOverlays)
    history.set(newOverlays)
  }

  const addTextOverlay = (config: { text: string; fontFamily: string; fontSize: number; fill: string; stroke: string; strokeWidth: number }) => {
    const newOverlays: CanvasElement[] = [...overlays, { id: `txt-${Date.now()}`, type: 'text' as const, text: config.text, fontFamily: config.fontFamily, fontSize: config.fontSize, fill: config.fill, stroke: config.stroke, strokeWidth: config.strokeWidth, x: (previewDims.w || 300) / 4, y: (previewDims.h || 300) / 2 }]
    setOverlays(newOverlays)
    history.set(newOverlays)
    setStickerText('')
  }

  const addTextPreset = (preset: typeof TEXT_PRESETS[0]) => {
    const newOverlays: CanvasElement[] = [...overlays, { id: `txt-${Date.now()}`, type: 'text' as const, text: preset.label.split(' ').slice(1).join(' ') || preset.label, fontFamily: preset.font, fontSize: preset.size, fill: preset.fill, stroke: preset.stroke, strokeWidth: preset.strokeWidth, x: (previewDims.w || 300) / 4, y: (previewDims.h || 300) / 2 }]
    setOverlays(newOverlays)
    history.set(newOverlays)
  }

  const removeOverlay = (id: string) => {
    const newOverlays = overlays.filter(o => o.id !== id)
    setOverlays(newOverlays)
    history.set(newOverlays)
    if (selectedOverlay === id) setSelectedOverlay(null)
  }

  const selectedOv = overlays.find(o => o.id === selectedOverlay)

  // Sync TextPanel when overlay is selected
  useEffect(() => {
    if (!selectedOv || selectedOv.type !== 'text') return
    setSideTab('text')
    setStickerText(selectedOv.text || '')
    setFontFamily(selectedOv.fontFamily || 'Anton')
    setFontSize(selectedOv.fontSize || 48)
    setTextColor(selectedOv.fill || '#ffffff')
    setTextStroke(selectedOv.stroke || '#000000')
    setTextStrokeWidth(selectedOv.strokeWidth || 3)
  }, [selectedOverlay]) // eslint-disable-line react-hooks/exhaustive-deps

  // Update a property on the selected text element directly without relying on flaky useEffects
  const updateSelectedText = (patch: Partial<CanvasElement>) => {
    if (!selectedOverlay) return
    setOverlays(prev => prev.map(o => o.id === selectedOverlay && o.type === 'text' ? { ...o, ...patch } : o))
  }

  const handleUndo = () => {
    history.undo()
    setOverlays(history.state)
  }

  const handleRedo = () => {
    history.redo()
    setOverlays(history.state)
  }

  // Track preview container dimensions for Konva stage sizing
  useEffect(() => {
    const el = previewRef.current
    if (!el) return
    const ro = new ResizeObserver(entries => {
      for (const entry of entries) {
        setPreviewDims({ w: entry.contentRect.width, h: entry.contentRect.height })
      }
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

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

      // Composite Konva overlay layer
      if (overlays.length > 0 && overlayRef.current) {
        const overlayDataUrl = await overlayRef.current.exportOverlay(W, H)
        if (overlayDataUrl) {
          const overlayImg = await loadImage(overlayDataUrl)
          ctx.drawImage(overlayImg, 0, 0, W, H)
        }
      }

      const dataUrl = canvasToExportDataUrl(canvas, exportFormat)
      downloadUrl(dataUrl, `collage_${outputSize.id}.${exportFormat}`)
      toast(`Collage exported as ${exportFormat.toUpperCase()}!`, 'success')
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

  // ─── Shared sidebar content ────────────────────────────────
  const sidebarContent = (
    <>
        {/* Header */}
        <div className="p-3 lg:p-5 pb-2 lg:pb-3">
          <div className="hidden lg:flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-xl bg-linear-to-br from-[#EC4899] to-[#F59E0B] flex items-center justify-center">
              <Grid className="w-4.5 h-4.5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-(--text-primary)">Collage Maker</h2>
              <p className="text-xs text-(--text-muted)">Combine images into one design</p>
            </div>
          </div>

          {/* Tab switcher */}
          <div className="flex gap-1 bg-(--card-bg) rounded-xl p-1">
            {SIDE_TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setSideTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                  sideTab === tab.id
                    ? 'bg-[#FF6B4A]/15 text-[#FF6B4A]'
                    : 'text-(--text-muted) hover:text-(--text-secondary)'
                }`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="px-4 lg:px-5 pb-5 space-y-5">
          {/* ── LAYOUT TAB ── */}
          {sideTab === 'layout' && (
            <>
              {/* Upload */}
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider text-(--text-muted) mb-2 block">
                  Images ({images.length}/{layout.cells})
                </label>
                <div {...getRootProps()} className={`rounded-xl border-2 border-dashed py-5 flex flex-col items-center cursor-pointer transition-all
                  ${isDragActive ? 'border-[#FF6B4A] bg-[#FF6B4A]/5' : 'border-(--overlay-border) hover:border-(--overlay-border-hover)'}`}
                >
                  <input {...getInputProps()} />
                  <UploadCloud className="w-5 h-5 text-(--text-muted) mb-1.5" />
                  <p className="text-xs text-(--text-tertiary)">{isDragActive ? 'Drop here' : 'Drop images or click to upload'}</p>
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
                        <img src={img.url} alt={`Uploaded image ${idx + 1}`} className="w-full h-full object-cover" />
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
                <label className="text-[11px] font-semibold uppercase tracking-wider text-(--text-muted) mb-2 block">Layout</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {LAYOUTS.map(l => (
                    <button
                      key={l.id}
                      onClick={() => { setLayout(l); setImages(prev => prev.slice(0, l.cells)) }}
                      className={`py-2.5 rounded-lg text-center transition-all cursor-pointer ${
                        layout.id === l.id
                          ? 'bg-[#FF6B4A]/15 text-[#FF6B4A] border border-[#FF6B4A]/20'
                          : 'bg-(--card-bg) text-(--text-tertiary) border border-(--overlay-border) hover:bg-(--card-bg-hover)'
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
                <label className="text-[11px] font-semibold uppercase tracking-wider text-(--text-muted) mb-2 block">Output Size</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {OUTPUT_SIZES.map(s => (
                    <button
                      key={s.id}
                      onClick={() => setOutputSize(s)}
                      className={`py-2 rounded-lg text-center transition-all cursor-pointer ${
                        outputSize.id === s.id
                          ? 'bg-[#FF6B4A]/15 text-[#FF6B4A] border border-[#FF6B4A]/20'
                          : 'bg-(--card-bg) text-(--text-tertiary) border border-(--overlay-border) hover:bg-(--card-bg-hover)'
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
                <label className="text-[11px] font-semibold uppercase tracking-wider text-(--text-muted) mb-2 block">Background</label>
                <div className="grid grid-cols-5 gap-1.5">
                  {BG_COLORS.map(color => (
                    <button
                      key={color}
                      onClick={() => { setBgColor(color); setBgGradient(null) }}
                      className={`aspect-square rounded-lg border-2 transition-all cursor-pointer ${
                        bgColor === color && !bgGradient ? 'border-[#FF6B4A] scale-110' : 'border-(--overlay-border)'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <input type="color" value={bgColor} onChange={e => { setBgColor(e.target.value); setBgGradient(null) }} className="w-7 h-7 rounded cursor-pointer border border-(--overlay-border)" />
                  <span className="text-xs text-(--text-muted) font-mono uppercase">{bgGradient ? bgGradient.label : bgColor}</span>
                </div>
              </div>

              {/* Gradients */}
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider text-(--text-muted) mb-2 block">Gradients</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {BG_GRADIENTS.map(g => (
                    <button
                      key={g.id}
                      onClick={() => setBgGradient(g)}
                      className={`h-10 rounded-lg border-2 transition-all cursor-pointer ${
                        bgGradient?.id === g.id ? 'border-[#FF6B4A] scale-105' : 'border-(--overlay-border)'
                      }`}
                      style={{ background: g.css }}
                      title={g.label}
                    />
                  ))}
                </div>
              </div>

              {/* Spacing */}
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider text-(--text-muted) mb-1 block">
                  Padding: {padding}px
                </label>
                <input type="range" min="0" max="40" value={padding} onChange={e => setPadding(Number(e.target.value))}
                  className="w-full" style={{ background: `linear-gradient(to right, #FF6B4A ${padding * 2.5}%, rgba(255,255,255,0.06) ${padding * 2.5}%)` }}
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider text-(--text-muted) mb-1 block">
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
              onTextChange={v => { setStickerText(v); updateSelectedText({ text: v }) }}
              fontFamily={fontFamily}
              onFontChange={v => { setFontFamily(v); updateSelectedText({ fontFamily: v }) }}
              fontSize={fontSize}
              onSizeChange={v => { setFontSize(v); updateSelectedText({ fontSize: v }) }}
              fillColor={textColor}
              onFillChange={v => { setTextColor(v); updateSelectedText({ fill: v }) }}
              strokeColor={textStroke}
              onStrokeChange={v => { setTextStroke(v); updateSelectedText({ stroke: v }) }}
              strokeWidth={textStrokeWidth}
              onStrokeWidthChange={v => { setTextStrokeWidth(v); updateSelectedText({ strokeWidth: v }) }}
              onAddText={addTextOverlay}
              onAddPreset={addTextPreset}
              selectedText={selectedOv?.type === 'text' ? selectedOv.text : undefined}
            />
          )}

          {/* ── ASSETS TAB ── */}
          {sideTab === 'assets' && (
            <AssetPanel onAddAsset={addAssetOverlay} />
          )}

          {/* Overlay list — shared component */}
          <OverlayList
            overlays={overlays}
            selectedId={selectedOverlay}
            onSelect={setSelectedOverlay}
            onRemove={removeOverlay}
          />

          <div className="space-y-2 pt-2">
            <Button variant="ghost" size="sm" className="w-full text-(--text-tertiary)" onClick={() => { setImages([]); setOverlays([]); setSelectedOverlay(null) }}>
              <RotateCcw className="w-4 h-4" /> Reset All
            </Button>
          </div>
        </div>
    </>
  )

  return (
    <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
      {/* ═══ DESKTOP SIDEBAR — hidden on mobile ═══ */}
      <div className="hidden lg:flex lg:w-[340px] shrink-0 bg-(--panel-bg) border-r border-(--overlay-border) overflow-y-auto h-screen flex-col">
        {sidebarContent}
      </div>

      {/* ═══ MAIN AREA — Preview ═══ */}
      <div
        className="flex-1 flex flex-col p-2 lg:p-8 pb-52 lg:pb-8 bg-(--canvas-bg) relative"
        onClick={() => { setSelectedOverlay(null); setShowExport(false) }}
      >
        {/* Export Controls */}
        <div className="absolute top-6 right-6 z-50 flex flex-col items-end gap-2" onClick={e => e.stopPropagation()}>
          <button 
            title="Export"
            disabled={images.length === 0}
            onClick={() => images.length > 0 && setShowExport(!showExport)} 
            className={`h-8 px-3 flex items-center justify-center gap-1.5 rounded-xl shadow-xl border transition-all font-semibold text-[11px] ${images.length === 0 ? 'opacity-40 cursor-not-allowed bg-[var(--panel-bg)] border-[var(--overlay-border)] text-[var(--text-muted)]' : showExport ? 'bg-[#FF6B4A] border-[#FF6B4A] text-white cursor-pointer' : 'bg-[var(--panel-bg)] border-[var(--overlay-border)] text-[var(--text-secondary)] hover:bg-[var(--card-bg-hover)] cursor-pointer'}`}
          >
            <Download className="w-4 h-4" /> Export
          </button>
          {showExport && images.length > 0 && (
            <div className="bg-[var(--panel-bg)] p-3 rounded-2xl shadow-xl border border-[var(--overlay-border)] w-48 animate-in fade-in slide-in-from-top-2">
              <ExportFormatPanel
                format={exportFormat}
                onFormatChange={setExportFormat}
                onExport={handleExport}
                isExporting={isExporting}
                disabled={images.length === 0}
                exportLabel={`Export (${outputSize.desc})`}
              />
            </div>
          )}
        </div>

        {/* Canvas Controls */}
        <div className="absolute bottom-6 right-6 z-50 flex flex-col gap-3">
          {/* Undo/Redo */}
          <div className="flex flex-col gap-2 bg-(--panel-bg) p-2 rounded-2xl shadow-lg border border-(--overlay-border)">
            <button title="Undo" onClick={(e) => { e.stopPropagation(); }} className="w-8 h-8 flex items-center justify-center rounded-xl bg-(--card-bg) hover:bg-(--card-bg-hover) text-(--text-secondary) transition-all cursor-pointer"><Undo2 className="w-4 h-4" /></button>
            <button title="Redo" onClick={(e) => { e.stopPropagation(); }} className="w-8 h-8 flex items-center justify-center rounded-xl bg-(--card-bg) hover:bg-(--card-bg-hover) text-(--text-secondary) transition-all cursor-pointer"><Redo2 className="w-4 h-4" /></button>
          </div>
          
          {/* Zoom */}
          <div className="flex flex-col gap-2 bg-(--panel-bg) p-2 rounded-2xl shadow-xl border border-(--overlay-border)">
            <button onClick={(e) => { e.stopPropagation(); setZoom(Math.min(zoom + 0.1, 3)) }} className="w-8 h-8 flex items-center justify-center rounded-xl bg-(--card-bg) hover:bg-(--card-bg-hover) text-(--text-secondary) transition-all cursor-pointer"><Plus className="w-4 h-4" /></button>
            <div className="text-[10px] font-bold text-center text-(--text-muted) w-8">{Math.round(zoom * 100)}%</div>
            <button onClick={(e) => { e.stopPropagation(); setZoom(Math.max(zoom - 0.1, 0.5)) }} className="w-8 h-8 flex items-center justify-center rounded-xl bg-(--card-bg) hover:bg-(--card-bg-hover) text-(--text-secondary) transition-all cursor-pointer"><div className="w-3 h-0.5 bg-current rounded-full" /></button>
          </div>
        </div>

        <div className="flex-1 overflow-auto rounded-xl">
          <div 
            style={{ 
              width: `${Math.max(100, zoom * 100)}%`, 
              height: `${Math.max(100, zoom * 100)}%`, 
              display: 'flex', 
              minWidth: '100%',
              minHeight: '100%' 
            }}
          >
          <div 
            className="w-full h-full flex items-center justify-center p-4 origin-top-left transition-transform duration-200"
            style={{ transform: `scale(${zoom})`, width: `${(1 / zoom) * 100}%`, height: `${(1 / zoom) * 100}%` }}
          >
            <div
              ref={previewRef}
              className="relative shadow-2xl overflow-hidden shrink-0"
              style={{
                width: `min(80vw, ${previewMaxW}px)`,
                height: `min(80vh, ${previewMaxH}px)`,
                background: bgGradient ? bgGradient.css : bgColor,
                borderRadius: `${borderRadius}px`,
                aspectRatio: `${outputSize.w} / ${outputSize.h}`,
              }}
            >
          {images.length === 0 ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-(--text-muted)">
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
                    <img src={img.url} alt={`Collage cell ${i + 1}`} className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex items-center justify-center h-full text-(--text-muted) text-xs">
                      {i + 1}
                    </div>
                  )}
                </div>
              )
            })
          )}

          {/* Konva overlay layer for text/assets */}
          {previewDims.w > 0 && previewDims.h > 0 && (
            <OverlayCanvas
              ref={overlayRef}
              elements={overlays}
              setElements={setOverlays}
              selectedId={selectedOverlay}
              setSelectedId={setSelectedOverlay}
              width={previewDims.w}
              height={previewDims.h}
            />
          )}
        </div>
      </div>
      </div>
      </div>
    </div>

      {/* ═══ MOBILE: Floating export button ═══ */}
      {images.length > 0 && (
        <div className="lg:hidden fixed bottom-[200px] md:bottom-[140px] left-1/2 -translate-x-1/2 z-52">
          <button onClick={handleExport} disabled={isExporting}
            className="flex items-center gap-2 px-6 py-3 rounded-full bg-[#FF6B4A] text-white font-semibold text-sm shadow-[0_4px_24px_rgba(255,107,74,0.4)] active:scale-95 transition-all touch-manipulation disabled:opacity-50">
            {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            Export
          </button>
        </div>
      )}

      {/* ═══ MOBILE BOTTOM SHEET ═══ */}
      <CollageMobileSheet>
        {sidebarContent}
      </CollageMobileSheet>
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

function CollageMobileSheet({ children }: { children: React.ReactNode }) {
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
      style={{ height: expanded ? '55vh' : '110px', transition: 'height 0.3s cubic-bezier(0.32,0.72,0,1)' }}
    >
      <div className="shrink-0 flex items-center justify-center py-2.5 cursor-grab active:cursor-grabbing touch-manipulation" onPointerDown={onDragStart} onClick={() => setExpanded(v => !v)}>
        <div className="w-10 h-1 rounded-full bg-[var(--text-muted)]/30" />
      </div>
      <div className={`flex-1 overflow-y-auto overscroll-contain ${expanded ? '' : 'overflow-hidden'}`}>
        {children}
      </div>
    </div>
  )
}
