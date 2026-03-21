'use client'

import { SidebarHeader } from '@/components/shared/SidebarHeader'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/toast'
import { downloadUrl } from '@/lib/download'
import { detectSlots, hasTransparentRegions } from '@/lib/slot-detector'
import {
    Cloud, Copy, Download, Eye, Grid, GripVertical, HelpCircle, ImagePlus, Info,
    Layers, Loader2, Magnet, MousePointer2,
    Plus,
    Redo2,
    RotateCcw, Save, Scan, Square, Trash2, Undo2,
    X
} from 'lucide-react'
import Link from 'next/link'
import { useCallback, useEffect, useRef, useState } from 'react'

interface FrameEditorProps {
  /** When true, renders without page-level layout (for use inside modals) */
  embedded?: boolean
  /** Called when a frame is saved — passes the template to the parent */
  onSave?: (frame: FrameTemplate) => void
  /** Called to close the editor (embedded mode) */
  onClose?: () => void
}

// ─── Types ──────────────────────────────────────────────────
export interface FrameSlot {
  id: string
  x: number; y: number; w: number; h: number
  rotation: number; radius: number
}

export interface FrameTemplate {
  id: string
  name: string
  frameDataUrl: string   // base64 PNG
  width: number
  height: number
  slots: FrameSlot[]
  createdAt: number
}

type Tool = 'select' | 'draw'
type Handle = 'nw' | 'ne' | 'sw' | 'se' | 'move' | null

const STORAGE_KEY = 'sticker-studio-frame-templates'
const SAMPLE_PHOTOS = [
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&h=300&fit=crop',
]

// ─── Helpers ────────────────────────────────────────────────
function loadSavedTemplates(): FrameTemplate[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') } catch { return [] }
}
function saveTemplates(templates: FrameTemplate[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(templates))
}
function uid() { return `slot-${Date.now()}-${Math.random().toString(36).slice(2, 6)}` }

// ─── Component ──────────────────────────────────────────────
export default function FrameEditorClient({ embedded = false, onSave, onClose }: FrameEditorProps = {}) {
  const { toast } = useToast()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Frame state
  const [frameImg, setFrameImg] = useState<HTMLImageElement | null>(null)
  const [frameDataUrl, setFrameDataUrl] = useState<string>('')
  const [frameName, setFrameName] = useState('My Frame')
  const [frameW, setFrameW] = useState(600)
  const [frameH, setFrameH] = useState(1600)

  // Slots
  const [slots, setSlots] = useState<FrameSlot[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [tool, setTool] = useState<Tool>('select')

  // Drawing state
  const [isDrawing, setIsDrawing] = useState(false)
  const drawStart = useRef<{ x: number; y: number } | null>(null)
  const [drawRect, setDrawRect] = useState<{ x: number; y: number; w: number; h: number } | null>(null)

  // Drag/resize state
  const [isDragging, setIsDragging] = useState(false)
  const [activeHandle, setActiveHandle] = useState<Handle>(null)
  const dragStart = useRef<{ mx: number; my: number; slot: FrameSlot } | null>(null)

  // Preview
  const [showPreview, setShowPreview] = useState(false)
  const [sampleImgs, setSampleImgs] = useState<HTMLImageElement[]>([])

  // Guide Modal
  const [showGuide, setShowGuide] = useState(false)

  useEffect(() => {
    if (!localStorage.getItem('sticker-studio-frame-guide-seen')) {
      setShowGuide(true)
      localStorage.setItem('sticker-studio-frame-guide-seen', 'true')
    }
  }, [])

  // Save success
  const [justSaved, setJustSaved] = useState(false)
  const [isSavingCloud, setIsSavingCloud] = useState(false)
  const [showExport, setShowExport] = useState(false)

  // Saved templates
  const [savedTemplates, setSavedTemplates] = useState<FrameTemplate[]>([])

  // Scale factor for display
  const [baseScale, setBaseScale] = useState(1)
  const [zoom, setZoom] = useState(1)
  const scale = baseScale * zoom

  // ─── Snap-to-grid + Smart guides ──────────────────────────
  const [snapEnabled, setSnapEnabled] = useState(true)
  const [gridSize, setGridSize] = useState(10)
  const [showGrid, setShowGrid] = useState(true)
  const [guides, setGuides] = useState<{ vertical: number[]; horizontal: number[] }>({ vertical: [], horizontal: [] })
  const GUIDE_THRESHOLD = 6 // snap within 6 px

  // Auto-detect
  const [isDetecting, setIsDetecting] = useState(false)
  const [hasTransparency, setHasTransparency] = useState(false)

  useEffect(() => { setSavedTemplates(loadSavedTemplates()) }, [])

  // Load sample images
  useEffect(() => {
    const imgs: HTMLImageElement[] = []
    let loaded = 0
    SAMPLE_PHOTOS.forEach(src => {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => { loaded++; if (loaded === SAMPLE_PHOTOS.length) setSampleImgs(imgs) }
      img.onerror = () => { loaded++; if (loaded === SAMPLE_PHOTOS.length) setSampleImgs(imgs) }
      img.src = src
      imgs.push(img)
    })
  }, [])

  // Calculate scale
  useEffect(() => {
    if (!containerRef.current) return
    const updateScale = () => {
      if (!containerRef.current) return
      const cw = containerRef.current.clientWidth - 32
      const ch = containerRef.current.clientHeight - 32
      const s = Math.min(cw / frameW, ch / frameH, 1)
      setBaseScale(s)
    }
    updateScale()
    const ro = new ResizeObserver(updateScale)
    ro.observe(containerRef.current)
    return () => ro.disconnect()
  }, [frameW, frameH])

  // Check transparency when frame image changes
  useEffect(() => {
    if (frameImg) {
      setHasTransparency(hasTransparentRegions(frameImg))
    } else {
      setHasTransparency(false)
    }
  }, [frameImg])

  // ─── Snap helpers ─────────────────────────────────────────
  const snapToGrid = useCallback((v: number) => {
    if (!snapEnabled) return v
    return Math.round(v / gridSize) * gridSize
  }, [snapEnabled, gridSize])

  const computeGuides = useCallback((movingSlot: FrameSlot) => {
    if (!snapEnabled) { setGuides({ vertical: [], horizontal: [] }); return }
    const vGuides: number[] = []
    const hGuides: number[] = []
    const moveCx = movingSlot.x + movingSlot.w / 2
    const moveCy = movingSlot.y + movingSlot.h / 2
    const moveRight = movingSlot.x + movingSlot.w
    const moveBottom = movingSlot.y + movingSlot.h

    // Frame center guides
    const fcx = frameW / 2, fcy = frameH / 2
    if (Math.abs(moveCx - fcx) < GUIDE_THRESHOLD) vGuides.push(fcx)
    if (Math.abs(moveCy - fcy) < GUIDE_THRESHOLD) hGuides.push(fcy)
    // Frame edges
    if (Math.abs(movingSlot.x) < GUIDE_THRESHOLD) vGuides.push(0)
    if (Math.abs(moveRight - frameW) < GUIDE_THRESHOLD) vGuides.push(frameW)
    if (Math.abs(movingSlot.y) < GUIDE_THRESHOLD) hGuides.push(0)
    if (Math.abs(moveBottom - frameH) < GUIDE_THRESHOLD) hGuides.push(frameH)

    // Other slots alignment
    for (const s of slots) {
      if (s.id === movingSlot.id) continue
      const cx = s.x + s.w / 2, cy = s.y + s.h / 2
      const right = s.x + s.w, bottom = s.y + s.h
      // Center alignment
      if (Math.abs(moveCx - cx) < GUIDE_THRESHOLD) vGuides.push(cx)
      if (Math.abs(moveCy - cy) < GUIDE_THRESHOLD) hGuides.push(cy)
      // Edge alignment
      if (Math.abs(movingSlot.x - s.x) < GUIDE_THRESHOLD) vGuides.push(s.x)
      if (Math.abs(moveRight - right) < GUIDE_THRESHOLD) vGuides.push(right)
      if (Math.abs(movingSlot.x - right) < GUIDE_THRESHOLD) vGuides.push(right)
      if (Math.abs(moveRight - s.x) < GUIDE_THRESHOLD) vGuides.push(s.x)
      if (Math.abs(movingSlot.y - s.y) < GUIDE_THRESHOLD) hGuides.push(s.y)
      if (Math.abs(moveBottom - bottom) < GUIDE_THRESHOLD) hGuides.push(bottom)
      if (Math.abs(movingSlot.y - bottom) < GUIDE_THRESHOLD) hGuides.push(bottom)
      if (Math.abs(moveBottom - s.y) < GUIDE_THRESHOLD) hGuides.push(s.y)
    }
    setGuides({ vertical: [...new Set(vGuides)], horizontal: [...new Set(hGuides)] })
  }, [snapEnabled, slots, frameW, frameH])

  // ─── Auto-detect slots ────────────────────────────────────
  const handleAutoDetect = useCallback(async () => {
    if (!frameImg) return
    setIsDetecting(true)
    // Yield to UI
    await new Promise(r => setTimeout(r, 50))
    try {
      const detected = detectSlots(frameImg)
      if (detected.length === 0) {
        toast('No transparent slots detected in this frame', 'error')
        setIsDetecting(false)
        return
      }
      const newSlots: FrameSlot[] = detected.map(d => ({
        id: uid(), x: d.x, y: d.y, w: d.w, h: d.h, rotation: 0, radius: 8
      }))
      setSlots(newSlots)
      setSelectedId(null)
      toast(`⚡ Detected ${newSlots.length} slot${newSlots.length > 1 ? 's' : ''}! Review & adjust as needed`, 'success')
    } catch (err) {
      console.error('Slot detection failed:', err)
      toast('Detection failed — try drawing slots manually', 'error')
    }
    setIsDetecting(false)
  }, [frameImg, toast])

  // ─── Canvas rendering ──────────────────────────────────────
  const render = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    canvas.width = frameW * scale
    canvas.height = frameH * scale
    ctx.scale(scale, scale)

    // Background
    ctx.fillStyle = '#f3f4f6'
    ctx.fillRect(0, 0, frameW, frameH)

    // Grid
    if (showGrid) {
      ctx.strokeStyle = snapEnabled ? 'rgba(59,130,246,0.08)' : '#e5e7eb'
      ctx.lineWidth = 0.5
      const displayGridSize = snapEnabled ? gridSize : 50
      for (let x = 0; x <= frameW; x += displayGridSize) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, frameH); ctx.stroke() }
      for (let y = 0; y <= frameH; y += displayGridSize) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(frameW, y); ctx.stroke() }
      // Frame center crosshair
      ctx.strokeStyle = 'rgba(59,130,246,0.15)'
      ctx.lineWidth = 1
      ctx.setLineDash([8, 4])
      ctx.beginPath(); ctx.moveTo(frameW / 2, 0); ctx.lineTo(frameW / 2, frameH); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(0, frameH / 2); ctx.lineTo(frameW, frameH / 2); ctx.stroke()
      ctx.setLineDash([])
    }

    // Preview: draw sample photos in slots
    if (showPreview) {
      slots.forEach((slot, i) => {
        ctx.save()
        if (slot.radius > 0) {
          roundRect(ctx, slot.x, slot.y, slot.w, slot.h, slot.radius)
          ctx.clip()
        }
        if (sampleImgs[i % sampleImgs.length]?.complete) {
          ctx.drawImage(sampleImgs[i % sampleImgs.length], slot.x, slot.y, slot.w, slot.h)
        } else {
          ctx.fillStyle = `hsl(${(i * 60) % 360}, 70%, 85%)`
          ctx.fillRect(slot.x, slot.y, slot.w, slot.h)
        }
        ctx.restore()
      })
    }

    // Frame overlay
    if (frameImg) {
      ctx.drawImage(frameImg, 0, 0, frameW, frameH)
    }

    // Draw slots (not in preview)
    if (!showPreview) {
      slots.forEach((slot, i) => {
        const isSelected = slot.id === selectedId
        ctx.save()

        // Slot fill
        ctx.fillStyle = isSelected ? 'rgba(255, 107, 74, 0.15)' : 'rgba(59, 130, 246, 0.08)'
        if (slot.radius > 0) {
          roundRect(ctx, slot.x, slot.y, slot.w, slot.h, slot.radius)
          ctx.fill()
        } else {
          ctx.fillRect(slot.x, slot.y, slot.w, slot.h)
        }

        // Slot border
        ctx.strokeStyle = isSelected ? '#FF6B4A' : '#3b82f6'
        ctx.lineWidth = isSelected ? 2.5 : 1.5
        ctx.setLineDash(isSelected ? [] : [6, 4])
        if (slot.radius > 0) {
          roundRect(ctx, slot.x, slot.y, slot.w, slot.h, slot.radius)
          ctx.stroke()
        } else {
          ctx.strokeRect(slot.x, slot.y, slot.w, slot.h)
        }
        ctx.setLineDash([])

        // Label
        ctx.fillStyle = isSelected ? '#FF6B4A' : '#3b82f6'
        ctx.font = 'bold 13px Inter, system-ui, sans-serif'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(`${i + 1}`, slot.x + slot.w / 2, slot.y + slot.h / 2)
        ctx.font = '10px Inter, system-ui, sans-serif'
        ctx.fillText(`${Math.round(slot.w)}×${Math.round(slot.h)}`, slot.x + slot.w / 2, slot.y + slot.h / 2 + 16)

        // Resize handles (selected only)
        if (isSelected) {
          const handleSize = 8
          const handles = [
            { x: slot.x, y: slot.y },
            { x: slot.x + slot.w, y: slot.y },
            { x: slot.x, y: slot.y + slot.h },
            { x: slot.x + slot.w, y: slot.y + slot.h },
          ]
          handles.forEach(h => {
            ctx.fillStyle = '#fff'
            ctx.strokeStyle = '#FF6B4A'
            ctx.lineWidth = 2
            ctx.fillRect(h.x - handleSize / 2, h.y - handleSize / 2, handleSize, handleSize)
            ctx.strokeRect(h.x - handleSize / 2, h.y - handleSize / 2, handleSize, handleSize)
          })
        }
        ctx.restore()
      })
    }

    // Draw in-progress rectangle
    if (drawRect) {
      ctx.save()
      ctx.fillStyle = 'rgba(255, 107, 74, 0.12)'
      ctx.fillRect(drawRect.x, drawRect.y, drawRect.w, drawRect.h)
      ctx.strokeStyle = '#FF6B4A'
      ctx.lineWidth = 2
      ctx.setLineDash([5, 3])
      ctx.strokeRect(drawRect.x, drawRect.y, drawRect.w, drawRect.h)
      ctx.setLineDash([])
      // Dimension label on draw rect
      ctx.fillStyle = '#FF6B4A'
      ctx.font = 'bold 11px Inter, system-ui, sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(`${Math.round(drawRect.w)}×${Math.round(drawRect.h)}`, drawRect.x + drawRect.w / 2, drawRect.y + drawRect.h + 14)
      ctx.restore()
    }

    // ─── Smart guide lines ────────────────────────────────
    if (guides.vertical.length > 0 || guides.horizontal.length > 0) {
      ctx.save()
      ctx.strokeStyle = '#3B82F6'
      ctx.lineWidth = 1
      ctx.setLineDash([4, 3])
      ctx.globalAlpha = 0.7
      for (const gx of guides.vertical) {
        ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, frameH); ctx.stroke()
      }
      for (const gy of guides.horizontal) {
        ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(frameW, gy); ctx.stroke()
      }
      ctx.setLineDash([])
      ctx.restore()
    }
  }, [frameW, frameH, frameImg, slots, selectedId, scale, showPreview, sampleImgs, drawRect, showGrid, snapEnabled, gridSize, guides])

  useEffect(() => { render() }, [render])

  // ─── Canvas mouse/touch events ────────────────────────────
  function canvasToFrame(e: React.PointerEvent): { x: number; y: number } {
    const rect = canvasRef.current!.getBoundingClientRect()
    return { x: (e.clientX - rect.left) / scale, y: (e.clientY - rect.top) / scale }
  }

  function hitTestHandle(slot: FrameSlot, fx: number, fy: number): Handle {
    const hs = 12 / scale
    const corners: { h: Handle; x: number; y: number }[] = [
      { h: 'nw', x: slot.x, y: slot.y },
      { h: 'ne', x: slot.x + slot.w, y: slot.y },
      { h: 'sw', x: slot.x, y: slot.y + slot.h },
      { h: 'se', x: slot.x + slot.w, y: slot.y + slot.h },
    ]
    for (const c of corners) {
      if (Math.abs(fx - c.x) < hs && Math.abs(fy - c.y) < hs) return c.h
    }
    if (fx >= slot.x && fx <= slot.x + slot.w && fy >= slot.y && fy <= slot.y + slot.h) return 'move'
    return null
  }

  const onPointerDown = (e: React.PointerEvent) => {
    const { x, y } = canvasToFrame(e)

    if (tool === 'draw') {
      setIsDrawing(true)
      drawStart.current = { x, y }
      setDrawRect({ x, y, w: 0, h: 0 })
      ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
      return
    }

    // Select tool: hit test
    for (let i = slots.length - 1; i >= 0; i--) {
      const slot = slots[i]
      const handle = hitTestHandle(slot, x, y)
      if (handle) {
        setSelectedId(slot.id)
        setActiveHandle(handle)
        setIsDragging(true)
        dragStart.current = { mx: x, my: y, slot: { ...slot } }
        ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
        return
      }
    }
    setSelectedId(null)
  }

  const onPointerMove = (e: React.PointerEvent) => {
    const { x, y } = canvasToFrame(e)

    if (tool === 'draw' && isDrawing && drawStart.current) {
      const rawSx = Math.min(drawStart.current.x, x)
      const rawSy = Math.min(drawStart.current.y, y)
      const rawSw = Math.abs(x - drawStart.current.x)
      const rawSh = Math.abs(y - drawStart.current.y)
      setDrawRect({ x: snapToGrid(rawSx), y: snapToGrid(rawSy), w: snapToGrid(rawSw), h: snapToGrid(rawSh) })
      return
    }

    if (isDragging && dragStart.current && activeHandle && selectedId) {
      const { mx, my, slot } = dragStart.current
      const dx = x - mx, dy = y - my
      setSlots(prev => prev.map(s => {
        if (s.id !== selectedId) return s
        if (activeHandle === 'move') {
          const newX = snapToGrid(Math.max(0, Math.min(frameW - s.w, slot.x + dx)))
          const newY = snapToGrid(Math.max(0, Math.min(frameH - s.h, slot.y + dy)))
          const movedSlot = { ...s, x: newX, y: newY }
          computeGuides(movedSlot)
          return movedSlot
        }
        let nx = slot.x, ny = slot.y, nw = slot.w, nh = slot.h
        if (activeHandle === 'se') { nw = Math.max(30, slot.w + dx); nh = Math.max(30, slot.h + dy) }
        if (activeHandle === 'sw') { nx = slot.x + dx; nw = Math.max(30, slot.w - dx); nh = Math.max(30, slot.h + dy) }
        if (activeHandle === 'ne') { ny = slot.y + dy; nw = Math.max(30, slot.w + dx); nh = Math.max(30, slot.h - dy) }
        if (activeHandle === 'nw') { nx = slot.x + dx; ny = slot.y + dy; nw = Math.max(30, slot.w - dx); nh = Math.max(30, slot.h - dy) }
        nx = snapToGrid(Math.max(0, nx)); ny = snapToGrid(Math.max(0, ny))
        nw = snapToGrid(Math.min(nw, frameW)); nh = snapToGrid(Math.min(nh, frameH))
        const resizedSlot = { ...s, x: nx, y: ny, w: nw, h: nh }
        computeGuides(resizedSlot)
        return resizedSlot
      }))
    }
  }

  const onPointerUp = () => {
    if (tool === 'draw' && isDrawing && drawRect) {
      if (drawRect.w > 20 && drawRect.h > 20) {
        const newSlot: FrameSlot = {
          id: uid(), x: snapToGrid(Math.round(drawRect.x)), y: snapToGrid(Math.round(drawRect.y)),
          w: snapToGrid(Math.round(drawRect.w)), h: snapToGrid(Math.round(drawRect.h)), rotation: 0, radius: 8
        }
        setSlots(prev => [...prev, newSlot])
        setSelectedId(newSlot.id)
        toast('📐 Slot added', 'success')
      }
      setDrawRect(null)
      setIsDrawing(false)
      drawStart.current = null
      return
    }
    setIsDragging(false)
    setActiveHandle(null)
    dragStart.current = null
    setGuides({ vertical: [], horizontal: [] })
  }

  // ─── Frame upload ─────────────────────────────────────────
  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const url = ev.target?.result as string
      const img = new Image()
      img.onload = () => {
        setFrameImg(img)
        setFrameDataUrl(url)
        setFrameW(img.naturalWidth)
        setFrameH(img.naturalHeight)
        setSlots([])
        setSelectedId(null)
        toast('🖼️ Frame loaded!', 'success')
      }
      img.src = url
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  // ─── Slot actions ─────────────────────────────────────────
  const deleteSlot = (id: string) => {
    setSlots(prev => prev.filter(s => s.id !== id))
    if (selectedId === id) setSelectedId(null)
  }

  const duplicateSlot = (id: string) => {
    const slot = slots.find(s => s.id === id)
    if (!slot) return
    const newSlot = { ...slot, id: uid(), x: slot.x + 20, y: slot.y + 20 }
    setSlots(prev => [...prev, newSlot])
    setSelectedId(newSlot.id)
  }

  const addQuickSlots = (count: number) => {
    const padding = 30
    const gap = 20
    const slotW = frameW - padding * 2
    const totalGap = gap * (count - 1)
    const slotH = Math.round((frameH - padding * 2 - totalGap) / count)
    const newSlots: FrameSlot[] = Array.from({ length: count }, (_, i) => ({
      id: uid(), x: padding, y: padding + i * (slotH + gap),
      w: slotW, h: slotH, rotation: 0, radius: 8
    }))
    setSlots(newSlots)
    setSelectedId(null)
    toast(`✨ ${count} slots created`, 'success')
  }

  // ─── Layout presets ─────────────────────────────────────────
  type LayoutPreset = { id: string; name: string; emoji: string; desc: string; generate: (w: number, h: number) => Omit<FrameSlot, 'id'>[] }
  const LAYOUT_PRESETS: LayoutPreset[] = [
    {
      id: 'strip-3', name: 'Strip 3', emoji: '📏', desc: '3 photos vertical',
      generate: (w, h) => {
        const p = 30, g = 20, sw = w - p * 2, sh = Math.round((h - p * 2 - g * 2) / 3)
        return Array.from({ length: 3 }, (_, i) => ({ x: p, y: p + i * (sh + g), w: sw, h: sh, rotation: 0, radius: 8 }))
      }
    },
    {
      id: 'strip-4', name: 'Strip 4', emoji: '📐', desc: '4 photos vertical',
      generate: (w, h) => {
        const p = 30, g = 20, sw = w - p * 2, sh = Math.round((h - p * 2 - g * 3) / 4)
        return Array.from({ length: 4 }, (_, i) => ({ x: p, y: p + i * (sh + g), w: sw, h: sh, rotation: 0, radius: 8 }))
      }
    },
    {
      id: 'grid-2x2', name: 'Grid 2×2', emoji: '⊞', desc: '2×2 grid layout',
      generate: (w, h) => {
        const p = 30, g = 15, sw = Math.round((w - p * 2 - g) / 2), sh = Math.round((h - p * 2 - g) / 2)
        return [
          { x: p, y: p, w: sw, h: sh, rotation: 0, radius: 8 },
          { x: p + sw + g, y: p, w: sw, h: sh, rotation: 0, radius: 8 },
          { x: p, y: p + sh + g, w: sw, h: sh, rotation: 0, radius: 8 },
          { x: p + sw + g, y: p + sh + g, w: sw, h: sh, rotation: 0, radius: 8 },
        ]
      }
    },
    {
      id: 'grid-2x3', name: 'Grid 2×3', emoji: '⊟', desc: '2×3 grid layout',
      generate: (w, h) => {
        const p = 30, g = 15, sw = Math.round((w - p * 2 - g) / 2), sh = Math.round((h - p * 2 - g * 2) / 3)
        const slots: Omit<FrameSlot, 'id'>[] = []
        for (let row = 0; row < 3; row++)
          for (let col = 0; col < 2; col++)
            slots.push({ x: p + col * (sw + g), y: p + row * (sh + g), w: sw, h: sh, rotation: 0, radius: 8 })
        return slots
      }
    },
    {
      id: 'collage-1-2', name: 'Collage', emoji: '🎨', desc: '1 big + 2 small',
      generate: (w, h) => {
        const p = 30, g = 15
        const bigH = Math.round((h - p * 2 - g) * 0.6)
        const smallH = h - p * 2 - g - bigH
        const halfW = Math.round((w - p * 2 - g) / 2)
        return [
          { x: p, y: p, w: w - p * 2, h: bigH, rotation: 0, radius: 12 },
          { x: p, y: p + bigH + g, w: halfW, h: smallH, rotation: 0, radius: 8 },
          { x: p + halfW + g, y: p + bigH + g, w: halfW, h: smallH, rotation: 0, radius: 8 },
        ]
      }
    },
    {
      id: 'collage-l', name: 'L-Shape', emoji: '🔲', desc: '1 big + 2 stacked',
      generate: (w, h) => {
        const p = 30, g = 15
        const leftW = Math.round((w - p * 2 - g) * 0.6)
        const rightW = w - p * 2 - g - leftW
        const rightH = Math.round((h - p * 2 - g) / 2)
        return [
          { x: p, y: p, w: leftW, h: h - p * 2, rotation: 0, radius: 12 },
          { x: p + leftW + g, y: p, w: rightW, h: rightH, rotation: 0, radius: 8 },
          { x: p + leftW + g, y: p + rightH + g, w: rightW, h: rightH, rotation: 0, radius: 8 },
        ]
      }
    },
    {
      id: 'big-small', name: 'Big+Small', emoji: '📷', desc: '1 big + 3 small row',
      generate: (w, h) => {
        const p = 30, g = 15
        const bigH = Math.round((h - p * 2 - g) * 0.7)
        const smallH = h - p * 2 - g - bigH
        const smallW = Math.round((w - p * 2 - g * 2) / 3)
        return [
          { x: p, y: p, w: w - p * 2, h: bigH, rotation: 0, radius: 12 },
          { x: p, y: p + bigH + g, w: smallW, h: smallH, rotation: 0, radius: 8 },
          { x: p + smallW + g, y: p + bigH + g, w: smallW, h: smallH, rotation: 0, radius: 8 },
          { x: p + (smallW + g) * 2, y: p + bigH + g, w: smallW, h: smallH, rotation: 0, radius: 8 },
        ]
      }
    },
    {
      id: 'filmstrip', name: 'Filmstrip', emoji: '🎞️', desc: '3 photos horizontal',
      generate: (w, h) => {
        const p = 30, g = 15
        const slotW = Math.round((w - p * 2 - g * 2) / 3)
        const slotH = h - p * 2
        return Array.from({ length: 3 }, (_, i) => ({ x: p + i * (slotW + g), y: p, w: slotW, h: slotH, rotation: 0, radius: 8 }))
      }
    },
    {
      id: 'polaroid', name: 'Polaroid', emoji: '📸', desc: '1 photo + caption area',
      generate: (w, h) => {
        const p = 40
        const photoH = Math.round((h - p * 2) * 0.78)
        return [
          { x: p, y: p, w: w - p * 2, h: photoH, rotation: 0, radius: 4 },
        ]
      }
    },
    {
      id: 'mosaic', name: 'Mosaic', emoji: '🧩', desc: '5 photos mixed sizes',
      generate: (w, h) => {
        const p = 30, g = 12
        const col1 = Math.round((w - p * 2 - g) * 0.5)
        const col2 = w - p * 2 - g - col1
        const row1 = Math.round((h - p * 2 - g * 2) / 3)
        const row2 = row1
        const row3 = h - p * 2 - g * 2 - row1 - row2
        return [
          { x: p, y: p, w: col1, h: row1 + g + row2, rotation: 0, radius: 10 },
          { x: p + col1 + g, y: p, w: col2, h: row1, rotation: 0, radius: 8 },
          { x: p + col1 + g, y: p + row1 + g, w: col2, h: row2, rotation: 0, radius: 8 },
          { x: p, y: p + row1 + row2 + g * 2, w: Math.round((w - p * 2 - g) / 2), h: row3, rotation: 0, radius: 8 },
          { x: p + Math.round((w - p * 2 - g) / 2) + g, y: p + row1 + row2 + g * 2, w: w - p * 2 - g - Math.round((w - p * 2 - g) / 2), h: row3, rotation: 0, radius: 8 },
        ]
      }
    },
    {
      id: 'triptych', name: 'Triptych', emoji: '🖼️', desc: 'Center focus + 2 sides',
      generate: (w, h) => {
        const p = 30, g = 15
        const sideW = Math.round((w - p * 2 - g * 2) * 0.25)
        const centerW = w - p * 2 - g * 2 - sideW * 2
        const slotH = h - p * 2
        return [
          { x: p, y: p + Math.round(slotH * 0.1), w: sideW, h: Math.round(slotH * 0.8), rotation: 0, radius: 8 },
          { x: p + sideW + g, y: p, w: centerW, h: slotH, rotation: 0, radius: 12 },
          { x: p + sideW + g + centerW + g, y: p + Math.round(slotH * 0.1), w: sideW, h: Math.round(slotH * 0.8), rotation: 0, radius: 8 },
        ]
      }
    },
  ]

  const applyPreset = (preset: LayoutPreset) => {
    const generated = preset.generate(frameW, frameH)
    const newSlots: FrameSlot[] = generated.map(s => ({ ...s, id: uid() }))
    setSlots(newSlots)
    setSelectedId(null)
    toast(`✨ ${preset.name} — ${newSlots.length} slots`, 'success')
  }

  // ─── Save template ────────────────────────────────────────
  const saveTemplate = () => {
    if (slots.length === 0) { toast('Add at least 1 slot first', 'error'); return }
    const template: FrameTemplate = {
      id: `frame-${Date.now()}`, name: frameName,
      frameDataUrl, width: frameW, height: frameH,
      slots: slots.map(s => ({ ...s })), createdAt: Date.now()
    }
    const updated = [...savedTemplates.filter(t => t.name !== frameName), template]
    saveTemplates(updated)
    setSavedTemplates(updated)
    toast(`💾 "${frameName}" saved!`, 'success')
    // Notify parent in embedded mode
    if (onSave) onSave(template)
    setJustSaved(true)
    setTimeout(() => setJustSaved(false), 10000)
  }

  // ─── Save to Supabase Cloud ─────────────────────────────
  const saveToCloud = async () => {
    if (slots.length === 0) { toast('Add at least 1 slot first', 'error'); return }
    setIsSavingCloud(true)
    try {
      const res = await fetch('/api/frames', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: frameName, frameDataUrl, width: frameW, height: frameH, slots: slots.map(s => ({ ...s })) })
      })
      if (!res.ok) { const err = await res.json(); throw new Error(err.error || 'Upload failed') }
      toast(`☁️ "${frameName}" saved to cloud!`, 'success')
      setJustSaved(true)
      setTimeout(() => setJustSaved(false), 10000)
    } catch (err: any) {
      console.error('Cloud save error:', err)
      toast(`Cloud save failed: ${err.message}`, 'error')
    } finally {
      setIsSavingCloud(false)
    }
  }

  // ─── Export as JSON ───────────────────────────────────────
  const exportJSON = () => {
    if (slots.length === 0) { toast('Add at least 1 slot first', 'error'); return }
    const data = { name: frameName, width: frameW, height: frameH, slots: slots.map(({ id, ...rest }) => rest) }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    downloadUrl(url, `${frameName.toLowerCase().replace(/\s+/g, '-')}-template.json`)
    URL.revokeObjectURL(url)
    toast('📄 Template exported!', 'success')
  }

  // ─── Export preview image ─────────────────────────────────
  const exportPreview = async () => {
    const canvas = document.createElement('canvas')
    canvas.width = frameW; canvas.height = frameH
    const ctx = canvas.getContext('2d')!
    ctx.fillStyle = '#fff'
    ctx.fillRect(0, 0, frameW, frameH)
    // Draw sample photos
    for (let i = 0; i < slots.length; i++) {
      const slot = slots[i]
      ctx.save()
      if (slot.radius > 0) { roundRect(ctx, slot.x, slot.y, slot.w, slot.h, slot.radius); ctx.clip() }
      if (sampleImgs[i % sampleImgs.length]?.complete) {
        ctx.drawImage(sampleImgs[i % sampleImgs.length], slot.x, slot.y, slot.w, slot.h)
      } else {
        ctx.fillStyle = `hsl(${(i * 60) % 360}, 70%, 85%)`
        ctx.fillRect(slot.x, slot.y, slot.w, slot.h)
      }
      ctx.restore()
    }
    // Overlay frame
    if (frameImg) ctx.drawImage(frameImg, 0, 0, frameW, frameH)
    downloadUrl(canvas.toDataURL('image/png'), `${frameName.toLowerCase().replace(/\s+/g, '-')}-preview.png`)
    toast('🖼️ Preview exported!', 'success')
  }

  // ─── Load saved template ──────────────────────────────────
  const loadTemplate = (t: FrameTemplate) => {
    setFrameName(t.name)
    setFrameW(t.width); setFrameH(t.height)
    setSlots(t.slots)
    setFrameDataUrl(t.frameDataUrl)
    setSelectedId(null)
    if (t.frameDataUrl) {
      const img = new Image()
      img.onload = () => setFrameImg(img)
      img.src = t.frameDataUrl
    } else {
      setFrameImg(null)
    }
    toast(`📂 Loaded "${t.name}"`, 'success')
  }

  const deleteTemplate = (id: string) => {
    const updated = savedTemplates.filter(t => t.id !== id)
    saveTemplates(updated)
    setSavedTemplates(updated)
    toast('🗑️ Template deleted', 'success')
  }

  const selectedSlot = slots.find(s => s.id === selectedId)

  // ─── Render ───────────────────────────────────────────────
  return (
    <div className={`flex flex-col lg:flex-row overflow-hidden ${embedded ? 'h-full' : 'h-screen'} bg-[var(--background)]`}>
      {/* ═══ LEFT SIDEBAR ═══ */}
      <div className="w-full lg:w-[320px] shrink-0 bg-[var(--panel-bg)] border-b lg:border-b-0 lg:border-r border-[var(--overlay-border)] overflow-y-auto p-4 lg:p-5 space-y-4">
        {/* Header */}
        <SidebarHeader
          gradient="from-[#3B82F6] to-[#8B5CF6]"
          icon={<Layers className="w-4.5 h-4.5 text-white" />}
          title="Frame Editor"
          subtitle="Design photobooth templates"
          rightSlot={
            embedded && onClose ? (
              <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-(--card-bg-hover) transition-all cursor-pointer">
                <X className="w-5 h-5 text-(--text-muted)" />
              </button>
            ) : (
              <button
                onClick={() => { setSlots([]); setFrameImg(null); setFrameDataUrl(''); setFrameName('My Frame') }}
                title="Clear frame"
                className="w-7 h-7 flex items-center justify-center rounded-lg bg-(--card-bg) hover:bg-red-500/10 hover:text-red-400 text-(--text-muted) transition-all cursor-pointer shrink-0"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )
          }
        />

        {/* Frame name */}
        <div>
          <label className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-1.5 block">Template Name</label>
          <input value={frameName} onChange={e => setFrameName(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-[var(--input-bg)] border border-[var(--overlay-border)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[#3B82F6]/50" />
        </div>

        {/* Upload */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)] block">Frame Image (PNG)</label>
            <button onClick={() => setShowGuide(true)} className="text-[var(--text-muted)] hover:text-[#3B82F6] transition-colors cursor-pointer" title="Hướng dẫn chuẩn bị Frame">
              <HelpCircle className="w-3.5 h-3.5" />
            </button>
          </div>
          <label className="flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-[var(--overlay-border)] hover:border-[#3B82F6]/40 cursor-pointer transition-all hover:bg-[var(--card-bg)]">
            <ImagePlus className="w-4 h-4 text-[var(--text-muted)]" />
            <span className="text-xs font-medium text-[var(--text-secondary)]">{frameImg ? 'Replace frame' : 'Upload PNG frame'}</span>
            <input type="file" accept="image/png,image/webp" onChange={handleUpload} className="hidden" />
          </label>
          {frameImg && <p className="text-[10px] text-[var(--text-muted)] mt-1.5">Loaded: {frameW}×{frameH}px</p>}
        </div>

        {/* Frame dimensions (no image) */}
        {!frameImg && (
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-1.5 block">Canvas Size</label>
            <div className="flex gap-2">
              <input type="number" value={frameW} onChange={e => setFrameW(+e.target.value || 600)} className="flex-1 px-2.5 py-1.5 rounded-lg bg-[var(--input-bg)] border border-[var(--overlay-border)] text-xs text-[var(--text-primary)] focus:outline-none" placeholder="Width" />
              <span className="self-center text-[var(--text-muted)] text-xs">×</span>
              <input type="number" value={frameH} onChange={e => setFrameH(+e.target.value || 1600)} className="flex-1 px-2.5 py-1.5 rounded-lg bg-[var(--input-bg)] border border-[var(--overlay-border)] text-xs text-[var(--text-primary)] focus:outline-none" placeholder="Height" />
            </div>
          </div>
        )}

        {/* Tools */}
        <div>
          <label className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-1.5 block">Tools</label>
          <div className="flex gap-1.5">
            <button onClick={() => setTool('select')} className={`flex-1 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${tool === 'select' ? 'bg-[#3B82F6]/15 text-[#3B82F6] border border-[#3B82F6]/20' : 'bg-[var(--card-bg)] text-[var(--text-tertiary)] border border-[var(--overlay-border)] hover:bg-[var(--card-bg-hover)]'}`}>
              <MousePointer2 className="w-3.5 h-3.5" /> Select
            </button>
            <button onClick={() => setTool('draw')} className={`flex-1 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${tool === 'draw' ? 'bg-[#FF6B4A]/15 text-[#FF6B4A] border border-[#FF6B4A]/20' : 'bg-[var(--card-bg)] text-[var(--text-tertiary)] border border-[var(--overlay-border)] hover:bg-[var(--card-bg-hover)]'}`}>
              <Square className="w-3.5 h-3.5" /> Draw Slot
            </button>
          </div>
        </div>

        {/* Auto-detect */}
        {frameImg && (
          <div>
            <button onClick={handleAutoDetect} disabled={isDetecting}
              className="w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer bg-linear-to-r from-[#3B82F6] to-[#8B5CF6] text-white hover:opacity-90 disabled:opacity-50 shadow-lg shadow-[#3B82F6]/20">
              {isDetecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Scan className="w-4 h-4" />}
              {isDetecting ? 'Analyzing frame...' : '⚡ Auto-detect Slots'}
            </button>
            <p className="text-[9px] text-(--text-muted) mt-1 text-center">Scans for transparent regions in frame PNG</p>
          </div>
        )}

        {/* Snap & Grid */}
        <div>
          <label className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-1.5 block">Snap & Grid</label>
          <div className="flex gap-1.5 mb-2">
            <button onClick={() => setSnapEnabled(!snapEnabled)} className={`flex-1 py-2 rounded-lg text-[10px] font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer ${snapEnabled ? 'bg-[#3B82F6]/15 text-[#3B82F6] border border-[#3B82F6]/20' : 'bg-[var(--card-bg)] text-[var(--text-tertiary)] border border-[var(--overlay-border)]'}`}>
              <Magnet className="w-3 h-3" /> Snap {snapEnabled ? 'ON' : 'OFF'}
            </button>
            <button onClick={() => setShowGrid(!showGrid)} className={`flex-1 py-2 rounded-lg text-[10px] font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer ${showGrid ? 'bg-[#3B82F6]/15 text-[#3B82F6] border border-[#3B82F6]/20' : 'bg-[var(--card-bg)] text-[var(--text-tertiary)] border border-[var(--overlay-border)]'}`}>
              <Grid className="w-3 h-3" /> Grid {showGrid ? 'ON' : 'OFF'}
            </button>
          </div>
          {snapEnabled && (
            <div className="flex gap-1">
              {[5, 10, 25, 50].map(g => (
                <button key={g} onClick={() => setGridSize(g)} className={`flex-1 py-1.5 rounded-lg text-[10px] font-semibold transition-all cursor-pointer ${gridSize === g ? 'bg-[#3B82F6]/15 text-[#3B82F6] border border-[#3B82F6]/20' : 'bg-[var(--card-bg)] text-[var(--text-muted)] border border-[var(--overlay-border)]'}`}>
                  {g}px
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Layout Presets */}
        <div>
          <label className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-1.5 block">Layout Presets</label>
          <div className="grid grid-cols-3 gap-1.5 max-h-[200px] overflow-y-auto pr-0.5">
            {LAYOUT_PRESETS.map(preset => (
              <button key={preset.id} onClick={() => applyPreset(preset)}
                className="py-2.5 px-1.5 rounded-lg text-center transition-all cursor-pointer bg-[var(--card-bg)] border border-[var(--overlay-border)] hover:bg-[var(--card-bg-hover)] hover:border-[#3B82F6]/30 group">
                <span className="text-base block mb-0.5 group-hover:scale-110 transition-transform">{preset.emoji}</span>
                <span className="text-[9px] font-semibold text-[var(--text-secondary)] block leading-tight">{preset.name}</span>
                <span className="text-[8px] text-[var(--text-muted)] block leading-tight">{preset.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Selected slot properties */}
        {selectedSlot && (
          <div className="p-3 rounded-xl bg-[var(--card-bg)] border border-[#FF6B4A]/20 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-[#FF6B4A] uppercase tracking-wider">Slot {slots.indexOf(selectedSlot) + 1}</span>
              <div className="flex gap-1">
                <button onClick={() => duplicateSlot(selectedSlot.id)} className="p-1 rounded hover:bg-[var(--card-bg-hover)] transition-all cursor-pointer" title="Duplicate"><Copy className="w-3 h-3 text-[var(--text-muted)]" /></button>
                <button onClick={() => deleteSlot(selectedSlot.id)} className="p-1 rounded hover:bg-red-500/10 transition-all cursor-pointer" title="Delete"><Trash2 className="w-3 h-3 text-red-400" /></button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {(['x', 'y', 'w', 'h'] as const).map(key => (
                <label key={key} className="flex flex-col gap-0.5">
                  <span className="text-[9px] font-bold text-[var(--text-muted)] uppercase">{key === 'w' ? 'Width' : key === 'h' ? 'Height' : key.toUpperCase()}</span>
                  <input type="number" value={Math.round(selectedSlot[key])}
                    onChange={e => setSlots(prev => prev.map(s => s.id === selectedId ? { ...s, [key]: +e.target.value } : s))}
                    className="w-full min-w-0 px-2.5 py-1.5 rounded-lg bg-[var(--input-bg)] border border-[var(--overlay-border)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[#FF6B4A]/40" />
                </label>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-bold text-[var(--text-muted)] uppercase shrink-0">Radius</span>
              <input type="range" min={0} max={Math.min(selectedSlot.w, selectedSlot.h) / 2} value={selectedSlot.radius}
                onChange={e => setSlots(prev => prev.map(s => s.id === selectedId ? { ...s, radius: +e.target.value } : s))}
                className="flex-1 accent-[#FF6B4A]" />
              <span className="text-[10px] text-[var(--text-muted)] w-8 text-right font-mono">{selectedSlot.radius}px</span>
            </div>
          </div>
        )}

        {/* Slot list */}
        {slots.length > 0 && (
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-1.5 block">Slots ({slots.length})</label>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {slots.map((slot, i) => (
                <div key={slot.id} onClick={() => setSelectedId(slot.id)}
                  className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg cursor-pointer transition-all ${selectedId === slot.id ? 'bg-[#FF6B4A]/10 border border-[#FF6B4A]/20' : 'bg-[var(--card-bg)] border border-[var(--overlay-border)] hover:bg-[var(--card-bg-hover)]'}`}>
                  <GripVertical className="w-3 h-3 text-[var(--text-muted)]" />
                  <span className="text-[11px] font-medium text-[var(--text-secondary)] flex-1">Slot {i + 1}</span>
                  <span className="text-[10px] text-[var(--text-muted)]">{Math.round(slot.w)}×{Math.round(slot.h)}</span>
                  <button onClick={e => { e.stopPropagation(); deleteSlot(slot.id) }} className="cursor-pointer"><X className="w-3 h-3 text-[var(--text-tertiary)] hover:text-red-400" /></button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-2 pt-2 border-t border-[var(--overlay-border)]">
          <button onClick={() => setShowPreview(!showPreview)} className={`w-full py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${showPreview ? 'bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/20' : 'bg-[var(--card-bg)] text-[var(--text-secondary)] border border-[var(--overlay-border)] hover:bg-[var(--card-bg-hover)]'}`}>
            <Eye className="w-3.5 h-3.5" /> {showPreview ? 'Exit Preview' : 'Preview'}
          </button>
          <div className="flex gap-1.5">
            <Button onClick={saveTemplate} className="flex-1 gap-1.5" size="sm"><Save className="w-3.5 h-3.5" /> Save</Button>
            <Button onClick={saveToCloud} className="flex-1 gap-1.5" size="sm" disabled={isSavingCloud}>
              {isSavingCloud ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Cloud className="w-3.5 h-3.5" />} Cloud
            </Button>
          </div>

          {slots.length > 0 && (
            <button onClick={() => { setSlots([]); setSelectedId(null) }} className="w-full py-2 rounded-lg text-xs font-semibold text-red-400 hover:bg-red-500/10 transition-all cursor-pointer flex items-center justify-center gap-1.5">
              <RotateCcw className="w-3.5 h-3.5" /> Clear All Slots
            </button>
          )}
        </div>

        {/* Go to Photobooth after save (standalone only) */}
        {justSaved && !embedded && (
          <div className="p-3 rounded-xl bg-[#10B981]/10 border border-[#10B981]/20 space-y-2">
            <p className="text-xs font-semibold text-[#10B981]">✓ Template saved! Ready to use in Photobooth.</p>
            <Link href="/photobooth" className="w-full py-2.5 rounded-lg bg-[#FF6B4A] text-white text-xs font-bold flex items-center justify-center gap-2 hover:bg-[#FF6B4A]/90 transition-all">
              📸 Go to Photobooth
            </Link>
          </div>
        )}
        {justSaved && embedded && (
          <div className="p-3 rounded-xl bg-[#10B981]/10 border border-[#10B981]/20">
            <p className="text-xs font-semibold text-[#10B981]">✓ Frame saved! Close to use it.</p>
          </div>
        )}

        {/* Saved templates */}
        {savedTemplates.length > 0 && (
          <div className="pt-2 border-t border-[var(--overlay-border)]">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-1.5 block">Saved Templates</label>
            <div className="space-y-1.5 max-h-40 overflow-y-auto">
              {savedTemplates.map(t => (
                <div key={t.id} className="flex items-center gap-2 px-2.5 py-2 rounded-lg bg-[var(--card-bg)] border border-[var(--overlay-border)] hover:bg-[var(--card-bg-hover)] transition-all">
                  <button onClick={() => loadTemplate(t)} className="flex-1 text-left cursor-pointer">
                    <span className="text-[11px] font-medium text-[var(--text-secondary)] block">{t.name}</span>
                    <span className="text-[9px] text-[var(--text-muted)]">{t.slots.length} slots · {t.width}×{t.height}</span>
                  </button>
                  <button onClick={() => deleteTemplate(t.id)} className="p-1 rounded hover:bg-red-500/10 cursor-pointer"><X className="w-3 h-3 text-[var(--text-tertiary)]" /></button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ═══ CANVAS AREA ═══ */}
      <div className="flex-1 flex flex-col items-center justify-center p-0 lg:p-4 bg-[var(--canvas-bg)] relative" onClick={() => setShowExport(false)}>
        {/* Export Controls */}
        <div className="absolute top-6 right-6 z-50 flex flex-col items-end gap-2" onClick={e => e.stopPropagation()}>
          <button 
            title="Export"
            onClick={() => setShowExport(!showExport)} 
            className={`h-8 px-3 flex items-center justify-center gap-1.5 rounded-xl shadow-xl border transition-all cursor-pointer font-semibold text-[11px] ${showExport ? 'bg-[#FF6B4A] border-[#FF6B4A] text-white' : 'bg-[var(--panel-bg)] border-[var(--overlay-border)] text-[var(--text-secondary)] hover:bg-[var(--card-bg-hover)]'}`}
          >
            <Download className="w-4 h-4" /> Export
          </button>
          {showExport && (
            <div className="bg-[var(--panel-bg)] p-3 rounded-2xl shadow-xl border border-[var(--overlay-border)] w-48 animate-in fade-in slide-in-from-top-2">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-2 block">Standard Export</label>
              <div className="space-y-2">
                <button onClick={exportJSON} className="w-full py-2 rounded-lg bg-[var(--card-bg)] border border-[var(--overlay-border)] text-xs font-semibold text-[var(--text-secondary)] hover:bg-[var(--card-bg-hover)] transition-all cursor-pointer flex items-center justify-center gap-1.5"><Download className="w-3.5 h-3.5" /> JSON</button>
                {showPreview && (
                  <button onClick={exportPreview} className="w-full py-2 rounded-lg bg-[var(--card-bg)] border border-[var(--overlay-border)] text-xs font-semibold text-[var(--text-secondary)] hover:bg-[var(--card-bg-hover)] transition-all cursor-pointer flex items-center justify-center gap-1.5"><Download className="w-3.5 h-3.5" /> Preview PNG</button>
                )}
              </div>
            </div>
          )}
        </div>

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

        <div ref={containerRef} className="flex-1 w-full overflow-auto grid place-items-center p-4">
          <div className="relative shrink-0" style={{ width: frameW * scale, height: frameH * scale }}>
            <canvas ref={canvasRef}
              className={`shadow-2xl rounded-lg ${tool === 'draw' ? 'cursor-crosshair' : isDragging ? 'cursor-grabbing' : 'cursor-default'}`}
              style={{ width: frameW * scale, height: frameH * scale }}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerLeave={onPointerUp}
            />
            {/* Status bar */}
            <div className="absolute -bottom-8 left-0 right-0 flex items-center justify-between text-[10px] text-[var(--text-muted)]">
              <span>{frameW}×{frameH}px · {slots.length} {slots.length === 1 ? 'slot' : 'slots'}{snapEnabled ? ` · Grid ${gridSize}px` : ''}</span>
              <span>Zoom: {Math.round(zoom * 100)}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Guide Modal ─── */}
      {showGuide && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowGuide(false) }}
        >
          <div className="bg-(--panel-bg) border border-(--overlay-border) rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[88vh]">

            {/* Header */}
            <div className="flex items-center gap-3 p-4 border-b border-(--overlay-border)">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#3B82F6] to-[#8B5CF6] flex items-center justify-center shrink-0">
                <Info className="w-4.5 h-4.5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-sm text-(--text-primary) leading-tight">Hướng dẫn tạo Frame chuẩn</h3>
                <p className="text-[11px] text-(--text-muted) mt-0.5">Chọn cách phù hợp với bạn bên dưới</p>
              </div>
              <button
                onClick={() => setShowGuide(false)}
                className="w-7 h-7 flex items-center justify-center rounded-lg bg-(--card-bg) hover:bg-(--card-bg-hover) text-(--text-muted) transition-all cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="p-4 overflow-y-auto space-y-3">

              {/* Method 1 */}
              <div className="rounded-xl bg-(--card-bg) border border-(--overlay-border) p-3.5 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-base">🎨</span>
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#3B82F6]">Cách 1 — Canva / Figma (Khuyên dùng)</h4>
                </div>
                <p className="text-xs text-(--text-secondary) leading-relaxed">
                  Thiết kế khung với <b className="text-(--text-primary)">nền trong suốt (transparent)</b>. Các ô trống để ảnh sẽ tự nhận diện chính xác nhất.
                </p>
                <div className="space-y-1.5 text-xs text-(--text-muted)">
                  <div className="flex gap-2">
                    <span className="shrink-0 font-bold text-(--text-secondary)">Canva:</span>
                    <span>Khi tải xuống, chọn PNG và bật <span className="italic font-semibold text-(--text-primary)">&quot;Transparent background&quot;</span> (cần Canva Pro).</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="shrink-0 font-bold text-(--text-secondary)">Figma / PS:</span>
                    <span>Xuất file PNG với nền trong suốt bình thường là xong.</span>
                  </div>
                </div>
              </div>

              {/* Method 2 */}
              <div className="rounded-xl bg-(--card-bg) border border-(--overlay-border) p-3.5 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-base">🤖</span>
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#FF6B4A]">Cách 2 — Dùng AI tạo ảnh</h4>
                </div>
                <p className="text-xs text-(--text-secondary) leading-relaxed">
                  AI không xuất được nền trong suốt, hãy yêu cầu AI tạo khoảng trống <b className="text-(--text-primary)">màu trắng tinh</b>. App sẽ tự nhận diện và biến chúng thành slot.
                </p>

                {/* Prompt box */}
                <div className="rounded-lg bg-(--background) border border-(--overlay-border) p-3 space-y-1.5">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-(--text-muted) flex items-center gap-1">
                    <span>💡</span> Prompt mẫu (copy & paste):
                  </p>
                  <p className="text-[11px] text-(--text-secondary) italic leading-relaxed select-all cursor-text">
                    A photobooth frame template, cosmic space theme, with completely solid WHITE rectangular photo slots in a 3x2 grid. Decorated with astronauts and planets. Photo slots MUST be totally plain white. 2d flat vector illustration --ar 2:3
                  </p>
                </div>
              </div>

            </div>

            {/* Footer */}
            <div className="p-4 border-t border-(--overlay-border)">
              <button
                onClick={() => setShowGuide(false)}
                className="w-full py-2.5 rounded-xl text-xs font-bold text-white transition-all cursor-pointer bg-linear-to-r from-[#FF6B4A] to-[#FF8B6A] hover:opacity-90 shadow-lg shadow-[#FF6B4A]/20"
              >
                Đã hiểu! Bắt đầu tạo frame 🚀
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Canvas helpers ──────────────────────────────────────────
function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}
