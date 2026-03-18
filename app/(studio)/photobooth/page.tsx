'use client'

import { AssetPanel } from '@/components/shared/AssetPanel'
import { TextPanel } from '@/components/shared/TextPanel'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/toast'
import { downloadUrl } from '@/lib/download'
import { FILTER_CATEGORIES, IMAGE_FILTERS } from '@/lib/image-filters'
import { TEXT_PRESETS } from '@/lib/shared-assets'
import {
  Camera, CameraIcon, Download,
  Eye,
  Film,
  FlipHorizontal2, Grid, Layers,
  Loader2,
  RefreshCw, RotateCcw, Settings, Sparkles,
  SwitchCamera,
  Trash2, Type,
  Wand2,
  X
} from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import {
  FACE_PROPS, PHOTO_FRAMES,
  SCENE_PRESETS,
  STRIP_BACKGROUNDS,
  STRIP_TEMPLATES,
  loadImage,
  playBeep,
  playShutterSound,
  type StripTemplate,
} from './booth-utils'

// ─── Overlay type ────────────────────────────────────────────
interface BoothOverlay {
  id: string; type: 'asset' | 'text'
  src?: string; text?: string; fontFamily?: string; fontSize?: number
  fill?: string; stroke?: string; strokeWidth?: number
  x: number; y: number; size: number
}

type SideTab = 'capture' | 'filters' | 'frames' | 'text' | 'assets' | 'adjust' | 'props'

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
  const [photoFrame, setPhotoFrame] = useState(PHOTO_FRAMES[0])
  const [stripBg, setStripBg] = useState('white')
  const [reviewMode, setReviewMode] = useState(false)
  const [selectedForReview, setSelectedForReview] = useState<boolean[]>([])

  // Filters & props
  const [activeFilter, setActiveFilter] = useState('none')
  const [activeFilterCategory, setActiveFilterCategory] = useState('color')
  const [activeProp, setActiveProp] = useState<string | null>(null)
  const [propPosition, setPropPosition] = useState({ x: 50, y: 25 })
  const [propSize, setPropSize] = useState(25)

  // Overlays
  const [overlays, setOverlays] = useState<BoothOverlay[]>([])
  const [selectedOverlay, setSelectedOverlay] = useState<string | null>(null)

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

  // ─── Capture ───────────────────────────────────────────────
  const capturePhoto = useCallback(() => {
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
    // Draw face prop onto photo
    if (activeProp) {
      const prop = FACE_PROPS.find(p => p.id === activeProp)
      if (prop) {
        const img = new Image(); img.crossOrigin = 'anonymous'; img.src = prop.src
        if (img.complete) {
          const s = (propSize / 100) * canvas.width
          ctx.drawImage(img, (propPosition.x / 100) * canvas.width - s / 2, (propPosition.y / 100) * canvas.height - s / 2, s, s)
        }
      }
    }
    return canvas
  }, [cameraActive, mirrored, brightness, contrast, saturation, activeFilter, activeProp, propPosition, propSize])

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

  // ─── Scene presets ─────────────────────────────────────────
  const applyScene = (scene: typeof SCENE_PRESETS[0]) => {
    setActiveFilter(scene.filter); setPhotoFrame(PHOTO_FRAMES.find(f => f.id === scene.frame) || PHOTO_FRAMES[0])
    setStripBg(scene.bg); setFontFamily(scene.font); setTextColor(scene.fill)
    toast(`🎬 Scene: ${scene.label}`, 'success')
  }

  // ─── Overlays ──────────────────────────────────────────────
  const addAssetOverlay = (src: string) => setOverlays(prev => [...prev, { id: `ov-${Date.now()}`, type: 'asset', src, x: 50 + Math.random() * 20 - 10, y: 50 + Math.random() * 20 - 10, size: 15 }])
  const addTextOverlay = (config: { text: string; fontFamily: string; fontSize: number; fill: string; stroke: string; strokeWidth: number }) => {
    setOverlays(prev => [...prev, { id: `txt-${Date.now()}`, type: 'text', ...config, x: 50, y: 50, size: 20 }]); setStickerText('')
  }
  const addTextPreset = (preset: typeof TEXT_PRESETS[0]) => setOverlays(prev => [...prev, { id: `txt-${Date.now()}`, type: 'text', text: preset.label.split(' ').slice(1).join(' ') || preset.label, fontFamily: preset.font, fontSize: preset.size, fill: preset.fill, stroke: preset.stroke, strokeWidth: preset.strokeWidth, x: 50, y: 50, size: 20 }])
  const removeOverlay = (id: string) => { setOverlays(prev => prev.filter(o => o.id !== id)); if (selectedOverlay === id) setSelectedOverlay(null) }

  // ─── Draggable overlays ────────────────────────────────────
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const dragStart = useRef<{ x: number; y: number; ovX: number; ovY: number } | null>(null)
  const onOvDown = (e: React.PointerEvent, ov: BoothOverlay) => {
    e.stopPropagation(); e.preventDefault(); setDraggingId(ov.id); setSelectedOverlay(ov.id)
    dragStart.current = { x: e.clientX, y: e.clientY, ovX: ov.x, ovY: ov.y }
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  }
  const onOvMove = (e: React.PointerEvent) => {
    if (!draggingId || !dragStart.current || !previewRef.current) return
    const r = previewRef.current.getBoundingClientRect()
    setOverlays(prev => prev.map(o => o.id === draggingId ? { ...o, x: Math.max(0, Math.min(100, dragStart.current!.ovX + ((e.clientX - dragStart.current!.x) / r.width) * 100)), y: Math.max(0, Math.min(100, dragStart.current!.ovY + ((e.clientY - dragStart.current!.y) / r.height) * 100)) } : o))
  }
  const onOvUp = () => { setDraggingId(null); dragStart.current = null }

  // ─── Export ────────────────────────────────────────────────
  const handleExport = async () => {
    if (capturedPhotos.length === 0) return
    setIsExporting(true)
    try {
      const W = 600, H = stripTemplate.id === 'polaroid' ? 720 : stripTemplate.id === 'grid2x2' ? 600 : 1600
      const canvas = document.createElement('canvas'); canvas.width = W; canvas.height = H
      const ctx = canvas.getContext('2d')!
      stripTemplate.render(ctx, capturedPhotos, W, H, stripBg)
      for (const ov of overlays) {
        if (ov.type === 'asset' && ov.src) {
          const img = await loadImage(ov.src)
          const s = (ov.size / 100) * W
          ctx.drawImage(img, (ov.x / 100) * W - s / 2, (ov.y / 100) * H - s / 2, s, s)
        } else if (ov.type === 'text' && ov.text) {
          ctx.save(); ctx.font = `bold ${ov.fontSize || 48}px ${ov.fontFamily || 'Impact'}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
          if (ov.strokeWidth) { ctx.strokeStyle = ov.stroke || '#000'; ctx.lineWidth = ov.strokeWidth; ctx.strokeText(ov.text, (ov.x / 100) * W, (ov.y / 100) * H) }
          ctx.fillStyle = ov.fill || '#fff'; ctx.fillText(ov.text, (ov.x / 100) * W, (ov.y / 100) * H); ctx.restore()
        }
      }
      // Curtain reveal
      setShowCurtain(true)
      await new Promise(r => setTimeout(r, 1800))
      downloadUrl(canvas.toDataURL('image/png'), `photobooth_${stripTemplate.id}.png`)
      toast('🎉 Strip exported!', 'success')
      setTimeout(() => setShowCurtain(false), 500)
    } catch (err) { console.error(err); toast('Export failed', 'error'); setShowCurtain(false) }
    finally { setIsExporting(false) }
  }

  const SIDE = [
    { id: 'capture' as SideTab, label: 'Capture', icon: <Camera className="w-3.5 h-3.5" /> },
    { id: 'filters' as SideTab, label: 'Filters', icon: <Sparkles className="w-3.5 h-3.5" /> },
    { id: 'props' as SideTab, label: 'Props', icon: <Wand2 className="w-3.5 h-3.5" /> },
    { id: 'frames' as SideTab, label: 'Frames', icon: <Film className="w-3.5 h-3.5" /> },
    { id: 'text' as SideTab, label: 'Text', icon: <Type className="w-3.5 h-3.5" /> },
    { id: 'assets' as SideTab, label: 'Assets', icon: <Layers className="w-3.5 h-3.5" /> },
    { id: 'adjust' as SideTab, label: 'Adjust', icon: <Settings className="w-3.5 h-3.5" /> },
  ]

  return (
    <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
      {/* Curtain reveal overlay */}
      {showCurtain && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black">
          <div className="animate-[curtainReveal_1.8s_ease-out_forwards] flex flex-col items-center">
            <div className="text-6xl mb-4">📸</div>
            <p className="text-white text-2xl font-bold animate-pulse">Developing your strip...</p>
            <div className="mt-4 w-48 h-1 bg-[var(--card-bg)]0 rounded-full overflow-hidden">
              <div className="h-full bg-[#FF6B4A] rounded-full animate-[loadBar_1.5s_ease-in-out_forwards]" />
            </div>
          </div>
        </div>
      )}

      {/* Left sidebar — mobile: fixed 40vh with scroll, desktop: full height */}
      <div className="w-full lg:w-[340px] shrink-0 bg-[var(--panel-bg)] border-b lg:border-b-0 lg:border-r border-[var(--overlay-border)] overflow-y-auto h-[40vh] lg:h-screen">
        <div className="p-5 pb-3">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#EC4899] to-[#8B5CF6] flex items-center justify-center">
              <Camera className="w-4.5 h-4.5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[var(--text-primary)]">Photobooth</h2>
              <p className="text-xs text-[var(--text-muted)]">Premium photo strips</p>
            </div>
          </div>
          <div className="flex gap-0.5 bg-[var(--card-bg)] rounded-xl p-1 overflow-x-auto">
            {SIDE.map(t => (
              <button key={t.id} onClick={() => setSideTab(t.id)}
                className={`flex-1 flex items-center justify-center gap-0.5 py-2 rounded-lg text-[10px] font-semibold transition-all cursor-pointer px-1 ${sideTab === t.id ? 'bg-[#FF6B4A]/15 text-[#FF6B4A]' : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'}`}>
                {t.icon}<span className="hidden sm:inline">{t.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="px-5 pb-5 space-y-4">
          {sideTab === 'capture' && <>
            <Sec title="Camera">
              {!cameraActive ? <Button onClick={() => startCamera()} className="w-full gap-2"><Camera className="w-4 h-4" /> Start Camera</Button>
                : <div className="flex gap-2">
                    <Button onClick={stopCamera} variant="ghost" className="flex-1 gap-1 text-red-400"><X className="w-3.5 h-3.5" /> Stop</Button>
                    <Button onClick={switchCamera} variant="ghost" className="flex-1 gap-1 text-[var(--text-secondary)]"><SwitchCamera className="w-3.5 h-3.5" /> Flip</Button>
                  </div>}
              {cameraError && <p className="text-xs text-red-400 mt-1">{cameraError}</p>}
            </Sec>
            <Sec title="Timer">
              <div className="flex gap-1.5">
                {[0, 3, 5, 10].map(t => <button key={t} onClick={() => setCountdownDuration(t)} className={`flex-1 py-2 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${countdownDuration === t ? 'bg-[#FF6B4A]/15 text-[#FF6B4A] border border-[#FF6B4A]/20' : 'bg-[var(--card-bg)] text-[var(--text-tertiary)] border border-[var(--overlay-border)] hover:bg-[var(--card-bg-hover)]'}`}>{t === 0 ? 'Off' : `${t}s`}</button>)}
              </div>
            </Sec>
            <Sec title="Mode">
              <div className="flex gap-1.5">
                <button onClick={() => setBurstMode(false)} className={`flex-1 py-2.5 rounded-lg text-[11px] font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${!burstMode ? 'bg-[#FF6B4A]/15 text-[#FF6B4A] border border-[#FF6B4A]/20' : 'bg-[var(--card-bg)] text-[var(--text-tertiary)] border border-[var(--overlay-border)]'}`}><CameraIcon className="w-3.5 h-3.5" /> Single</button>
                <button onClick={() => setBurstMode(true)} className={`flex-1 py-2.5 rounded-lg text-[11px] font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${burstMode ? 'bg-[#FF6B4A]/15 text-[#FF6B4A] border border-[#FF6B4A]/20' : 'bg-[var(--card-bg)] text-[var(--text-tertiary)] border border-[var(--overlay-border)]'}`}><Grid className="w-3.5 h-3.5" /> Burst ({stripTemplate.slots + 2})</button>
              </div>
            </Sec>
            <Sec title="Mirror"><button onClick={() => setMirrored(!mirrored)} className={`w-full py-2 rounded-lg text-[11px] font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${mirrored ? 'bg-[#FF6B4A]/15 text-[#FF6B4A] border border-[#FF6B4A]/20' : 'bg-[var(--card-bg)] text-[var(--text-tertiary)] border border-[var(--overlay-border)]'}`}><FlipHorizontal2 className="w-3.5 h-3.5" /> {mirrored ? 'Mirrored' : 'Normal'}</button></Sec>
            <Sec title={`Strip Template (${stripTemplate.slots} slots)`}>
              <div className="grid grid-cols-3 gap-1.5">{STRIP_TEMPLATES.map(t => <button key={t.id} onClick={() => setStripTemplate(t)} className={`py-2.5 rounded-lg text-center transition-all cursor-pointer ${stripTemplate.id === t.id ? 'bg-[#FF6B4A]/15 text-[#FF6B4A] border border-[#FF6B4A]/20' : 'bg-[var(--card-bg)] text-[var(--text-tertiary)] border border-[var(--overlay-border)] hover:bg-[var(--card-bg-hover)]'}`}><span className="text-sm block">{t.emoji}</span><span className="text-[9px]">{t.label}</span></button>)}</div>
            </Sec>
            <Sec title="🎬 Scene Presets">
              <div className="grid grid-cols-2 gap-1.5">{SCENE_PRESETS.map(s => <button key={s.id} onClick={() => applyScene(s)} className="py-2 px-2 rounded-lg bg-[var(--card-bg)] border border-[var(--overlay-border)] text-left hover:bg-[var(--card-bg-hover)] hover:border-[var(--overlay-border-hover)] transition-all cursor-pointer"><span className="text-[11px] font-semibold block text-[var(--text-secondary)]">{s.label}</span><span className="text-[9px] text-[var(--text-muted)]">{s.desc}</span></button>)}</div>
            </Sec>
          </>}

          {sideTab === 'filters' && <>
            <Sec title="Category"><div className="flex gap-1">{FILTER_CATEGORIES.map(c => <button key={c.id} onClick={() => setActiveFilterCategory(c.id)} className={`flex-1 py-1.5 rounded-lg text-[10px] font-semibold transition-all cursor-pointer ${activeFilterCategory === c.id ? 'bg-[#FF6B4A]/15 text-[#FF6B4A] border border-[#FF6B4A]/20' : 'bg-[var(--card-bg)] text-[var(--text-muted)] border border-[var(--overlay-border)]'}`}>{c.emoji} {c.label}</button>)}</div></Sec>
            <Sec title="Filters"><div className="grid grid-cols-3 gap-1.5">{IMAGE_FILTERS.filter(f => f.id === 'none' || f.category === activeFilterCategory).map(f => <button key={f.id} onClick={() => setActiveFilter(f.id)} className={`py-3 rounded-lg text-center transition-all cursor-pointer ${activeFilter === f.id ? 'bg-[#FF6B4A]/15 text-[#FF6B4A] border border-[#FF6B4A]/20 ring-1 ring-[#FF6B4A]/30' : 'bg-[var(--card-bg)] text-[var(--text-tertiary)] border border-[var(--overlay-border)] hover:bg-[var(--card-bg-hover)]'}`}><span className="text-lg block mb-0.5">{f.emoji}</span><span className="text-[10px]">{f.label}</span></button>)}</div></Sec>
          </>}

          {sideTab === 'props' && <>
            <Sec title="Face Props">
              <div className="grid grid-cols-4 gap-1.5">{FACE_PROPS.map(p => <button key={p.id} onClick={() => setActiveProp(activeProp === p.id ? null : p.id)} className={`aspect-square rounded-lg flex items-center justify-center text-2xl transition-all cursor-pointer ${activeProp === p.id ? 'bg-[#FF6B4A]/15 border border-[#FF6B4A]/20 scale-110' : 'bg-[var(--card-bg)] border border-[var(--overlay-border)] hover:bg-[var(--card-bg-hover)]'}`}>{p.label}</button>)}</div>
              {activeProp && <button onClick={() => setActiveProp(null)} className="mt-2 w-full py-1.5 rounded-lg bg-[var(--input-bg)] text-[10px] font-semibold text-[var(--text-secondary)] hover:bg-[var(--card-bg-hover)] transition-all cursor-pointer">Clear Prop</button>}
            </Sec>
            {activeProp && <>
              <Sec title="Prop Size"><Slider value={propSize} onChange={setPropSize} min={10} max={50} label={`${propSize}%`} /></Sec>
              <Sec title="Position X"><Slider value={propPosition.x} onChange={x => setPropPosition(p => ({ ...p, x }))} min={0} max={100} label={`${propPosition.x}%`} /></Sec>
              <Sec title="Position Y"><Slider value={propPosition.y} onChange={y => setPropPosition(p => ({ ...p, y }))} min={0} max={100} label={`${propPosition.y}%`} /></Sec>
            </>}
          </>}

          {sideTab === 'frames' && <>
            <Sec title="Photo Frame"><div className="grid grid-cols-4 gap-1.5">{PHOTO_FRAMES.map(f => <button key={f.id} onClick={() => setPhotoFrame(f)} className={`py-2.5 rounded-lg text-center transition-all cursor-pointer ${photoFrame.id === f.id ? 'bg-[#FF6B4A]/15 text-[#FF6B4A] border border-[#FF6B4A]/20' : 'bg-[var(--card-bg)] text-[var(--text-tertiary)] border border-[var(--overlay-border)] hover:bg-[var(--card-bg-hover)]'}`}><span className="text-sm block">{f.emoji}</span><span className="text-[9px]">{f.label}</span></button>)}</div></Sec>
            <Sec title="Strip Background">
              <div className="grid grid-cols-4 gap-1.5">{STRIP_BACKGROUNDS.map(bg => <button key={bg.id} onClick={() => setStripBg(bg.id)} className={`h-9 rounded-lg border-2 transition-all cursor-pointer ${stripBg === bg.id ? 'border-[#FF6B4A] scale-105' : 'border-[var(--overlay-border)]'}`} style={{ background: bg.css }} title={bg.label} />)}</div>
            </Sec>
          </>}

          {sideTab === 'text' && <TextPanel text={stickerText} onTextChange={setStickerText} fontFamily={fontFamily} onFontChange={setFontFamily} fontSize={fontSize} onSizeChange={setFontSize} fillColor={textColor} onFillChange={setTextColor} strokeColor={textStroke} onStrokeChange={setTextStroke} strokeWidth={textStrokeWidth} onStrokeWidthChange={setTextStrokeWidth} onAddText={addTextOverlay} onAddPreset={addTextPreset} />}
          {sideTab === 'assets' && <AssetPanel onAddAsset={addAssetOverlay} />}

          {sideTab === 'adjust' && <>
            <Sec title="Brightness"><Slider value={brightness} onChange={setBrightness} min={50} max={150} label={`${brightness}%`} /></Sec>
            <Sec title="Contrast"><Slider value={contrast} onChange={setContrast} min={50} max={150} label={`${contrast}%`} /></Sec>
            <Sec title="Saturation"><Slider value={saturation} onChange={setSaturation} min={0} max={200} label={`${saturation}%`} /></Sec>
            <Button variant="ghost" size="sm" className="w-full text-[var(--text-tertiary)]" onClick={() => { setBrightness(100); setContrast(100); setSaturation(100) }}><RotateCcw className="w-3.5 h-3.5" /> Reset</Button>
          </>}

          {/* Overlays list */}
          {overlays.length > 0 && <div><label className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-2 block">Overlays ({overlays.length})</label><div className="space-y-1 max-h-28 overflow-y-auto">{overlays.map(ov => <div key={ov.id} className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-[var(--card-bg)] border border-[var(--overlay-border)]"><span className="text-[11px] text-[var(--text-secondary)] flex-1 truncate">{ov.type === 'text' ? ov.text : 'Sticker'}</span><button onClick={() => removeOverlay(ov.id)} className="cursor-pointer"><X className="w-3 h-3 text-[var(--text-tertiary)] hover:text-white" /></button></div>)}</div></div>}

          {/* Photos */}
          {capturedPhotos.length > 0 && !reviewMode && <div>
            <label className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-2 block">Photos ({capturedPhotos.length})</label>
            <div className="grid grid-cols-4 gap-1.5">{capturedPhotos.map((photo, i) => <div key={i} className="relative aspect-square rounded-lg overflow-hidden group">
              <canvas ref={el => { if (el) { el.width = 80; el.height = 80; el.getContext('2d')?.drawImage(photo, 0, 0, 80, 80) } }} className="w-full h-full" />
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
              <canvas ref={el => { if (el) { el.width = 100; el.height = 100; el.getContext('2d')?.drawImage(photo, 0, 0, 100, 100) } }} className="w-full h-full" />
              {selectedForReview[i] && <span className="absolute top-1 right-1 text-[10px] bg-[#FF6B4A] text-white px-1 rounded">✓</span>}
            </div>)}</div>
            <Button onClick={confirmReview} className="w-full mt-2 gap-2"><Eye className="w-4 h-4" /> Keep {selectedForReview.filter(Boolean).length} Selected</Button>
          </div>}

          {!reviewMode && <div className="space-y-2 pt-2">
            <Button className="w-full gap-2" onClick={handleExport} disabled={capturedPhotos.length === 0 || isExporting}>
              {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} Export Strip
            </Button>
            <Button variant="ghost" size="sm" className="w-full text-[var(--text-tertiary)]" onClick={() => { setCapturedPhotos([]); setOverlays([]) }}><RotateCcw className="w-4 h-4" /> Clear All</Button>
          </div>}
        </div>
      </div>

      {/* Right: Camera + Strip */}
      <div className="flex-1 flex flex-col items-center justify-start lg:justify-center p-4 lg:p-6 bg-[var(--canvas-bg)]  overflow-y-auto gap-4 lg:gap-6 pb-24 lg:pb-6" onClick={() => setSelectedOverlay(null)}>
        {/* Camera */}
        <div className="relative w-full max-w-[640px]">
          <div className="relative rounded-2xl overflow-hidden shadow-2xl" style={{
            border: photoFrame.border > 0 ? `${photoFrame.border}px solid ${photoFrame.color.startsWith('linear') ? '#888' : photoFrame.color}` : undefined,
            borderRadius: `${photoFrame.radius + 16}px`,
            background: photoFrame.color.startsWith('linear') ? photoFrame.color : undefined,
            padding: photoFrame.color.startsWith('linear') ? `${photoFrame.border}px` : undefined,
          }}>
            <div className="relative rounded-xl overflow-hidden bg-black" style={{ aspectRatio: '4/3' }}>
              <video ref={videoRef} className="w-full h-full object-cover" style={{ transform: mirrored ? 'scaleX(-1)' : 'none', filter: `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)` }} playsInline muted autoPlay />
              {!cameraActive && <div className="absolute inset-0 flex flex-col items-center justify-center text-[var(--text-muted)]"><Camera className="w-16 h-16 mb-4 opacity-20" /><p className="text-sm font-medium">Click &ldquo;Start Camera&rdquo;</p></div>}
              {/* Flash */}
              {showFlash && <div className="absolute inset-0 bg-white z-30 animate-[flashFade_0.3s_ease-out_forwards]" />}
              {/* Countdown */}
              {countdown > 0 && <div className="absolute inset-0 flex items-center justify-center bg-black/40 z-20"><span className="text-[80px] lg:text-[120px] font-black text-white animate-pulse drop-shadow-2xl">{countdown}</span></div>}
              {/* Burst indicator */}
              {isBursting && <div className="absolute top-4 left-4 flex items-center gap-2 bg-red-500/80 px-3 py-1.5 rounded-full z-20"><span className="w-2 h-2 rounded-full bg-white animate-pulse" /><span className="text-xs font-bold text-white">RECORDING</span></div>}
              {/* Filter badge */}
              {activeFilter !== 'none' && cameraActive && <div className="absolute top-4 right-4 bg-black/50 backdrop-blur px-2.5 py-1 rounded-full z-10"><span className="text-[10px] text-white font-medium">{IMAGE_FILTERS.find(f => f.id === activeFilter)?.emoji} {IMAGE_FILTERS.find(f => f.id === activeFilter)?.label}</span></div>}
              {/* Face prop overlay on camera */}
              {activeProp && cameraActive && (() => { const prop = FACE_PROPS.find(p => p.id === activeProp); return prop ? <img src={prop.src} alt="" className="absolute z-10 pointer-events-none" style={{ left: `${mirrored ? 100 - propPosition.x : propPosition.x}%`, top: `${propPosition.y}%`, width: `${propSize}%`, transform: 'translate(-50%, -50%)' }} /> : null })()}
            </div>
          </div>
          {/* Capture button */}
          {cameraActive && <div className="flex justify-center mt-3 lg:mt-4"><button onClick={handleCapture} disabled={countdown > 0 || isBursting} className="w-16 h-16 lg:w-16 lg:h-16 rounded-full border-4 border-[var(--overlay-border-hover)] bg-white hover:bg-stone-100 active:scale-90 transition-all cursor-pointer flex items-center justify-center shadow-xl disabled:opacity-50 touch-manipulation">{burstMode ? <Grid className="w-6 h-6 text-[#FF6B4A]" /> : <div className="w-10 h-10 rounded-full bg-[#FF6B4A]" />}</button></div>}
        </div>

        {/* Strip preview */}
        {capturedPhotos.length > 0 && !reviewMode && <div ref={previewRef} className="relative rounded-2xl shadow-2xl overflow-hidden w-full" style={{ maxWidth: stripTemplate.id === 'grid2x2' || stripTemplate.id === 'polaroid' ? '300px' : '240px', aspectRatio: stripTemplate.id === 'polaroid' ? '5/6' : stripTemplate.id === 'grid2x2' ? '1/1' : '3/8' }} onPointerMove={onOvMove} onPointerUp={onOvUp}>
          <StripCanvas template={stripTemplate} photos={capturedPhotos} bg={stripBg} />
          {overlays.map(ov => <div key={ov.id} className={`absolute cursor-grab active:cursor-grabbing select-none ${selectedOverlay === ov.id ? 'ring-2 ring-[#FF6B4A]' : ''}`} style={{ left: `${ov.x}%`, top: `${ov.y}%`, transform: 'translate(-50%, -50%)', zIndex: 10 }} onPointerDown={e => onOvDown(e, ov)} onClick={e => e.stopPropagation()}>
            {ov.type === 'asset' && ov.src ? <img src={ov.src} alt="" className="pointer-events-none" style={{ width: `${ov.size * 2}px` }} draggable={false} /> : <span className="pointer-events-none whitespace-nowrap" style={{ fontFamily: ov.fontFamily || 'Impact', fontSize: `${(ov.fontSize || 48) * 0.35}px`, fontWeight: 'bold', color: ov.fill || '#fff', WebkitTextStroke: ov.strokeWidth ? `${ov.strokeWidth * 0.3}px ${ov.stroke || '#000'}` : undefined }}>{ov.text}</span>}
          </div>)}
        </div>}
      </div>

      {/* CSS animations */}
      <style jsx global>{`
        @keyframes flashFade { from { opacity: 1 } to { opacity: 0 } }
        @keyframes curtainReveal { 0% { opacity: 0; transform: scale(0.8) } 30% { opacity: 1; transform: scale(1.05) } 100% { opacity: 1; transform: scale(1) } }
        @keyframes loadBar { from { width: 0 } to { width: 100% } }
      `}</style>
    </div>
  )
}

function Sec({ title, children }: { title: string; children: React.ReactNode }) {
  return <div><label className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-2 block">{title}</label>{children}</div>
}

function Slider({ value, onChange, min, max, label }: { value: number; onChange: (v: number) => void; min: number; max: number; label: string }) {
  const pct = ((value - min) / (max - min)) * 100
  return <div className="flex items-center gap-2"><input type="range" min={min} max={max} value={value} onChange={e => onChange(Number(e.target.value))} className="flex-1" style={{ background: `linear-gradient(to right, #FF6B4A ${pct}%, rgba(255,255,255,0.06) ${pct}%)` }} /><span className="text-[10px] text-[var(--text-muted)] font-mono w-10 text-right">{label}</span></div>
}

function StripCanvas({ template, photos, bg }: { template: StripTemplate; photos: HTMLCanvasElement[]; bg: string }) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    if (!ref.current || photos.length === 0) return
    const W = template.id === 'grid2x2' || template.id === 'polaroid' ? 600 : 480
    const H = template.id === 'polaroid' ? 720 : template.id === 'grid2x2' ? 600 : 1280
    ref.current.width = W; ref.current.height = H
    template.render(ref.current.getContext('2d')!, photos, W, H, bg)
  }, [template, photos, bg])
  return <canvas ref={ref} className="w-full h-full" />
}
