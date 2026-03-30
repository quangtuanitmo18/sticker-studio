'use client'

import { AssetPanel } from '@/components/shared/AssetPanel'
import type { ExportFormat } from '@/components/shared/ExportFormatPanel'
import { ExportFormatPanel, exportCanvasAs } from '@/components/shared/ExportFormatPanel'
import OverlayCanvas, { type CanvasElement, type OverlayCanvasHandle } from '@/components/shared/OverlayCanvas'
import { SidebarHeader } from '@/components/shared/SidebarHeader'
import { SidebarTabStrip } from '@/components/shared/SidebarTabStrip'
import { TextPanel } from '@/components/shared/TextPanel'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/toast'
import { AR_CATEGORIES, AR_FILTERS, type ARFilter } from '@/lib/ar-filters'
import { FILTER_CATEGORIES, IMAGE_FILTERS } from '@/lib/image-filters'
import { TEXT_PRESETS } from '@/lib/shared-assets'
import {
  Camera, CameraIcon,
  Download,
  Eye,
  FlipHorizontal2,
  Frame,
  Grid, Layers, Loader2,
  Minus,
  Pencil,
  Plus,
  Redo2,
  RefreshCw, RotateCcw, ScanFace, Settings, Sparkles, Star,
  SwitchCamera,
  Trash2, Type,
  Undo2,
  X
} from 'lucide-react'
import dynamic from 'next/dynamic'
import { useCallback, useEffect, useRef, useState } from 'react'

const ARFaceFilter = dynamic(() => import('@/components/shared/ARFaceFilter'), { ssr: false })
import type { FrameTemplate } from '../frame-editor/FrameEditorClient'
import FrameEditorClient from '../frame-editor/FrameEditorClient'
import {
  STRIP_BACKGROUNDS,
  STRIP_TEMPLATES,
  loadImage,
  playBeep,
  playShutterSound,
  type StripTemplate,
} from './booth-utils'

// BoothOverlay replaced by shared CanvasElement from OverlayCanvas

// CSS filter approximations for live camera preview
const CSS_FILTER_PREVIEW: Record<string, string> = {
  none: '',
  grayscale: 'grayscale(100%)',
  sepia: 'sepia(80%)',
  vintage: 'sepia(30%) contrast(110%) brightness(105%)',
  warm: 'sepia(20%) brightness(105%)',
  cool: 'hue-rotate(15deg) brightness(105%)',
  vivid: 'saturate(180%) contrast(115%)',
  fade: 'brightness(110%) contrast(85%) saturate(70%)',
  dramatic: 'contrast(140%) brightness(90%) saturate(120%)',
  neon: 'saturate(200%) contrast(130%) brightness(110%)',
  duotone_blue: 'grayscale(100%) sepia(100%) hue-rotate(180deg) saturate(200%)',
  duotone_pink: 'grayscale(100%) sepia(100%) hue-rotate(290deg) saturate(200%)',
  invert: 'invert(100%)',
  pixel: '',
  posterize: 'contrast(150%) saturate(130%)',
  vignette: '',
}

type SideTab = 'capture' | 'filters' | 'text' | 'assets' | 'adjust' | 'frames'

export default function PhotoboothPage() {
  // Camera
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [cameraActive, setCameraActive] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [mirrored, setMirrored] = useState(true)
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user')
  const [countdown, setCountdown] = useState(0)
  const [countdownDuration, setCountdownDuration] = useState(3)
  const [showFlash, setShowFlash] = useState(false)

  // Photos
  const [capturedPhotos, setCapturedPhotos] = useState<HTMLCanvasElement[]>([])
  const [stripTemplate, setStripTemplate] = useState<StripTemplate>(STRIP_TEMPLATES[0])
  const [stripBg, setStripBg] = useState('white')
  const [reviewMode, setReviewMode] = useState(false)
  const [selectedForReview, setSelectedForReview] = useState<boolean[]>([])
  const [zoom, setZoom] = useState(1)

  // Custom frame templates
  const [customFrames, setCustomFrames] = useState<FrameTemplate[]>([])
  const [activeCustomFrame, setActiveCustomFrame] = useState<FrameTemplate | null>(null)
  const [slotOffsets, setSlotOffsets] = useState<Record<number, { ox: number; oy: number; scale: number }>>({})

  // Frame Editor modal
  const [showFrameEditor, setShowFrameEditor] = useState(false)
  const [editingFrame, setEditingFrame] = useState<FrameTemplate | null>(null)

  // Filters
  const [activeFilter, setActiveFilter] = useState('none')
  const [activeFilterCategory, setActiveFilterCategory] = useState('color')

  // Overlays (Konva-based)
  const [overlays, setOverlays] = useState<CanvasElement[]>([])
  const [selectedOverlay, setSelectedOverlay] = useState<string | null>(null)
  const overlayRef = useRef<OverlayCanvasHandle>(null)
  const [previewDims, setPreviewDims] = useState({ w: 0, h: 0 })

  // Text panel
  const [stickerText, setStickerText] = useState('')
  const [fontFamily, setFontFamily] = useState('Impact')
  const [fontSize, setFontSize] = useState(48)
  const [textColor, setTextColor] = useState('#ffffff')
  const [textStroke, setTextStroke] = useState('#000000')
  const [textStrokeWidth, setTextStrokeWidth] = useState(3)

  // Adjustments
  const [brightness, setBrightness] = useState(100)
  const [contrast, setContrast] = useState(100)
  const [saturation, setSaturation] = useState(100)

  // UI
  const [sideTab, setSideTab] = useState<SideTab>('capture')
  const [isExporting, setIsExporting] = useState(false)
  const [burstMode, setBurstMode] = useState(false)
  const [isBursting, setIsBursting] = useState(false)
  const [showCurtain, setShowCurtain] = useState(false)
  const [exportFormat, setExportFormat] = useState<ExportFormat>('png')
  const [showExport, setShowExport] = useState(false)

  // AR Face Filters
  const [arEnabled, setArEnabled] = useState(false)
  const [activeARFilters, setActiveARFilters] = useState<ARFilter[]>([])
  const [arFilterCategory, setArFilterCategory] = useState<string>('facepaint')
  const [arLoading, setArLoading] = useState(false)
  const [isSwitching, setIsSwitching] = useState(false)
  const [switchToBg, setSwitchToBg] = useState<string | null>(null)
  const arRef = useRef<import('@/components/shared/ARFaceFilter').ARFaceFilterHandle>(null)

  const previewRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  // ─── Camera ────────────────────────────────────────────────
  const startCamera = useCallback(async (facing?: 'user' | 'environment') => {
    try {
      setCameraError(null)
      streamRef.current?.getTracks().forEach(t => t.stop())
      const mode = facing || facingMode
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: mode },
        audio: false,
      })
      streamRef.current = stream
      if (videoRef.current) { videoRef.current.srcObject = stream; await videoRef.current.play() }
      setCameraActive(true)
      if (facing) setFacingMode(facing)
    } catch { setCameraError('Could not access camera. Please allow permissions.') }
  }, [facingMode])

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
    if (videoRef.current) videoRef.current.srcObject = null
    setCameraActive(false)
  }, [])

  const switchCamera = useCallback(() => {
    const next = facingMode === 'user' ? 'environment' : 'user'
    setMirrored(next === 'user')
    startCamera(next)
  }, [facingMode, startCamera])

  useEffect(() => () => { streamRef.current?.getTracks().forEach(t => t.stop()) }, [])

  // Load custom frames from localStorage + Supabase cloud
  useEffect(() => {
    // Local frames
    let localFrames: FrameTemplate[] = []
    try {
      localFrames = JSON.parse(localStorage.getItem('sticker-studio-frame-templates') || '[]')
    } catch { /* ignore */ }
    setCustomFrames(localFrames)

    // Cloud frames
    fetch('/api/frames')
      .then(r => r.json())
      .then(data => {
        if (data.frames && data.frames.length > 0) {
          const cloudFrames: FrameTemplate[] = data.frames.map((f: any) => ({
            id: f.id,
            name: f.name,
            width: f.width,
            height: f.height,
            slots: f.slots,
            frameDataUrl: f.frameUrl || '',
            createdAt: f.createdAt,
            isCloud: true,
          }))
          // Merge: local first, then cloud (skip duplicates by name)
          const localNames = new Set(localFrames.map(f => f.name))
          const merged = [...localFrames, ...cloudFrames.filter(f => !localNames.has(f.name))]
          setCustomFrames(merged)
        }
      })
      .catch(err => console.warn('Failed to load cloud frames:', err))
  }, [])

  // ─── Capture ───────────────────────────────────────────────
  const capturePhoto = useCallback(() => {
    // AR mode: capture from WebGL canvas then apply adjustments + image filter
    if (arEnabled && arRef.current) {
      const arCanvas = arRef.current.captureFrame()
      if (!arCanvas) return null
      const out = document.createElement('canvas')
      out.width = arCanvas.width; out.height = arCanvas.height
      const ctx = out.getContext('2d')!
      ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`
      ctx.drawImage(arCanvas, 0, 0)
      ctx.filter = 'none'
      if (activeFilter !== 'none') {
        const f = IMAGE_FILTERS.find(fl => fl.id === activeFilter)
        if (f) f.apply(ctx, out)
      }
      return out
    }
    // Normal mode: capture from video
    if (!videoRef.current || !cameraActive) return null
    const v = videoRef.current
    const canvas = document.createElement('canvas')
    canvas.width = v.videoWidth; canvas.height = v.videoHeight
    const ctx = canvas.getContext('2d')!
    if (mirrored) { ctx.translate(canvas.width, 0); ctx.scale(-1, 1) }
    ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`
    ctx.drawImage(v, 0, 0); ctx.filter = 'none'
    if (activeFilter !== 'none') {
      const f = IMAGE_FILTERS.find(fl => fl.id === activeFilter)
      if (f) f.apply(ctx, canvas)
    }
    return canvas
  }, [arEnabled, cameraActive, mirrored, brightness, contrast, saturation, activeFilter])

  const triggerFlash = () => {
    setShowFlash(true); setTimeout(() => setShowFlash(false), 300)
  }

  const handleCapture = useCallback(() => {
    if (countdown > 0 || isBursting) return
    const doCapture = () => {
      playShutterSound(); triggerFlash()
      const photo = capturePhoto()
      if (photo) { setCapturedPhotos(prev => [...prev, photo]); toast('📸 Captured!', 'success') }
    }
    const doBurst = async () => {
      setIsBursting(true)
      const photos: HTMLCanvasElement[] = []
      for (let i = 0; i < stripTemplate.slots + 2; i++) {
        playShutterSound(); triggerFlash()
        const photo = capturePhoto()
        if (photo) photos.push(photo)
        if (i < stripTemplate.slots + 1) await new Promise(r => setTimeout(r, 1500))
      }
      setCapturedPhotos(photos)
      setSelectedForReview(photos.map(() => true))
      setReviewMode(true)
      setIsBursting(false)
      toast(`🎞️ ${photos.length} photos! Review & pick your favorites`, 'success')
    }
    if (countdownDuration === 0) {
      burstMode ? doBurst() : doCapture()
    } else {
      let remaining = countdownDuration
      setCountdown(remaining); playBeep()
      const interval = setInterval(() => {
        remaining--; setCountdown(remaining); if (remaining > 0) playBeep()
        if (remaining === 0) { clearInterval(interval); setTimeout(() => { burstMode ? doBurst() : doCapture() }, 100) }
      }, 1000)
    }
  }, [countdown, isBursting, countdownDuration, capturePhoto, burstMode, stripTemplate.slots, toast])

  // ─── Review mode ───────────────────────────────────────────
  const confirmReview = () => {
    const kept = capturedPhotos.filter((_, i) => selectedForReview[i])
    setCapturedPhotos(kept); setReviewMode(false)
    toast(`✅ Kept ${kept.length} photos`, 'success')
  }

  const retakePhoto = (index: number) => {
    const photo = capturePhoto()
    if (photo) {
      playShutterSound(); triggerFlash()
      setCapturedPhotos(prev => prev.map((p, i) => i === index ? photo : p))
      toast('🔄 Photo retaken!', 'success')
    }
  }

  // ─── Overlays (Konva-based) ──────────────────────────────────
  const addAssetOverlay = (src: string) => {
    const pw = previewDims.w || 300
    setOverlays(prev => [...prev, { id: `ov-${Date.now()}`, type: 'image' as const, src, x: pw / 2 - 30 + Math.random() * 40 - 20, y: pw / 2 - 30, width: 60, height: 60 }])
  }
  const addTextOverlay = (config: { text: string; fontFamily: string; fontSize: number; fill: string; stroke: string; strokeWidth: number }) => {
    const pw = previewDims.w || 300
    setOverlays(prev => [...prev, { id: `txt-${Date.now()}`, type: 'text' as const, text: config.text, fontFamily: config.fontFamily, fontSize: config.fontSize, fill: config.fill, stroke: config.stroke, strokeWidth: config.strokeWidth, x: pw / 4, y: previewDims.h ? previewDims.h / 2 : 200 }])
    setStickerText('')
  }
  const addTextPreset = (preset: typeof TEXT_PRESETS[0]) => {
    const pw = previewDims.w || 300
    setOverlays(prev => [...prev, { id: `txt-${Date.now()}`, type: 'text' as const, text: preset.label.split(' ').slice(1).join(' ') || preset.label, fontFamily: preset.font, fontSize: preset.size, fill: preset.fill, stroke: preset.stroke, strokeWidth: preset.strokeWidth, x: pw / 4, y: previewDims.h ? previewDims.h / 2 : 200 }])
  }
  const removeOverlay = (id: string) => { setOverlays(prev => prev.filter(o => o.id !== id)); if (selectedOverlay === id) setSelectedOverlay(null) }
  const selectedOv = overlays.find(o => o.id === selectedOverlay)

  // Sync TextPanel controls when selecting a text overlay via sidebar
  const selectOverlayAndSync = (ov: CanvasElement) => {
    setSelectedOverlay(ov.id)
    if (ov.type === 'text') {
      setSideTab('text')
      setStickerText(ov.text || '')
      setFontFamily(ov.fontFamily || 'Anton')
      setFontSize(ov.fontSize || 48)
      setTextColor(ov.fill || '#ffffff')
      setTextStroke(ov.stroke || '#000000')
      setTextStrokeWidth(ov.strokeWidth || 3)
    } else {
      setSideTab('assets')
    }
  }

  // Sync TextPanel when overlay is selected on the canvas (not just sidebar)
  useEffect(() => {
    if (!selectedOv) return
    if (selectedOv.type === 'text') {
      setSideTab('text')
      setStickerText(selectedOv.text || '')
      setFontFamily(selectedOv.fontFamily || 'Anton')
      setFontSize(selectedOv.fontSize || 48)
      setTextColor(selectedOv.fill || '#ffffff')
      setTextStroke(selectedOv.stroke || '#000000')
      setTextStrokeWidth(selectedOv.strokeWidth || 3)
    }
  }, [selectedOverlay]) // eslint-disable-line react-hooks/exhaustive-deps

  // Update a property on the selected text element directly without relying on flaky useEffects
  const updateSelectedText = (patch: Partial<CanvasElement>) => {
    if (!selectedOverlay) return
    setOverlays(prev => prev.map(o => o.id === selectedOverlay && o.type === 'text' ? { ...o, ...patch } : o))
  }

  // Track preview container dimensions and handle non-passive wheel events
  useEffect(() => {
    const el = previewRef.current
    if (!el) return
    const ro = new ResizeObserver(entries => {
      for (const entry of entries) {
        setPreviewDims({ w: entry.contentRect.width, h: entry.contentRect.height })
      }
    })
    ro.observe(el)

    // Prevent passive scroll on slot zones (React's onWheel is passive by default)
    const handleWheel = (e: WheelEvent) => {
      if ((e.target as HTMLElement).closest('[data-slot-zone="true"]')) {
        e.preventDefault()
      }
    }
    el.addEventListener('wheel', handleWheel, { passive: false })

    return () => {
      ro.disconnect()
      el.removeEventListener('wheel', handleWheel)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Slot photo drag (custom frame) ────────────────────────
  const [draggingSlot, setDraggingSlot] = useState<number | null>(null)
  const [activeSlot, setActiveSlot] = useState<number | null>(null)
  const slotDragStart = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null)
  const getSlotOffset = (i: number) => slotOffsets[i] || { ox: 0, oy: 0, scale: 1 }
  const onSlotDown = (e: React.PointerEvent, slotIdx: number) => {
    e.stopPropagation(); e.preventDefault()
    setDraggingSlot(slotIdx)
    setActiveSlot(slotIdx)
    const off = getSlotOffset(slotIdx)
    slotDragStart.current = { x: e.clientX, y: e.clientY, ox: off.ox, oy: off.oy }
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  }
  const onSlotMove = (e: React.PointerEvent) => {
    if (draggingSlot === null || !slotDragStart.current || !previewRef.current) return
    const idx = draggingSlot
    const startRef = slotDragStart.current
    const r = previewRef.current.getBoundingClientRect()
    const dx = ((e.clientX - startRef.x) / r.width) * 100
    const dy = ((e.clientY - startRef.y) / r.height) * 100
    const startOx = startRef.ox, startOy = startRef.oy
    setSlotOffsets(prev => {
      const cur = prev[idx] || { ox: 0, oy: 0, scale: 1 }
      return { ...prev, [idx]: { ...cur, ox: startOx + dx, oy: startOy + dy } }
    })
  }
  const onSlotUp = () => { setDraggingSlot(null); slotDragStart.current = null }
  
  const adjustZoom = (slotIdx: number, delta: number) => {
    setSlotOffsets(prev => {
      const cur = prev[slotIdx] || { ox: 0, oy: 0, scale: 1 }
      // Snap slightly closer to 100% and limit min/max
      return { ...prev, [slotIdx]: { ...cur, scale: Math.max(0.5, Math.min(3, cur.scale + delta)) } }
    })
  }

  // ─── Export ────────────────────────────────────────────────
  const handleExport = async () => {
    if (capturedPhotos.length === 0) return
    setIsExporting(true)
    try {
      let canvas: HTMLCanvasElement
      let ctx: CanvasRenderingContext2D

      if (activeCustomFrame) {
        // Custom frame export
        const W = activeCustomFrame.width, H = activeCustomFrame.height
        canvas = document.createElement('canvas'); canvas.width = W; canvas.height = H
        ctx = canvas.getContext('2d')!
        // White background
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, W, H)
        // Draw photos into slots WITH user offsets
        for (let i = 0; i < activeCustomFrame.slots.length && i < capturedPhotos.length; i++) {
          const slot = activeCustomFrame.slots[i]
          const photo = capturedPhotos[i]
          const off = getSlotOffset(i)
          ctx.save()
          if (slot.radius > 0) {
            ctx.beginPath()
            ctx.roundRect(slot.x, slot.y, slot.w, slot.h, slot.radius)
            ctx.clip()
          }
          // Cover crop with user offset + scale
          const baseScale = Math.max(slot.w / photo.width, slot.h / photo.height) * off.scale
          const dw = photo.width * baseScale, dh = photo.height * baseScale
          const dx = slot.x + (slot.w - dw) / 2 + (off.ox / 100) * slot.w
          const dy = slot.y + (slot.h - dh) / 2 + (off.oy / 100) * slot.h
          ctx.drawImage(photo, 0, 0, photo.width, photo.height, dx, dy, dw, dh)
          ctx.restore()
        }
        // Overlay frame PNG with slot areas punched out
        if (activeCustomFrame.frameDataUrl) {
          const frameImg = await loadImage(activeCustomFrame.frameDataUrl)
          // Create temp canvas for frame with slot areas removed
          const frameCanvas = document.createElement('canvas')
          frameCanvas.width = W; frameCanvas.height = H
          const fctx = frameCanvas.getContext('2d')!
          fctx.drawImage(frameImg, 0, 0, W, H)
          // Punch out slot areas
          fctx.globalCompositeOperation = 'destination-out'
          for (const slot of activeCustomFrame.slots) {
            fctx.beginPath()
            if (slot.radius > 0) {
              fctx.roundRect(slot.x, slot.y, slot.w, slot.h, slot.radius)
            } else {
              fctx.rect(slot.x, slot.y, slot.w, slot.h)
            }
            fctx.fill()
          }
          ctx.drawImage(frameCanvas, 0, 0)
        }
      } else {
        // Standard strip export
        const W = 600, H = stripTemplate.id === 'polaroid' ? 720 : stripTemplate.id === 'grid2x2' ? 600 : 1600
        canvas = document.createElement('canvas'); canvas.width = W; canvas.height = H
        ctx = canvas.getContext('2d')!
        stripTemplate.render(ctx, capturedPhotos, W, H, stripBg)
      }
      // Composite Konva overlay layer onto export canvas
      if (overlays.length > 0 && overlayRef.current) {
        const overlayDataUrl = await overlayRef.current.exportOverlay(canvas.width, canvas.height)
        if (overlayDataUrl) {
          const overlayImg = await loadImage(overlayDataUrl)
          const W = canvas.width, H = canvas.height
          ctx.drawImage(overlayImg, 0, 0, W, H)
        }
      }
      // Curtain reveal
      setShowCurtain(true)
      await new Promise(r => setTimeout(r, 1800))
      // Sanitize filename to ensure Windows correctly reads the extension
      const safeName = (activeCustomFrame ? activeCustomFrame.name : stripTemplate.id).replace(/[^a-zA-Z0-9_-]/g, '_')
      await exportCanvasAs(canvas, exportFormat, `photobooth_${safeName}`)
      toast(`🎉 Exported as ${exportFormat.toUpperCase()}!`, 'success')
      setTimeout(() => setShowCurtain(false), 500)
    } catch (err) { console.error(err); toast('Export failed', 'error'); setShowCurtain(false) }
    finally { setIsExporting(false) }
  }

  const toggleARFilter = useCallback((filter: ARFilter) => {
    setActiveARFilters(prev => {
      const exists = prev.find(f => f.id === filter.id)
      if (exists) return prev.filter(f => f.id !== filter.id)
      return [...prev, filter]
    })
  }, [])

  const enableAR = useCallback(() => {
    if (cameraActive) {
      const currentPhoto = capturePhoto()
      if (currentPhoto) setSwitchToBg(currentPhoto.toDataURL())
    }
    
    setIsSwitching(true)
    if (cameraActive) stopCamera()
    setArEnabled(true)
    
    setTimeout(() => {
      setIsSwitching(false)
      setTimeout(() => setSwitchToBg(null), 300)
    }, 500)
  }, [cameraActive, stopCamera, capturePhoto])

  const disableAR = useCallback(() => {
    if (arEnabled && arRef.current) {
      const currentPhoto = capturePhoto()
      if (currentPhoto) setSwitchToBg(currentPhoto.toDataURL())
    }

    setIsSwitching(true)
    if (arRef.current) arRef.current.stop()
    setArEnabled(false)
    setActiveARFilters([])
    
    // Resume normal camera smoothly
    setTimeout(async () => {
      await startCamera(facingMode)
      setIsSwitching(false)
      setTimeout(() => setSwitchToBg(null), 300)
    }, 300)
  }, [arEnabled, facingMode, startCamera, capturePhoto])

  // Auto-stop AR when no filters are active
  useEffect(() => {
    if (arEnabled && activeARFilters.length === 0) disableAR()
  }, [arEnabled, activeARFilters.length, disableAR])

  const SIDE = [
    { id: 'capture' as SideTab, label: 'Capture', icon: <Camera className="w-3.5 h-3.5" /> },
    { 
      id: 'frames' as SideTab, 
      label: 'Frames', 
      icon: <Frame className="w-3.5 h-3.5" />,
      badge: <Star className="w-3 h-3 fill-yellow-400 text-yellow-500 drop-shadow-md animate-pulse transform rotate-12" />
    },
    { id: 'filters' as SideTab, label: 'Filters', icon: <Sparkles className="w-3.5 h-3.5" /> },
    { id: 'text' as SideTab, label: 'Text', icon: <Type className="w-3.5 h-3.5" /> },
    { id: 'assets' as SideTab, label: 'Assets', icon: <Layers className="w-3.5 h-3.5" /> },
    { id: 'adjust' as SideTab, label: 'Adjust', icon: <Settings className="w-3.5 h-3.5" /> },
  ]

  // ─── Shared sidebar content ────────────────────────────────
  const sidebarContent = (
    <>
      <div className="p-3 lg:p-5 pb-2 lg:pb-3">
        <div className="hidden lg:flex items-center gap-3 mb-4">
          <SidebarHeader
            gradient="from-[#EC4899] to-[#8B5CF6]"
            icon={<Camera className="w-4.5 h-4.5 text-white" />}
            title="Photobooth"
            subtitle="Premium photo strips"
            onReset={() => { setCapturedPhotos([]); setOverlays([]); stopCamera() }}
            className="w-full"
          />
        </div>
        <SidebarTabStrip
          tabs={SIDE.map(t => ({ id: t.id, label: t.label, icon: t.icon }))}
          active={sideTab}
          onChange={(id) => setSideTab(id as typeof sideTab)}
          accentColor="#FF6B4A"
          className="overflow-x-auto"
        />
      </div>

      <div className="px-4 lg:px-5 pb-5 space-y-4">
        {sideTab === 'capture' && <>
          <Sec title="Camera">
            {!cameraActive && !arEnabled
              ? <Button onClick={() => startCamera()} className="w-full gap-2"><Camera className="w-4 h-4" /> Start Camera</Button>
              : <div className="flex gap-2">
                  <Button onClick={stopCamera} variant="ghost" className="flex-1 gap-1 text-red-400"><X className="w-3.5 h-3.5" /> Stop</Button>
                  <Button onClick={switchCamera} variant="ghost" className="flex-1 gap-1 text-(--text-secondary)"><SwitchCamera className="w-3.5 h-3.5" /> Flip</Button>
                </div>
            }
            {cameraError && <p className="text-xs text-red-400 mt-1">{cameraError}</p>}
          </Sec>
          <Sec title="Timer">
            <div className="flex gap-1.5">
              {[0, 3, 5, 10].map(t => <button key={t} onClick={() => setCountdownDuration(t)} className={`flex-1 py-2 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${countdownDuration === t ? 'bg-[#FF6B4A]/15 text-[#FF6B4A] border border-[#FF6B4A]/20' : 'bg-(--card-bg) text-(--text-tertiary) border border-(--overlay-border) hover:bg-(--card-bg-hover)'}`}>{t === 0 ? 'Off' : `${t}s`}</button>)}
            </div>
          </Sec>
          <Sec title="Mode">
            <div className="flex gap-1.5">
              <button onClick={() => setBurstMode(false)} className={`flex-1 py-2.5 rounded-lg text-[11px] font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${!burstMode ? 'bg-[#FF6B4A]/15 text-[#FF6B4A] border border-[#FF6B4A]/20' : 'bg-(--card-bg) text-(--text-tertiary) border border-(--overlay-border)'}`}><CameraIcon className="w-3.5 h-3.5" /> Single</button>
              <button onClick={() => setBurstMode(true)} className={`flex-1 py-2.5 rounded-lg text-[11px] font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${burstMode ? 'bg-[#FF6B4A]/15 text-[#FF6B4A] border border-[#FF6B4A]/20' : 'bg-(--card-bg) text-(--text-tertiary) border border-(--overlay-border)'}`}><Grid className="w-3.5 h-3.5" /> Burst ({stripTemplate.slots + 2})</button>
            </div>
          </Sec>
          <Sec title="Mirror"><button onClick={() => setMirrored(!mirrored)} className={`w-full py-2 rounded-lg text-[11px] font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${mirrored ? 'bg-[#FF6B4A]/15 text-[#FF6B4A] border border-[#FF6B4A]/20' : 'bg-(--card-bg) text-(--text-tertiary) border border-(--overlay-border)'}`}><FlipHorizontal2 className="w-3.5 h-3.5" /> {mirrored ? 'Mirrored' : 'Normal'}</button></Sec>

          <div className="border-t border-(--overlay-border) my-2" />

          {/* AR Filters integrated into Capture tab */}
          <Sec title="AR Categories">
            <div className="flex gap-1 overflow-x-auto pb-1">
              {AR_CATEGORIES.map(c => (
                <button key={c.id} onClick={() => setArFilterCategory(c.id)}
                  className={`flex-1 min-w-[50px] py-1.5 rounded-lg text-[10px] font-semibold transition-all flex flex-col items-center gap-1 cursor-pointer whitespace-nowrap ${arFilterCategory === c.id ? 'bg-[#FF6B4A]/15 text-[#FF6B4A] border border-[#FF6B4A]/20' : 'bg-(--card-bg) text-(--text-muted) border border-(--overlay-border)'}`}>
                  <span className="text-sm">{c.emoji}</span>
                  <span className="text-[9px]">{c.label}</span>
                </button>
              ))}
            </div>
          </Sec>

          <Sec title="AR Face Filters">
            <div className="grid grid-cols-3 gap-1.5">
              {AR_FILTERS.filter(f => f.category === arFilterCategory).map(f => {
                const isActive = activeARFilters.some(af => af.id === f.id)
                return (
                  <button key={f.id} onClick={() => { toggleARFilter(f); if (!arEnabled) enableAR() }}
                    className={`py-2 px-1 rounded-lg text-center transition-all cursor-pointer ${isActive ? 'bg-[#FF6B4A]/15 text-[#FF6B4A] border border-[#FF6B4A]/20 ring-1 ring-[#FF6B4A]/30' : 'bg-(--card-bg) text-(--text-tertiary) border border-(--overlay-border) hover:bg-(--card-bg-hover)'}`}>
                    {f.thumbnail ? (
                      <div className="w-8 h-8 mx-auto mb-1 rounded-full overflow-hidden bg-black/30">
                        <img src={f.thumbnail} alt={f.label} className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <span className="text-lg block mb-0.5">{f.emoji}</span>
                    )}
                    <span className="text-[9px] block leading-tight">{f.label}</span>
                  </button>
                )
              })}
            </div>
          </Sec>

          {/* Active AR Filters Summary */}
          {activeARFilters.length > 0 && (
            <div className="space-y-1">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-(--text-muted) block">
                Active AR ({activeARFilters.length})
              </label>
              <div className="flex flex-wrap gap-1">
                {activeARFilters.map(f => (
                  <span key={f.id} onClick={() => toggleARFilter(f)}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-[#FF6B4A]/10 text-[#FF6B4A] text-[10px] font-semibold cursor-pointer hover:bg-[#FF6B4A]/20 transition-all">
                    {f.emoji} {f.label} <X className="w-2.5 h-2.5" />
                  </span>
                ))}
              </div>
              <Button variant="ghost" size="sm" className="w-full text-(--text-tertiary) mt-1 h-7 text-[10px]" onClick={() => setActiveARFilters([])}>
                <RotateCcw className="w-3 h-3 mr-1" /> Clear AR Filters
              </Button>
            </div>
          )}
        </>}

        {sideTab === 'frames' && <>
          {/* Built-in Presets */}
          <Sec title="📦 Built-in Presets">
            <div className="grid grid-cols-3 gap-1.5">{STRIP_TEMPLATES.map(t => (
              <button key={t.id} onClick={() => { setActiveCustomFrame(null); setStripTemplate(t) }}
                className={`py-2.5 rounded-lg text-center transition-all cursor-pointer ${!activeCustomFrame && stripTemplate.id === t.id ? 'bg-[#FF6B4A]/15 text-[#FF6B4A] border border-[#FF6B4A]/20' : 'bg-(--card-bg) text-(--text-tertiary) border border-(--overlay-border) hover:bg-(--card-bg-hover)'}`}>
                <span className="text-sm block">{t.emoji}</span>
                <span className="text-[9px]">{t.label}</span>
              </button>
            ))}</div>
          </Sec>

          {/* Background — shown when built-in preset is active */}
          {!activeCustomFrame && (
            <Sec title="Background">
              <div className="grid grid-cols-4 gap-1.5">{STRIP_BACKGROUNDS.map(bg => (
                <button key={bg.id} onClick={() => setStripBg(bg.id)}
                  className={`h-9 rounded-lg border-2 transition-all cursor-pointer ${stripBg === bg.id ? 'border-[#FF6B4A] scale-105' : 'border-(--overlay-border)'}`}
                  style={{ background: bg.css }} title={bg.label} />
              ))}</div>
            </Sec>
          )}

          {/* Divider */}
          <div className="border-t border-(--overlay-border)" />

          {/* My Frames */}
          <Sec title="🖼️ My Frames">
            {customFrames.length > 0 ? (
              <div className="grid grid-cols-2 gap-1.5">{customFrames.map(f => (
                <div key={f.id}
                  className={`relative group py-2.5 px-2 rounded-lg text-left transition-all cursor-pointer ${activeCustomFrame?.id === f.id ? 'bg-[#FF6B4A]/15 border border-[#FF6B4A]/20' : 'bg-(--card-bg) border border-(--overlay-border) hover:bg-(--card-bg-hover)'}`}
                  onClick={() => setActiveCustomFrame(f)}>
                  <div className="flex items-center gap-1.5">
                    {(f as any).isCloud && <span className="text-[10px]">☁️</span>}
                    <Frame className="w-3.5 h-3.5 text-(--text-muted) shrink-0" />
                    <span className="text-[10px] font-semibold text-(--text-secondary) truncate">{f.name}</span>
                  </div>
                  <span className="text-[9px] text-(--text-muted)">{f.slots.length} slots</span>
                  {/* Edit button */}
                  <button
                    onClick={e => { e.stopPropagation(); setEditingFrame(f); setShowFrameEditor(true) }}
                    className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-white/10 cursor-pointer"
                    title="Edit frame"
                  >
                    <Pencil className="w-3 h-3 text-(--text-muted) hover:text-[#FF6B4A]" />
                  </button>
                </div>
              ))}</div>
            ) : (
              <p className="text-xs text-(--text-muted) text-center py-3">No custom frames yet</p>
            )}
            <Button onClick={() => { setEditingFrame(null); setShowFrameEditor(true) }} className="w-full gap-2 mt-2" size="sm">
              <Plus className="w-3.5 h-3.5" /> Create New Frame
            </Button>
          </Sec>

          {activeCustomFrame && <p className="text-[10px] text-[#10B981]">✓ Using custom frame: {activeCustomFrame.name} ({activeCustomFrame.slots.length} slots)</p>}
          {!activeCustomFrame && <p className="text-[10px] text-(--text-muted)">Using built-in: {stripTemplate.emoji} {stripTemplate.label}</p>}
        </>}

        {sideTab === 'filters' && <>
          <Sec title="Category"><div className="flex gap-1">{FILTER_CATEGORIES.map(c => <button key={c.id} onClick={() => setActiveFilterCategory(c.id)} className={`flex-1 py-1.5 rounded-lg text-[10px] font-semibold transition-all cursor-pointer ${activeFilterCategory === c.id ? 'bg-[#FF6B4A]/15 text-[#FF6B4A] border border-[#FF6B4A]/20' : 'bg-(--card-bg) text-(--text-muted) border border-(--overlay-border)'}`}>{c.emoji} {c.label}</button>)}</div></Sec>
          <Sec title="Filters"><div className="grid grid-cols-3 gap-1.5">{IMAGE_FILTERS.filter(f => f.id === 'none' || f.category === activeFilterCategory).map(f => <button key={f.id} onClick={() => setActiveFilter(f.id)} className={`py-3 rounded-lg text-center transition-all cursor-pointer ${activeFilter === f.id ? 'bg-[#FF6B4A]/15 text-[#FF6B4A] border border-[#FF6B4A]/20 ring-1 ring-[#FF6B4A]/30' : 'bg-(--card-bg) text-(--text-tertiary) border border-(--overlay-border) hover:bg-(--card-bg-hover)'}`}><span className="text-lg block mb-0.5">{f.emoji}</span><span className="text-[10px]">{f.label}</span></button>)}</div></Sec>
        </>}

        {/* Removed AR tab content */}

        {sideTab === 'text' && <TextPanel 
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
          />}
        {sideTab === 'assets' && <AssetPanel onAddAsset={addAssetOverlay} />}

        {sideTab === 'adjust' && <>
          <Sec title="Brightness"><Slider value={brightness} onChange={setBrightness} min={50} max={150} label={`${brightness}%`} /></Sec>
          <Sec title="Contrast"><Slider value={contrast} onChange={setContrast} min={50} max={150} label={`${contrast}%`} /></Sec>
          <Sec title="Saturation"><Slider value={saturation} onChange={setSaturation} min={0} max={200} label={`${saturation}%`} /></Sec>
          <Button variant="ghost" size="sm" className="w-full text-(--text-tertiary)" onClick={() => { setBrightness(100); setContrast(100); setSaturation(100) }}><RotateCcw className="w-3.5 h-3.5" /> Reset</Button>
        </>}

        {/* Overlays list */}
        {overlays.length > 0 && <div><label className="text-[11px] font-semibold uppercase tracking-wider text-(--text-muted) mb-2 block">Overlays ({overlays.length})</label><div className="space-y-1.5 max-h-48 overflow-y-auto">{overlays.map(ov => {
          const isSel = selectedOverlay === ov.id
          return <div key={ov.id} className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border transition-all cursor-pointer ${isSel ? 'bg-[#FF6B4A]/8 border-[#FF6B4A]/20' : 'bg-(--card-bg) border-(--overlay-border)'}`} onClick={() => selectOverlayAndSync(ov)}>
            <span className={`text-[11px] flex-1 truncate ${isSel ? 'text-[#FF6B4A] font-semibold' : 'text-(--text-secondary)'}`}>{ov.type === 'text' ? `Aa "${(ov.text || '').slice(0, 12)}"` : '🖼️ Sticker'}</span>
            <button onClick={e => { e.stopPropagation(); removeOverlay(ov.id) }} className="cursor-pointer"><X className="w-3 h-3 text-(--text-tertiary) hover:text-white" /></button>
          </div>
        })}</div></div>}

        {/* Photos */}
        {capturedPhotos.length > 0 && !reviewMode && <div>
          <label className="text-[11px] font-semibold uppercase tracking-wider text-(--text-muted) mb-2 block">Photos ({capturedPhotos.length})</label>
          <div className="grid grid-cols-4 gap-1.5">{capturedPhotos.map((photo, i) => <div key={i} className="relative aspect-square rounded-lg overflow-hidden group">
            <canvas ref={el => { if (el) { const s = 200; el.width = s; el.height = s; const ctx = el.getContext('2d'); if (ctx) { const scale = Math.max(s / photo.width, s / photo.height); const sw = s / scale, sh = s / scale; ctx.drawImage(photo, (photo.width - sw) / 2, (photo.height - sh) / 2, sw, sh, 0, 0, s, s) } } }} className="w-full h-full" />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-1 transition-opacity">
              {cameraActive && <button onClick={() => retakePhoto(i)} className="cursor-pointer" title="Retake"><RefreshCw className="w-3.5 h-3.5 text-white" /></button>}
              <button onClick={() => setCapturedPhotos(prev => prev.filter((_, j) => j !== i))} className="cursor-pointer"><Trash2 className="w-3.5 h-3.5 text-white" /></button>
            </div>
          </div>)}</div>
        </div>}

        {/* Review mode */}
        {reviewMode && <div>
          <label className="text-[11px] font-semibold uppercase tracking-wider text-[#FF6B4A] mb-2 block flex items-center gap-1"><Eye className="w-3.5 h-3.5" /> Review Photos — tap to deselect</label>
          <div className="grid grid-cols-3 gap-1.5">{capturedPhotos.map((photo, i) => <div key={i} onClick={() => setSelectedForReview(prev => prev.map((v, j) => j === i ? !v : v))} className={`relative aspect-square rounded-lg overflow-hidden cursor-pointer transition-all ${selectedForReview[i] ? 'ring-2 ring-[#FF6B4A]' : 'opacity-30'}`}>
            <canvas ref={el => { if (el) { const s = 200; el.width = s; el.height = s; const ctx = el.getContext('2d'); if (ctx) { const scale = Math.max(s / photo.width, s / photo.height); const sw = s / scale, sh = s / scale; ctx.drawImage(photo, (photo.width - sw) / 2, (photo.height - sh) / 2, sw, sh, 0, 0, s, s) } } }} className="w-full h-full" />
            {selectedForReview[i] && <span className="absolute top-1 right-1 text-[10px] bg-[#FF6B4A] text-white px-1 rounded">✓</span>}
          </div>)}</div>
          <Button onClick={confirmReview} className="w-full mt-2 gap-2"><Eye className="w-4 h-4" /> Keep {selectedForReview.filter(Boolean).length} Selected</Button>
        </div>}

        {!reviewMode && <div className="space-y-2 pt-2">
          <Button variant="ghost" size="sm" className="w-full text-(--text-tertiary)" onClick={() => { setCapturedPhotos([]); setOverlays([]) }}><RotateCcw className="w-4 h-4" /> Clear All</Button>
        </div>}
      </div>
    </>
  )

  return (
    <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
      {/* Curtain reveal overlay */}
      {showCurtain && (
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-black">
          <div className="animate-[curtainReveal_1.8s_ease-out_forwards] flex flex-col items-center">
            <div className="text-6xl mb-4">📸</div>
            <p className="text-white text-2xl font-bold animate-pulse">Developing your strip...</p>
            <div className="mt-4 w-48 h-1 bg-(--card-bg)0 rounded-full overflow-hidden">
              <div className="h-full bg-[#FF6B4A] rounded-full animate-[loadBar_1.5s_ease-in-out_forwards]" />
            </div>
          </div>
        </div>
      )}

      {/* ═══ DESKTOP SIDEBAR — hidden on mobile ═══ */}
      <div className="hidden lg:flex lg:w-[340px] shrink-0 bg-(--panel-bg) border-r border-(--overlay-border) overflow-y-auto h-screen flex-col">
        {sidebarContent}
      </div>

      {/* ═══ MAIN AREA — Camera + Strip ═══ */}
      <div className="flex-1 flex flex-col p-0 lg:p-6 bg-(--canvas-bg) relative" onClick={() => { setSelectedOverlay(null); setShowExport(false) }}>
        {/* Export Controls */}
        {!reviewMode && (
          <div className="absolute top-6 right-6 z-50 flex flex-col items-end gap-2" onClick={e => e.stopPropagation()}>
            <button 
              title="Export"
              disabled={capturedPhotos.length === 0}
              onClick={() => capturedPhotos.length > 0 && setShowExport(!showExport)} 
              className={`h-8 px-3 flex items-center justify-center gap-1.5 rounded-xl shadow-xl border transition-all font-semibold text-[11px] ${capturedPhotos.length === 0 ? 'opacity-40 cursor-not-allowed bg-(--panel-bg) border-(--overlay-border) text-(--text-muted)' : showExport ? 'bg-[#FF6B4A] border-[#FF6B4A] text-white cursor-pointer' : 'bg-(--panel-bg) border-(--overlay-border) text-(--text-secondary) hover:bg-(--card-bg-hover) cursor-pointer'}`}
            >
              <Download className="w-4 h-4" /> Export
            </button>
            {showExport && capturedPhotos.length > 0 && (
              <div className="bg-(--panel-bg) p-3 rounded-2xl shadow-xl border border-(--overlay-border) w-48 animate-in fade-in slide-in-from-top-2">
                <ExportFormatPanel
                  format={exportFormat}
                  onFormatChange={setExportFormat}
                  onExport={handleExport}
                  isExporting={isExporting}
                  disabled={capturedPhotos.length === 0}
                  exportLabel={activeCustomFrame ? 'Export Frame' : 'Export Strip'}
                />
              </div>
            )}
          </div>
        )}

        {/* Canvas Controls */}
        <div className="absolute bottom-6 right-6 z-50 flex flex-col gap-3">
          {/* Undo/Redo */}
          <div className="flex flex-col gap-2 bg-(--panel-bg) p-2 rounded-2xl shadow-lg border border-(--overlay-border)">
            <button title="Undo" onClick={() => {}} className="w-8 h-8 flex items-center justify-center rounded-xl bg-(--card-bg) hover:bg-(--card-bg-hover) text-(--text-secondary) transition-all cursor-pointer"><Undo2 className="w-4 h-4" /></button>
            <button title="Redo" onClick={() => {}} className="w-8 h-8 flex items-center justify-center rounded-xl bg-(--card-bg) hover:bg-(--card-bg-hover) text-(--text-secondary) transition-all cursor-pointer"><Redo2 className="w-4 h-4" /></button>
          </div>
          
          {/* Zoom */}
          <div className="flex flex-col gap-2 bg-(--panel-bg) p-2 rounded-2xl shadow-xl border border-(--overlay-border)">
            <button onClick={() => setZoom(Math.min(zoom + 0.1, 3))} className="w-8 h-8 flex items-center justify-center rounded-xl bg-(--card-bg) hover:bg-(--card-bg-hover) text-(--text-secondary) transition-all cursor-pointer"><Plus className="w-4 h-4" /></button>
            <div className="text-[10px] font-bold text-center text-(--text-muted) w-8">{Math.round(zoom * 100)}%</div>
            <button onClick={() => setZoom(Math.max(zoom - 0.1, 0.5))} className="w-8 h-8 flex items-center justify-center rounded-xl bg-(--card-bg) hover:bg-(--card-bg-hover) text-(--text-secondary) transition-all cursor-pointer"><div className="w-3 h-0.5 bg-current rounded-full" /></button>
          </div>
        </div>

        <div className="flex-1 overflow-auto rounded-xl">
          <div 
            style={{ 
              width: `${Math.max(100, zoom * 100)}%`, 
              height: `${Math.max(100, zoom * 100)}%`, 
              display: 'flex', 
              flexDirection: 'column',
              minWidth: '100%',
              minHeight: '100%' 
            }}
          >
          <div 
            className="w-full h-full flex flex-col lg:flex-row items-center justify-center p-4 lg:p-6 gap-6 lg:gap-8 origin-top-left transition-transform duration-200"
            style={{ transform: `scale(${zoom})`, width: `${(1 / zoom) * 100}%`, height: `${(1 / zoom) * 100}%` }}
          >
            {/* Camera — Normal or AR */}
            <div className="relative w-full lg:max-w-[640px]">
              <div className="relative rounded-none lg:rounded-2xl overflow-hidden shadow-2xl">
                {arEnabled ? (
                  /* ──── AR Camera (MindAR + Three.js) ──── */
                  <div 
                    className="relative"
                    style={{ filter: `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%) ${CSS_FILTER_PREVIEW[activeFilter] || ''}`.trim() }}
                  >
                    <ARFaceFilter
                      ref={arRef}
                      mirrored={mirrored}
                      activeFilters={activeARFilters}
                      className="rounded-none lg:rounded-xl"
                      onReady={() => toast('🎭 AR Camera ready!', 'success')}
                      onError={(err) => { toast(`AR Error: ${err}`, 'error'); disableAR() }}
                      onLoading={setArLoading}
                    />
                    {/* AR LIVE badge */}
                    <div className="absolute top-3 left-3 bg-linear-to-r from-[#FF6B4A] to-[#EC4899] px-2.5 py-1 rounded-full z-10 flex items-center gap-1.5">
                      <ScanFace className="w-3 h-3 text-white" />
                      <span className="text-[10px] text-white font-bold">AR LIVE</span>
                    </div>
                    {/* Active filters */}
                    <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5">
                      {activeARFilters.length > 0 && (
                        <div className="bg-black/50 backdrop-blur px-2 py-1 rounded-full">
                          <span className="text-[10px] text-white font-medium">
                            {activeARFilters.map(f => f.emoji).join(' ')}
                          </span>
                        </div>
                      )}
                    </div>
                    {showFlash && <div className="absolute inset-0 bg-white z-30 animate-[flashFade_0.3s_ease-out_forwards]" />}
                    {countdown > 0 && <div className="absolute inset-0 flex items-center justify-center bg-black/40 z-20"><span className="text-[80px] lg:text-[120px] font-black text-white animate-pulse drop-shadow-2xl">{countdown}</span></div>}
                  </div>
                ) : (
                  /* ──── Normal Camera ──── */
                  <div className="relative rounded-none lg:rounded-xl overflow-hidden bg-black" style={{ aspectRatio: '4/3' }}>
                    <video ref={videoRef} className="w-full h-full object-cover" style={{ transform: mirrored ? 'scaleX(-1)' : 'none', filter: `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%) ${CSS_FILTER_PREVIEW[activeFilter] || ''}`.trim() }} playsInline muted autoPlay />
                    {!cameraActive && !arEnabled && !isSwitching && <div className="absolute inset-0 flex flex-col items-center justify-center text-(--text-muted)"><Camera className="w-16 h-16 mb-4 opacity-20" /><p className="text-sm font-medium">Click &ldquo;Start Camera&rdquo;</p></div>}
                    {activeFilter !== 'none' && cameraActive && <div className="absolute top-4 right-4 bg-black/50 backdrop-blur px-2.5 py-1 rounded-full z-10"><span className="text-[10px] text-white font-medium">{IMAGE_FILTERS.find(f => f.id === activeFilter)?.emoji} {IMAGE_FILTERS.find(f => f.id === activeFilter)?.label}</span></div>}
                    {showFlash && <div className="absolute inset-0 bg-white z-30 animate-[flashFade_0.3s_ease-out_forwards]" />}
                    {countdown > 0 && <div className="absolute inset-0 flex items-center justify-center bg-black/40 z-20"><span className="text-[80px] lg:text-[120px] font-black text-white animate-pulse drop-shadow-2xl">{countdown}</span></div>}
                    {isBursting && <div className="absolute top-4 left-4 flex items-center gap-2 bg-red-500/80 px-3 py-1.5 rounded-full z-20"><span className="w-2 h-2 rounded-full bg-white animate-pulse" /><span className="text-xs font-bold text-white">RECORDING</span></div>}
                  </div>
                )}
                
                {/* Smooth Transition Ghost Frame */}
                {switchToBg && (
                  <div className={`absolute inset-0 z-40 bg-black transition-opacity duration-300 pointer-events-none ${isSwitching ? 'opacity-100' : 'opacity-0'}`}>
                     <img src={switchToBg} alt="" className="w-full h-full object-cover" />
                     {isSwitching && (
                       <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 backdrop-blur-sm">
                         <Loader2 className="w-8 h-8 text-[#FF6B4A] animate-spin mb-3 drop-shadow-xl" />
                         <span className="text-white text-xs font-semibold tracking-wide drop-shadow-md">Switching lenses...</span>
                       </div>
                     )}
                  </div>
                )}
              </div>
              {/* Desktop capture button — works for both AR and normal camera */}
              {(cameraActive || arEnabled) && <div className="hidden lg:flex justify-center mt-4"><button onClick={handleCapture} disabled={countdown > 0 || isBursting} className="w-16 h-16 rounded-full border-4 border-(--overlay-border-hover) bg-white hover:bg-stone-100 active:scale-90 transition-all cursor-pointer flex items-center justify-center shadow-xl disabled:opacity-50 touch-manipulation">{burstMode ? <Grid className="w-6 h-6 text-[#FF6B4A]" /> : <div className="w-10 h-10 rounded-full bg-[#FF6B4A]" />}</button></div>}
            </div>

            {/* Strip / Frame preview — always show when not in review mode */}
            {!reviewMode && (
              <div ref={previewRef}
                className="relative rounded-2xl shadow-2xl w-full"
                style={{
                  maxWidth: activeCustomFrame ? '360px' : stripTemplate.id === 'grid2x2' || stripTemplate.id === 'polaroid' ? '300px' : '240px',
                  ...(activeCustomFrame ? {} : { aspectRatio: stripTemplate.id === 'polaroid' ? '5/6' : stripTemplate.id === 'grid2x2' ? '1/1' : '3/8' })
                }}
                onPointerDown={() => setActiveSlot(null)}
                onPointerMove={e => { onSlotMove(e) }}
                onPointerUp={() => { onSlotUp() }}
              >
                {activeCustomFrame ? (
                  <FramePreviewCanvas frame={activeCustomFrame} photos={capturedPhotos} slotOffsets={slotOffsets} />
                ) : (
                  <StripCanvas template={stripTemplate} photos={capturedPhotos} bg={stripBg} />
                )}
                {/* Konva overlay layer for text/assets — only block parent deselect via onClick */}
                {previewDims.w > 0 && previewDims.h > 0 && (
                  <div onClick={e => e.stopPropagation()}>
                    <OverlayCanvas
                      ref={overlayRef}
                      elements={overlays}
                      setElements={setOverlays}
                      selectedId={selectedOverlay}
                      setSelectedId={setSelectedOverlay}
                      width={previewDims.w}
                      height={previewDims.h}
                    />
                  </div>
                )}
                {/* Slot drag zones — rendered above the Konva overlay so frame photos can be repositioned */}
                {activeCustomFrame && activeCustomFrame.slots.map((slot, i) => (
                  i < capturedPhotos.length && (
                    <div key={`slot-drag-${i}`}
                      data-slot-zone="true"
                      className={`absolute cursor-grab active:cursor-grabbing group ${activeSlot === i ? 'ring-2 ring-[#FF6B4A]/50 ring-offset-2 ring-offset-black/20' : ''}`}
                      style={{
                        left: `${(slot.x / activeCustomFrame.width) * 100}%`,
                        top: `${(slot.y / activeCustomFrame.height) * 100}%`,
                        width: `${(slot.w / activeCustomFrame.width) * 100}%`,
                        height: `${(slot.h / activeCustomFrame.height) * 100}%`,
                        borderRadius: slot.radius > 0 ? `${(slot.radius / Math.min(slot.w, slot.h)) * 50}%` : undefined,
                        zIndex: activeSlot === i ? 30 : 20,
                      }}
                      title={`Drag to reposition photo ${i + 1}`}
                      onPointerDown={e => onSlotDown(e, i)}
                    >
                      {/* Floating Zoom Controls for Selected Photo */}
                      {activeSlot === i && (
                        <div 
                          className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/80 backdrop-blur-md rounded-full px-2 py-1.5 flex items-center justify-center gap-1.5 shadow-xl min-w-[80px]"
                          onPointerDown={e => e.stopPropagation()} // Prevent drag start when clicking zoom buttons
                          style={{ cursor: 'default' }}
                        >
                          <button 
                            className="p-1 text-white hover:text-[#FF6B4A] active:scale-90 transition-transform bg-white/10 rounded-full"
                            onClick={() => adjustZoom(i, -0.05)}
                          ><Minus className="w-3.5 h-3.5" /></button>
                          
                          <span className="text-[10px] sm:text-[11px] font-bold text-white w-8 text-center tabular-nums pointer-events-none">
                            {Math.round(getSlotOffset(i).scale * 100)}%
                          </span>
                          
                          <button 
                            className="p-1 text-white hover:text-[#FF6B4A] active:scale-90 transition-transform bg-white/10 rounded-full"
                            onClick={() => adjustZoom(i, 0.05)}
                          ><Plus className="w-3.5 h-3.5" /></button>
                        </div>
                      )}
                    </div>
                  )
                ))}
              </div>
            )}
            
            <div className="pb-32 lg:pb-8" />
          </div>
        </div>
      </div>
    </div>

      {/* ═══ MOBILE: Floating capture button ═══ */}
      {cameraActive && (
        <div className="lg:hidden fixed bottom-[180px] md:bottom-[140px] left-1/2 -translate-x-1/2 z-52">
          <button onClick={handleCapture} disabled={countdown > 0 || isBursting}
            className="w-[68px] h-[68px] rounded-full border-4 border-white/30 bg-white active:scale-90 transition-all cursor-pointer flex items-center justify-center shadow-[0_4px_24px_rgba(0,0,0,0.4)] disabled:opacity-50 touch-manipulation">
            {burstMode ? <Grid className="w-7 h-7 text-[#FF6B4A]" /> : <div className="w-11 h-11 rounded-full bg-[#FF6B4A]" />}
          </button>
        </div>
      )}

      {/* ═══ MOBILE BOTTOM SHEET ═══ */}
      <MobileBottomSheet>
        {sidebarContent}
      </MobileBottomSheet>

      {/* CSS animations */}
      <style jsx global>{`
        @keyframes flashFade { from { opacity: 1 } to { opacity: 0 } }
        @keyframes curtainReveal { 0% { opacity: 0; transform: scale(0.8) } 30% { opacity: 1; transform: scale(1.05) } 100% { opacity: 1; transform: scale(1) } }
        @keyframes loadBar { from { width: 0 } to { width: 100% } }
      `}</style>

      {/* ═══ FRAME EDITOR MODAL ═══ */}
      {showFrameEditor && (
        <div className="fixed inset-0 z-200 bg-black/80 backdrop-blur-sm flex items-stretch">
          <div className="w-full h-full">
            <FrameEditorClient
              embedded
              initialTemplate={editingFrame ?? undefined}
              onSave={(frame) => {
                // Reload frames from localStorage + cloud
                let localFrames: FrameTemplate[] = []
                try { localFrames = JSON.parse(localStorage.getItem('sticker-studio-frame-templates') || '[]') } catch {}
                setCustomFrames(localFrames)
                setActiveCustomFrame(frame)
                setEditingFrame(null)
                setShowFrameEditor(false)
                setSideTab('frames')
                // Also reload cloud frames
                fetch('/api/frames').then(r => r.json()).then(data => {
                  if (data.frames?.length) {
                    const cloudFrames = data.frames.map((f: any) => ({ id: f.id, name: f.name, width: f.width, height: f.height, slots: f.slots, frameDataUrl: f.frameUrl || '', createdAt: f.createdAt, isCloud: true }))
                    const localNames = new Set(localFrames.map((f: FrameTemplate) => f.name))
                    setCustomFrames([...localFrames, ...cloudFrames.filter((f: FrameTemplate) => !localNames.has(f.name))])
                  }
                }).catch(() => {})
              }}
              onClose={() => { setEditingFrame(null); setShowFrameEditor(false) }}
            />
          </div>
        </div>
      )}
    </div>
  )
}

function Sec({ title, children }: { title: string; children: React.ReactNode }) {
  return <div><label className="text-[11px] font-semibold uppercase tracking-wider text-(--text-muted) mb-2 block">{title}</label>{children}</div>
}

function Slider({ value, onChange, min, max, label }: { value: number; onChange: (v: number) => void; min: number; max: number; label: string }) {
  const pct = ((value - min) / (max - min)) * 100
  return <div className="flex items-center gap-2"><input type="range" min={min} max={max} value={value} onChange={e => onChange(Number(e.target.value))} className="flex-1" style={{ background: `linear-gradient(to right, #FF6B4A ${pct}%, rgba(255,255,255,0.06) ${pct}%)` }} /><span className="text-[10px] text-(--text-muted) font-mono w-10 text-right">{label}</span></div>
}

function StripCanvas({ template, photos, bg }: { template: StripTemplate; photos: HTMLCanvasElement[]; bg: string }) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    if (!ref.current) return
    const W = template.id === 'grid2x2' || template.id === 'polaroid' ? 600 : 480
    const H = template.id === 'polaroid' ? 720 : template.id === 'grid2x2' ? 600 : 1280
    ref.current.width = W; ref.current.height = H
    // Render with actual photos or generate placeholder canvases
    if (photos.length > 0) {
      template.render(ref.current.getContext('2d')!, photos, W, H, bg)
    } else {
      // Draw background + empty placeholder slots
      const ctx = ref.current.getContext('2d')!
      const bgDef = STRIP_BACKGROUNDS.find((b) => b.id === bg) || STRIP_BACKGROUNDS[0]
      // Fill background
      if (bgDef.css.startsWith('linear-gradient')) {
        const colors = bgDef.css.match(/#[a-fA-F0-9]{6}/g) || ['#fff', '#fff']
        const grad = ctx.createLinearGradient(0, 0, 0, H)
        grad.addColorStop(0, colors[0]); grad.addColorStop(1, colors[1] || colors[0])
        ctx.fillStyle = grad
      } else {
        ctx.fillStyle = bgDef.css
      }
      ctx.fillRect(0, 0, W, H)
      // Draw placeholder slots
      const pad = template.id === 'filmstrip' ? 44 : template.id === 'polaroid' ? 40 : template.id === 'grid2x2' ? 20 : 24
      const slotCount = template.slots
      if (template.id === 'grid2x2') {
        const cw = (W - pad * 3) / 2, ch = (H - pad * 3) / 2
        const pos = [[pad, pad], [pad * 2 + cw, pad], [pad, pad * 2 + ch], [pad * 2 + cw, pad * 2 + ch]]
        pos.forEach(([x, y], i) => {
          ctx.fillStyle = '#f0f0f0'; ctx.beginPath(); ctx.roundRect(x, y, cw, ch, 8); ctx.fill()
          ctx.fillStyle = '#bbb'; ctx.font = 'bold 18px system-ui'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
          ctx.fillText(`Photo ${i + 1}`, x + cw / 2, y + ch / 2)
        })
      } else if (template.id === 'polaroid') {
        const bPad = 100
        ctx.fillStyle = '#f0f0f0'; ctx.beginPath(); ctx.roundRect(pad, pad, W - pad * 2, H - pad - bPad, 4); ctx.fill()
        ctx.fillStyle = '#bbb'; ctx.font = 'bold 24px system-ui'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
        ctx.fillText('Photo 1', W / 2, (H - bPad) / 2)
        ctx.fillStyle = '#999'; ctx.font = '20px Lora'; ctx.textAlign = 'center'
        ctx.fillText(new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }), W / 2, H - bPad / 2 + 10)
      } else {
        const slotH = (H - pad * (slotCount + 1)) / slotCount
        for (let i = 0; i < slotCount; i++) {
          const y = pad + i * (slotH + pad)
          ctx.fillStyle = '#f0f0f0'; ctx.beginPath(); ctx.roundRect(pad, y, W - pad * 2, slotH, 8); ctx.fill()
          ctx.fillStyle = '#bbb'; ctx.font = 'bold 16px system-ui'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
          ctx.fillText(`Photo ${i + 1}`, W / 2, y + slotH / 2)
        }
      }
    }
  }, [template, photos, bg])
  return <canvas ref={ref} className="w-full h-full" />
}

function FramePreviewCanvas({ frame, photos, slotOffsets }: {
  frame: FrameTemplate; photos: HTMLCanvasElement[]
  slotOffsets: Record<number, { ox: number; oy: number; scale: number }>
}) {
  const photosCanvasRef = useRef<HTMLCanvasElement>(null)
  const frameCanvasRef = useRef<HTMLCanvasElement>(null)
  const [frameImg, setFrameImg] = useState<HTMLImageElement | null>(null)

  // Load frame image
  useEffect(() => {
    if (!frame.frameDataUrl) { setFrameImg(null); return }
    const img = new Image()
    img.onload = () => setFrameImg(img)
    img.src = frame.frameDataUrl
  }, [frame.frameDataUrl])

  // Render photos canvas (bottom layer)
  useEffect(() => {
    const canvas = photosCanvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    const W = frame.width, H = frame.height
    canvas.width = W; canvas.height = H

    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, W, H)

    frame.slots.forEach((slot, i) => {
      ctx.save()
      if (slot.radius > 0) {
        ctx.beginPath()
        ctx.roundRect(slot.x, slot.y, slot.w, slot.h, slot.radius)
        ctx.clip()
      }
      if (i < photos.length) {
        const photo = photos[i]
        const off = slotOffsets[i] || { ox: 0, oy: 0, scale: 1 }
        const baseScale = Math.max(slot.w / photo.width, slot.h / photo.height) * off.scale
        const dw = photo.width * baseScale, dh = photo.height * baseScale
        const dx = slot.x + (slot.w - dw) / 2 + (off.ox / 100) * slot.w
        const dy = slot.y + (slot.h - dh) / 2 + (off.oy / 100) * slot.h
        ctx.drawImage(photo, 0, 0, photo.width, photo.height, dx, dy, dw, dh)
      } else {
        ctx.fillStyle = '#f0f0f0'
        ctx.fillRect(slot.x, slot.y, slot.w, slot.h)
        ctx.fillStyle = '#ccc'
        ctx.font = 'bold 14px Inter, system-ui, sans-serif'
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
        ctx.fillText(`Photo ${i + 1}`, slot.x + slot.w / 2, slot.y + slot.h / 2)
      }
      ctx.restore()
    })
  }, [frame, photos, slotOffsets])

  // Render frame canvas (top layer — frame PNG with slot areas punched out)
  useEffect(() => {
    const canvas = frameCanvasRef.current
    if (!canvas || !frameImg) return
    const ctx = canvas.getContext('2d')!
    const W = frame.width, H = frame.height
    canvas.width = W; canvas.height = H

    // Draw the full frame image
    ctx.drawImage(frameImg, 0, 0, W, H)

    // Punch out slot areas so photos show through
    ctx.globalCompositeOperation = 'destination-out'
    frame.slots.forEach(slot => {
      ctx.beginPath()
      if (slot.radius > 0) {
        ctx.roundRect(slot.x, slot.y, slot.w, slot.h, slot.radius)
      } else {
        ctx.rect(slot.x, slot.y, slot.w, slot.h)
      }
      ctx.fill()
    })
    ctx.globalCompositeOperation = 'source-over'
  }, [frame, frameImg])

  return (
    <div style={{ position: 'relative', width: '100%', aspectRatio: `${frame.width}/${frame.height}` }}>
      {/* Photos canvas (bottom layer) */}
      <canvas ref={photosCanvasRef} style={{ display: 'block', width: '100%', height: '100%' }} />
      {/* Frame canvas (top layer — frame PNG with slot areas punched out) */}
      {frame.frameDataUrl && (
        <canvas ref={frameCanvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }} />
      )}
    </div>
  )
}

function MobileBottomSheet({ children }: { children: React.ReactNode }) {
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
      {/* Drag handle */}
      <div className="shrink-0 flex items-center justify-center py-2.5 cursor-grab active:cursor-grabbing touch-manipulation" onPointerDown={onDragStart} onClick={() => setExpanded(v => !v)}>
        <div className="w-10 h-1 rounded-full bg-[var(--text-muted)]/30" />
      </div>
      {/* Content */}
      <div className={`flex-1 overflow-y-auto overscroll-contain ${expanded ? '' : 'overflow-hidden'}`}>
        {children}
      </div>
    </div>
  )
}
