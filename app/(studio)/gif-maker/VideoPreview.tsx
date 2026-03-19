'use client'

import React, { useEffect, useState, useRef, useCallback } from 'react'
import { generateThumbnails } from '@/lib/video-processor'

interface VideoPreviewProps {
  videoElement: HTMLVideoElement | null
  duration: number
  currentTime: number
  trimStart: number
  trimEnd: number
  onTrimChange: (start: number, end: number) => void
  onSeek: (time: number) => void
}

export default function VideoPreview({
  videoElement,
  duration,
  currentTime,
  trimStart,
  trimEnd,
  onTrimChange,
  onSeek
}: VideoPreviewProps) {
  const [thumbnails, setThumbnails] = useState<string[]>([])
  const containerRef = useRef<HTMLDivElement>(null)
  const [dragging, setDragging] = useState<'start' | 'end' | null>(null)

  useEffect(() => {
    if (!videoElement || duration === 0) return
    let isMounted = true

    const generate = async () => {
      // Slight delay to ensure DOM layout is complete for container width
      await new Promise(r => setTimeout(r, 50))
      if (!isMounted) return

      let width = 800
      if (containerRef.current) {
        width = containerRef.current.clientWidth || 800
      }

      // Safe Aspect Ratio fallback
      const vw = videoElement.videoWidth || 1920
      const vh = videoElement.videoHeight || 1080
      const ar = vw / vh

      // Calculate perfect amount of thumbnails to not stretch them
      const visualHeight = 48
      const thumbVisualWidth = visualHeight * ar
      const count = Math.min(Math.max(Math.ceil(width / thumbVisualWidth), 8), 40) // 8 to 40 frames max

      // Retina display support for crisp thumbnails
      const dpr = window.devicePixelRatio || 1
      const extractHeight = visualHeight * dpr

      const thumbs = await generateThumbnails(videoElement, count, extractHeight)
      if (isMounted) setThumbnails(thumbs)
    }

    generate()

    return () => {
      isMounted = false
    }
  }, [videoElement, duration])

  const handlePointerMove = useCallback((e: PointerEvent) => {
    if (!dragging || !containerRef.current || duration === 0) return
    const rect = containerRef.current.getBoundingClientRect()
    const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left))
    const timeAtX = (x / rect.width) * duration

    if (dragging === 'start') {
      const newStart = Math.min(timeAtX, trimEnd - 0.5) // Min 0.5s duration
      onTrimChange(newStart, trimEnd)
      onSeek(newStart)
    } else {
      const newEnd = Math.max(timeAtX, trimStart + 0.5)
      onTrimChange(trimStart, newEnd)
      onSeek(newEnd)
    }
  }, [dragging, duration, trimStart, trimEnd, onTrimChange, onSeek])

  const handlePointerUp = useCallback(() => {
    setDragging(null)
  }, [])

  useEffect(() => {
    if (dragging) {
      window.addEventListener('pointermove', handlePointerMove)
      window.addEventListener('pointerup', handlePointerUp)
    } else {
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handlePointerUp)
    }
    return () => {
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handlePointerUp)
    }
  }, [dragging, handlePointerMove, handlePointerUp])

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current || duration === 0) return
    const rect = containerRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const percent = Math.max(0, Math.min(1, x / rect.width))
    onSeek(percent * duration)
  }

  const playheadRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!videoElement || duration === 0) return
    let animId: number
    const updatePlayhead = () => {
      if (playheadRef.current) {
        // Sync local playhead directly with video for 60fps smoothness
        const pct = (videoElement.currentTime / duration) * 100
        playheadRef.current.style.left = `${pct}%`
      }
      animId = requestAnimationFrame(updatePlayhead)
    }
    animId = requestAnimationFrame(updatePlayhead)
    return () => cancelAnimationFrame(animId)
  }, [videoElement, duration])

  if (duration === 0) return null

  // Calculate percentages statically for the trim boundaries
  const trimStartPct = (trimStart / duration) * 100
  const trimEndPct = (trimEnd / duration) * 100

  // Fallback initial current time
  const currentPct = (currentTime / duration) * 100

  return (
    <div className="relative h-12 bg-white/5 rounded-md border border-white/10 overflow-hidden group select-none">
      {/* Thumbnails */}
      <div className="absolute inset-0 flex overflow-hidden rounded opacity-80 pointer-events-none bg-black">
        {thumbnails.length > 0 ? (
          thumbnails.map((src, i) => (
            <img 
              key={i} 
              src={src || ''} 
              className="h-full object-cover shrink-0 relative" 
              style={{ width: `${100 / thumbnails.length}%` }} 
              alt="" 
            />
          ))
        ) : (
          <div className="w-full h-full flex items-center justify-center text-xs text-white/30 truncate px-2">
            Loading timeline...
          </div>
        )}
      </div>

      {/* Clickable Area for Seeking */}
      <div 
        ref={containerRef}
        className="absolute inset-0 z-20 cursor-pointer" 
        onClick={handleTimelineClick}
      />

      {/* Active Trim Overlay */}
      <div 
        className="absolute inset-y-0 bg-blue-500/20 border-y-2 border-blue-500 pointer-events-none z-10"
        style={{ left: `${trimStartPct}%`, width: `${trimEndPct - trimStartPct}%` }}
      />

      {/* Excluded regions darkening */}
      <div 
        className="absolute inset-y-0 left-0 bg-black/60 pointer-events-none z-10"
        style={{ width: `${trimStartPct}%` }}
      />
      <div 
        className="absolute inset-y-0 right-0 bg-black/60 pointer-events-none z-10"
        style={{ width: `${100 - trimEndPct}%` }}
      />

      {/* Trim Handles */}
      <div 
        className="absolute top-0 bottom-0 w-3 bg-white rounded-r-none z-30 transform -translate-x-full cursor-ew-resize flex items-center justify-center hover:scale-x-125 transition-transform"
        style={{ left: `${trimStartPct}%` }}
        onPointerDown={(e) => { e.stopPropagation(); setDragging('start') }}
      >
        <div className="w-0.5 h-4 bg-black/30 rounded-full" />
      </div>
      <div 
        className="absolute top-0 bottom-0 w-3 bg-white rounded-l-none z-30 cursor-ew-resize flex items-center justify-center hover:scale-x-125 transition-transform"
        style={{ left: `${trimEndPct}%` }}
        onPointerDown={(e) => { e.stopPropagation(); setDragging('end') }}
      >
        <div className="w-0.5 h-4 bg-black/30 rounded-full" />
      </div>

      {/* Current Time Playhead */}
      <div 
        ref={playheadRef}
        className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-40 transform -translate-x-1/2 shadow-[0_0_8px_rgba(239,68,68,0.8)] pointer-events-none"
        style={{ left: `${currentPct}%` }}
      >
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 border-4 border-transparent border-t-red-500" />
      </div>
    </div>
  )
}
