'use client'

import React, { useRef, useEffect, useCallback, useState } from 'react'
import OverlayCanvas, { type CanvasElement, type OverlayCanvasHandle } from '@/components/shared/OverlayCanvas'

// Re-export CanvasElement for backward-compat imports
export type { CanvasElement } from '@/components/shared/OverlayCanvas'

interface CanvasEditorProps {
  elements: CanvasElement[]
  setElements: React.Dispatch<React.SetStateAction<CanvasElement[]>>
  selectedId: string | null
  setSelectedId: (id: string | null) => void
  onExport: (dataUrl: string) => void
  width: number
  height: number
}

export default function CanvasEditor({ elements, setElements, selectedId, setSelectedId, onExport, width, height }: CanvasEditorProps) {
  const overlayRef = useRef<OverlayCanvasHandle>(null)

  // Expose global export function that MakerClient calls
  useEffect(() => {
    (window as any).exportCanvas = async () => {
      if (overlayRef.current) {
        const dataUrl = await overlayRef.current.exportOverlay()
        onExport(dataUrl)
      }
    }
    return () => { delete (window as any).exportCanvas }
  }, [onExport])

  return (
    <OverlayCanvas
      ref={overlayRef}
      elements={elements}
      setElements={setElements}
      selectedId={selectedId}
      setSelectedId={setSelectedId}
      width={width}
      height={height}
      overlay={false}
      className="bg-[#141211] rounded-xl overflow-hidden border border-stone-800/60"
    />
  )
}
