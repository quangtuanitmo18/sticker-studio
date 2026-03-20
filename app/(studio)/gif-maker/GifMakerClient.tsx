'use client'

import React, { useState, useRef, useCallback, useEffect } from 'react'
import { Upload, Video, Image as ImageIcon, Sparkles, Scissors, Type, Smile, Frame, Settings, Save, Trash2, X } from 'lucide-react'
import { loadVideo, VideoMetadata, TrimRange, extractFramesForGif, TextOverlay, StickerOverlay, captureFrameAsDataUrl, TEXT_ANIMATION_PRESETS } from '@/lib/video-processor'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/toast'
import { Slider } from '@/components/ui/slider'
import VideoPreview from './VideoPreview'
import TextTab from './components/TextTab'
import StickersTab from './components/StickersTab'
import ExportTab from './components/ExportTab'
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

  const [activeTab, setActiveTab] = useState<'trim' | 'text' | 'stickers' | 'export'>('trim')
  
  const containerRef = useRef<HTMLDivElement>(null)
  
  // Use state instead of ref for videoEl so React re-renders when the node attaches
  const [videoEl, setVideoEl] = useState<HTMLVideoElement | null>(null)
  const timeDisplayRef = useRef<HTMLSpanElement>(null)

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
      <aside className="w-80 border-r border-[var(--overlay-border)] bg-[var(--card-bg)] flex flex-col z-10">
        {/* Header */}
        <div className="p-4 border-b border-[var(--overlay-border)] flex items-center justify-between">
          <h2 className="font-semibold text-[var(--text-primary)]">Settings</h2>
          <Button variant="ghost" size="sm" onClick={resetAll} className="h-8 text-[var(--text-muted)] hover:text-red-400 gap-1.5 focus:outline-none">
            <Trash2 className="w-4 h-4" />
            Clear
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[var(--overlay-border)]">
          {(['trim', 'text', 'stickers', 'export'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors capitalize ${activeTab === tab ? 'border-[#FF6B4A] text-[#FF6B4A]' : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          {activeTab === 'trim' && (
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">AI Highlight</label>
                <p className="text-[10px] text-[var(--text-muted)] mb-3">
                  Let AI find the best 3-5 seconds of your video to turn into a GIF.
                </p>
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

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">Manual Trim</label>
                  <p className="text-[10px] text-[var(--text-muted)] mb-3">
                    Adjust the start and end time of your GIF.
                  </p>
                  <div className="flex flex-col gap-5 bg-[var(--card-bg)] p-4 rounded-md border border-[var(--overlay-border)]">
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
                </div>

                <div className="space-y-2 pt-4 border-t border-[var(--overlay-border)]">
                  <Slider
                    label="Playback Speed"
                    min={0.5}
                    max={3.0}
                    step={0.1}
                    value={speed}
                    onChange={(val) => setSpeed(val)}
                    unit="x"
                  />
                  <div className="flex justify-between text-[10px] text-[var(--text-muted)] px-1">
                    <span>0.5x</span>
                    <span>1x</span>
                    <span>3x</span>
                  </div>
                </div>

                <div className="space-y-2 pt-4 border-t border-[var(--overlay-border)]">
                  <label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">Dimensions</label>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-[var(--card-bg)] border border-[var(--overlay-border)] rounded-md p-2 flex flex-col items-center">
                      <span className="text-[10px] text-[var(--text-muted)] uppercase">Width</span>
                      <span className="text-sm font-medium">{metadata.width}px</span>
                    </div>
                    <div className="bg-[var(--card-bg)] border border-[var(--overlay-border)] rounded-md p-2 flex flex-col items-center">
                      <span className="text-[10px] text-[var(--text-muted)] uppercase">Height</span>
                      <span className="text-sm font-medium">{metadata.height}px</span>
                    </div>
                  </div>
                </div>
                <div className="text-xs text-center text-[var(--text-muted)] mt-2">
                  Duration: {((trim.end - trim.start) / speed).toFixed(1)}s
                </div>
              </div>
            </div>
          )}

          {activeTab === 'text' && (
            <TextTab textOverlays={textOverlays} setTextOverlays={setTextOverlays} />
          )}

          {activeTab === 'stickers' && (
            <StickersTab stickerOverlays={stickerOverlays} setStickerOverlays={setStickerOverlays} />
          )}

          {activeTab === 'export' && (
            <ExportTab isLoading={isLoading} onExport={() => handleExport(videoEl)} />
          )}
        </div>
      </aside>

      {/* Main Preview Area */}
      <main className="flex-1 flex flex-col bg-[var(--background)] relative min-w-0">
        <div className="flex-1 p-6 flex flex-col items-center justify-center relative min-h-0 bg-[var(--background)]">

          {/* Main Video Element wrapped in a container to maintain aspect ratio */}
          <div className="relative max-w-full max-h-full rounded-lg overflow-hidden border border-[var(--overlay-border)] shadow-xl bg-black">
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
        <div className="h-32 border-t border-[var(--overlay-border)] bg-[var(--card-bg)] p-4 flex-shrink-0">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">Timeline</span>
            <span ref={timeDisplayRef} className="text-xs tabular-nums text-[var(--text-secondary)]">
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


