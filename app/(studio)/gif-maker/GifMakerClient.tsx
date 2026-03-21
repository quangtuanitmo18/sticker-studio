'use client'

import React, { useState, useRef, useCallback, useEffect } from 'react'
import { Download, Video, Sparkles, Trash2, Plus, Minus, Undo2, Redo2 } from 'lucide-react'
import { captureFrameAsDataUrl } from '@/lib/video-processor'
import type { ExportFormat } from '@/components/shared/ExportFormatPanel'
import { ExportFormatPanel } from '@/components/shared/ExportFormatPanel'
import { SidebarHeader } from '@/components/shared/SidebarHeader'
import { SidebarTabStrip } from '@/components/shared/SidebarTabStrip'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/toast'
import { Slider } from '@/components/ui/slider'
import { useHistory } from '@/hooks/use-history'
import type { TextOverlay, StickerOverlay } from '@/lib/video-processor'
import VideoPreview from './VideoPreview'
import TextTab from './components/TextTab'
import StickersTab from './components/StickersTab'
import { useGifMaker } from './hooks/useGifMaker'
import EmptyState from './components/EmptyState'

export default function GifMakerClient() {
  const { toast } = useToast()
  const {
    videoFile, videoUrl, metadata, isLoading, remoteUrl, setIsLoading,
    setRemoteUrl, handleFileUpload, handleUrlSubmit,
    trim, setTrim, currentTime, setCurrentTime, speed, setSpeed,
    textOverlays, setTextOverlays, stickerOverlays, setStickerOverlays,
    draggingTextId, setDraggingTextId, handleExport, resetAll
  } = useGifMaker()

  const [activeTab, setActiveTab] = useState<'trim' | 'text' | 'stickers'>('trim')
  const [showExport, setShowExport] = useState(false)
  const [exportFormat, setExportFormat] = useState<ExportFormat>('png' as any)
  const [zoom, setZoom] = useState(1)

  // Overlay history for undo/redo
  type OverlaySnapshot = { text: TextOverlay[]; stickers: StickerOverlay[] }
  const history = useHistory<OverlaySnapshot>({ text: [], stickers: [] })
  
  const containerRef = useRef<HTMLDivElement>(null)
  const [videoEl, setVideoEl] = useState<HTMLVideoElement | null>(null)
  const timeDisplayRef = useRef<HTMLSpanElement>(null)

  // Helpers to push history before mutations
  const handleSetTextOverlays = (updater: React.SetStateAction<TextOverlay[]>) => {
    const next = typeof updater === 'function' ? updater(textOverlays) : updater
    history.set({ text: textOverlays, stickers: stickerOverlays })
    setTextOverlays(next)
  }

  const handleSetStickerOverlays = (updater: React.SetStateAction<StickerOverlay[]>) => {
    const next = typeof updater === 'function' ? updater(stickerOverlays) : updater
    history.set({ text: textOverlays, stickers: stickerOverlays })
    setStickerOverlays(next)
  }

  const handleUndo = () => {
    history.undo()
  }

  const handleRedo = () => {
    history.redo()
  }

  useEffect(() => {
    if (videoEl) {
      videoEl.playbackRate = speed
    }
  }, [speed, videoUrl, videoEl])

  useEffect(() => {
    if (!metadata || !videoEl) return
    let animId: number
    const updateTimeDisplay = () => {
      if (videoEl && timeDisplayRef.current) {
        const t = videoEl.currentTime / speed
        const d = metadata.duration / speed
        timeDisplayRef.current.innerText = `${t.toFixed(1)}s / ${d.toFixed(1)}s`
      }
      animId = requestAnimationFrame(updateTimeDisplay)
    }
    animId = requestAnimationFrame(updateTimeDisplay)
    return () => cancelAnimationFrame(animId)
  }, [metadata, speed, videoEl])

  if (!videoFile || !metadata) {
    return (
      <EmptyState
        onFileUpload={handleFileUpload}
        remoteUrl={remoteUrl}
        setRemoteUrl={setRemoteUrl}
        onUrlSubmit={handleUrlSubmit}
        isLoading={isLoading}
      />
    )
  }

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden">
      {/* Sidebar Tool panel */}
      <aside className="w-80 border-r border-(--overlay-border) bg-(--panel-bg) flex flex-col z-10">
        {/* Header */}
        <div className="p-4 pb-3 border-b border-(--overlay-border)">
          <SidebarHeader
            gradient="from-[#10B981] to-[#3B82F6]"
            icon={<Video className="w-4.5 h-4.5 text-white" />}
            title="GIF Maker"
            subtitle="Convert video to animated GIF"
            onReset={resetAll}
            className="mb-3"
          />
          <SidebarTabStrip
            tabs={[
              { id: 'trim', label: 'Trim' },
              { id: 'text', label: 'Text' },
              { id: 'stickers', label: 'Stickers' },
            ]}
            active={activeTab}
            onChange={(id) => setActiveTab(id as typeof activeTab)}
            accentColor="#10B981"
          />
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {activeTab === 'trim' && (
            <div className="space-y-4">
              {/* AI Highlight */}
              <div className="space-y-2">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-(--text-muted) block">AI Highlight</label>
                <p className="text-xs text-(--text-muted)">Let AI find the best 3–5 seconds to turn into a GIF.</p>
                <Button
                  variant="secondary"
                  className="w-full gap-2"
                  disabled={isLoading}
                  onClick={async () => {
                    if (!videoEl || !metadata) return
                    setIsLoading(true)
                    const toastId = toast('Analyzing video frames with AI...', 'info')
                    try {
                      const duration = metadata.duration
                      const interval = duration / 6
                      const frames = []
                      for (let i = 0; i < 6; i++) {
                        const frameData = await captureFrameAsDataUrl(videoEl, i * interval, 512)
                        frames.push(frameData)
                      }

                      const res = await fetch('/api/analyze-video', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ frames, duration })
                      })
                      const data = await res.json()
                      if (res.ok) {
                        toast(`AI Highlight: ${data.reason}`, 'success')
                        setTrim({ start: data.start, end: data.end })
                        if (videoEl) videoEl.currentTime = data.start
                      } else {
                        toast(data.error || 'AI analysis failed', 'error')
                      }
                    } catch (err) {
                      toast('AI highlight failed to connect.', 'error')
                    } finally {
                      setIsLoading(false)
                    }
                  }}
                >
                  {isLoading ? <Sparkles className="w-4 h-4 animate-spin text-blue-400" /> : <Sparkles className="w-4 h-4" />}
                  Auto-Detect Highlight
                </Button>
              </div>

              {/* Manual Trim */}
              <div className="rounded-xl bg-(--card-bg) border border-(--overlay-border) p-3.5 space-y-4">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-(--text-muted) block">Manual Trim</label>
                <Slider
                  label="Start"
                  min={0}
                  max={metadata.duration}
                  step={0.1}
                  value={Number(trim.start.toFixed(1))}
                  onChange={(val) => setTrim(prev => ({ ...prev, start: Math.min(val, prev.end - 0.5) }))}
                  unit="s"
                />
                <Slider
                  label="End"
                  min={0}
                  max={metadata.duration}
                  step={0.1}
                  value={Number(trim.end.toFixed(1))}
                  onChange={(val) => setTrim(prev => ({ ...prev, end: Math.max(val, prev.start + 0.5) }))}
                  unit="s"
                />
              </div>

              {/* Speed */}
              <div className="rounded-xl bg-(--card-bg) border border-(--overlay-border) p-3.5 space-y-2">
                <Slider
                  label="Playback Speed"
                  min={0.5}
                  max={3.0}
                  step={0.1}
                  value={speed}
                  onChange={(val) => setSpeed(val)}
                  unit="x"
                />
                <div className="flex justify-between text-[10px] text-(--text-muted) px-1">
                  <span>0.5x</span><span>1x</span><span>3x</span>
                </div>
              </div>

              {/* Dimensions */}
              <div className="space-y-2">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-(--text-muted) block">Dimensions</label>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-(--card-bg) border border-(--overlay-border) rounded-xl p-2 flex flex-col items-center">
                    <span className="text-[10px] text-(--text-muted) uppercase">Width</span>
                    <span className="text-sm font-semibold text-(--text-primary)">{metadata.width}px</span>
                  </div>
                  <div className="bg-(--card-bg) border border-(--overlay-border) rounded-xl p-2 flex flex-col items-center">
                    <span className="text-[10px] text-(--text-muted) uppercase">Height</span>
                    <span className="text-sm font-semibold text-(--text-primary)">{metadata.height}px</span>
                  </div>
                </div>
                <div className="text-xs text-center text-(--text-muted)">
                  Duration: {((trim.end - trim.start) / speed).toFixed(1)}s
                </div>
              </div>
            </div>
          )}

          {activeTab === 'text' && (
            <TextTab textOverlays={textOverlays} setTextOverlays={handleSetTextOverlays} />
          )}

          {activeTab === 'stickers' && (
            <StickersTab stickerOverlays={stickerOverlays} setStickerOverlays={handleSetStickerOverlays} />
          )}
        </div>
      </aside>

      {/* Main Preview Area */}
      <main className="flex-1 flex flex-col bg-(--background) relative min-w-0" onClick={() => setShowExport(false)}>
        <div className="flex-1 p-6 flex flex-col items-center justify-center relative min-h-0 bg-(--background)">

          {/* ─── Floating Export Controls (top-right) ─── */}
          <div className="absolute top-6 right-6 z-50 flex flex-col items-end gap-2" onClick={e => e.stopPropagation()}>
            <button
              title="Export GIF"
              disabled={!videoEl || isLoading}
              onClick={() => setShowExport(v => !v)}
              className={`h-8 px-3 flex items-center justify-center gap-1.5 rounded-xl shadow-xl border transition-all font-semibold text-[11px] ${!videoEl || isLoading ? 'opacity-40 cursor-not-allowed bg-(--panel-bg) border-(--overlay-border) text-(--text-muted)' : showExport ? 'bg-[#10B981] border-[#10B981] text-white cursor-pointer' : 'bg-(--panel-bg) border-(--overlay-border) text-(--text-secondary) hover:bg-(--card-bg-hover) cursor-pointer'}`}
            >
              <Download className="w-4 h-4" /> Export GIF
            </button>
            {showExport && videoEl && (
              <div className="bg-(--panel-bg) p-3 rounded-2xl shadow-xl border border-(--overlay-border) w-52 animate-in fade-in slide-in-from-top-2">
                <button
                  className="w-full py-3 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 transition-all cursor-pointer bg-linear-to-r from-[#10B981] to-[#3B82F6] hover:opacity-90 shadow-lg shadow-[#10B981]/20 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isLoading}
                  onClick={() => { setShowExport(false); handleExport(videoEl) }}
                >
                  {isLoading ? <Download className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                  {isLoading ? 'Processing...' : 'Generate & Save GIF'}
                </button>
              </div>
            )}
          </div>

          {/* ─── Floating Canvas Controls (bottom-right) ─── */}
          <div className="absolute bottom-6 right-6 z-50 flex flex-col gap-3">
            {/* Undo / Redo */}
            <div className="flex flex-col gap-2 bg-(--panel-bg) p-2 rounded-2xl shadow-lg border border-(--overlay-border)">
              <button title="Undo" onClick={handleUndo} disabled={!history.canUndo} className="w-8 h-8 flex items-center justify-center rounded-xl bg-(--card-bg) hover:bg-(--card-bg-hover) text-(--text-secondary) transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed">
                <Undo2 className="w-4 h-4" />
              </button>
              <button title="Redo" onClick={handleRedo} disabled={!history.canRedo} className="w-8 h-8 flex items-center justify-center rounded-xl bg-(--card-bg) hover:bg-(--card-bg-hover) text-(--text-secondary) transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed">
                <Redo2 className="w-4 h-4" />
              </button>
            </div>
            {/* Zoom */}
            <div className="flex flex-col gap-2 bg-(--panel-bg) p-2 rounded-2xl shadow-xl border border-(--overlay-border)">
              <button onClick={() => setZoom(z => Math.min(z + 0.1, 3))} className="w-8 h-8 flex items-center justify-center rounded-xl bg-(--card-bg) hover:bg-(--card-bg-hover) text-(--text-secondary) transition-all cursor-pointer">
                <Plus className="w-4 h-4" />
              </button>
              <div className="text-[10px] font-bold text-center text-(--text-muted) w-8 tabular-nums">{Math.round(zoom * 100)}%</div>
              <button onClick={() => setZoom(z => Math.max(z - 0.1, 0.5))} className="w-8 h-8 flex items-center justify-center rounded-xl bg-(--card-bg) hover:bg-(--card-bg-hover) text-(--text-secondary) transition-all cursor-pointer">
                <Minus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Main Video Element */}
          <div
            className="relative max-w-full max-h-full rounded-xl overflow-hidden border border-(--overlay-border) shadow-xl bg-black"
            style={{ transform: `scale(${zoom})`, transformOrigin: 'center center', transition: 'transform 0.15s ease' }}
          >
            <video
              ref={setVideoEl}
              src={videoUrl}
              className="w-full h-full object-contain max-h-[60vh]"
              controls={false}
              autoPlay
              muted
              loop
            />

            {/* Overlays rendering layer (Text/Stickers) */}
            <div
              ref={containerRef}
              className="absolute inset-0 pointer-events-auto overflow-hidden flex items-center justify-center touch-none"
              onClick={() => {
                if (draggingTextId) return // Avoid pause when dragging
                if (videoEl) {
                  videoEl.currentTime = trim.start
                  videoEl.play()
                }
              }}
              onPointerMove={(e) => {
                if (!draggingTextId || !containerRef.current) return
                const rect = containerRef.current.getBoundingClientRect()
                const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
                const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height))

                // Determine if we are dragging a text OR a sticker
                if (draggingTextId.startsWith('text-')) {
                  const id = draggingTextId.replace('text-', '')
                  setTextOverlays(prev => prev.map(t => t.id === id ? { ...t, x, y } : t))
                } else if (draggingTextId.startsWith('sticker-')) {
                  const id = draggingTextId.replace('sticker-', '')
                  setStickerOverlays(prev => prev.map(s => s.id === id ? { ...s, x, y } : s))
                }
              }}
              onPointerUp={() => setDraggingTextId(null)}
              onPointerLeave={() => setDraggingTextId(null)}
            >
              <style dangerouslySetInnerHTML={{
                __html: `
                  @keyframes text-bounce { 0%, 100% { transform: translate(-50%, calc(-50% - 20px)); } 50% { transform: translate(-50%, -50%); } }
                  @keyframes text-fade { 0%, 100% { opacity: 0.3; } 50% { opacity: 1; } }
                  @keyframes text-slide { 0% { transform: translate(calc(-50% + 200px), -50%); opacity: 0; } 30%, 100% { transform: translate(-50%, -50%); opacity: 1; } }
                  @keyframes text-glow { 0%, 100% { transform: translate(-50%, -50%) scale(1); } 50% { transform: translate(-50%, -50%) scale(1.12); } }
                  @keyframes text-shake { 0%, 100% { transform: translate(-50%, -50%) rotate(0deg); } 25% { transform: translate(calc(-50% + 8px), -50%) rotate(5deg); } 75% { transform: translate(calc(-50% - 8px), -50%) rotate(-5deg); } }
                  @keyframes text-wave { 0%, 100% { transform: translate(-50%, -50%) rotate(0deg); } 25% { transform: translate(-50%, calc(-50% - 15px)) rotate(10deg); } 75% { transform: translate(-50%, calc(-50% + 15px)) rotate(-10deg); } }
                  @keyframes text-zoom { 0% { transform: translate(-50%, -50%) scale(0); opacity: 0; } 30%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 1; } }
                  @keyframes text-typewriter { 0% { clip-path: inset(0 100% 0 0); } 50%, 100% { clip-path: inset(0 -10% 0 0); } }
                `}} />
              {textOverlays.map((layer) => {
                const getPreviewAnimationStyles = (preset: string | undefined): React.CSSProperties => {
                  switch (preset) {
                    case 'bounce': return { animation: 'text-bounce 2s infinite' }
                    case 'fade': return { animation: 'text-fade 2s infinite' }
                    case 'slide': return { animation: 'text-slide 3s infinite' }
                    case 'glow': return { animation: 'text-glow 2s infinite' }
                    case 'shake': return { animation: 'text-shake 0.5s infinite' }
                    case 'wave': return { animation: 'text-wave 2s infinite' }
                    case 'zoom': return { animation: 'text-zoom 3s infinite' }
                    case 'typewriter': return { animation: 'text-typewriter 3s steps(20, end) infinite' }
                    default: return {}
                  }
                }

                return (
                  <div
                    key={layer.id}
                    className={`absolute transform -translate-x-1/2 -translate-y-1/2 select-none pointer-events-auto p-2 rounded transition-colors ${draggingTextId === layer.id ? 'opacity-70 cursor-grabbing ring-2 ring-blue-500 bg-black/10' : 'cursor-grab hover:ring-2 hover:ring-blue-500/50'
                      }`}
                    style={{
                      left: `${layer.x * 100}%`,
                      top: `${layer.y * 100}%`,
                      fontSize: `${layer.fontSize}px`,
                      fontFamily: layer.fontFamily,
                      color: layer.fill,
                      WebkitTextStroke: layer.strokeWidth > 0 ? `${layer.strokeWidth}px ${layer.stroke}` : undefined,
                      fontWeight: 'bold',
                      textAlign: 'center',
                      lineHeight: 1.1,
                      textShadow: '0 2px 8px rgba(0,0,0,0.5)',
                      ...getPreviewAnimationStyles(layer.animationPreset)
                    }}
                    onPointerDown={(e) => { e.stopPropagation(); setDraggingTextId(`text-${layer.id}`) }}
                  >
                    {layer.text}
                  </div>
                )
              })}

              {/* Stickers rendering */}
              {stickerOverlays.map((layer) => (
                <div
                  key={layer.id}
                  className="absolute cursor-move select-none flex items-center justify-center"
                  style={{
                    left: `${layer.x * 100}%`,
                    top: `${layer.y * 100}%`,
                    transform: 'translate(-50%, -50%)',
                    width: `${layer.size}%`,
                    height: `${layer.size}%`,
                    zIndex: 25,
                  }}
                  onPointerDown={(e) => {
                    e.stopPropagation()
                    setDraggingTextId(`sticker-${layer.id}`)
                  }}
                >
                  <img src={layer.src} alt="" className="w-full h-full object-contain pointer-events-none" />
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Timeline Footer */}
        <div className="h-32 border-t border-(--overlay-border) bg-(--card-bg) p-4 shrink-0">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-(--text-muted)">Timeline</span>
            <span ref={timeDisplayRef} className="text-xs tabular-nums text-(--text-secondary)">
              {metadata ? `${(currentTime / speed).toFixed(1)}s / ${(metadata.duration / speed).toFixed(1)}s` : '0.0s / 0.0s'}
            </span>
          </div>

          {/* Timeline Scrubber UI */}
          {videoEl && metadata && (
            <VideoPreview
              videoElement={videoEl}
              duration={metadata.duration}
              currentTime={currentTime}
              trimStart={trim.start}
              trimEnd={trim.end}
              onTrimChange={(start, end) => setTrim({ start, end })}
              onSeek={(time) => {
                if (videoEl) videoEl.currentTime = time
              }}
            />
          )}
        </div>
      </main>
    </div>
  )
}


