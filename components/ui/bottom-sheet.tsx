'use client'

import React, { useCallback, useRef, useState } from 'react'

interface BottomSheetProps {
  children: React.ReactNode
  /** Height when collapsed — shows drag handle + peek content */
  peekHeight?: number
  /** Height when expanded as percentage of viewport */
  expandedHeight?: string
  /** Whether the sheet is visible */
  open?: boolean
  /** Optional class for the sheet container */
  className?: string
}

/**
 * Mobile-only bottom sheet with drag-to-expand/collapse.
 * Hidden on lg+ screens (desktop keeps sidebar layout).
 */
export function BottomSheet({
  children,
  peekHeight = 56,
  expandedHeight = '70vh',
  open = true,
  className = '',
}: BottomSheetProps) {
  const [expanded, setExpanded] = useState(false)
  const sheetRef = useRef<HTMLDivElement>(null)
  const dragStartY = useRef(0)
  const dragStartHeight = useRef(0)

  const handleDragStart = useCallback((e: React.PointerEvent) => {
    e.preventDefault()
    dragStartY.current = e.clientY
    const sheet = sheetRef.current
    if (sheet) dragStartHeight.current = sheet.getBoundingClientRect().height
    const onMove = (ev: PointerEvent) => {
      const delta = dragStartY.current - ev.clientY
      if (Math.abs(delta) > 30) {
        setExpanded(delta > 0)
      }
    }
    const onUp = () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }, [])

  if (!open) return null

  return (
    <div
      ref={sheetRef}
      className={`lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-[var(--panel-bg)] border-t border-[var(--overlay-border)] rounded-t-2xl shadow-[0_-4px_30px_rgba(0,0,0,0.3)] transition-[height] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] flex flex-col ${className}`}
      style={{ height: expanded ? expandedHeight : `${peekHeight}px` }}
    >
      {/* Drag handle */}
      <div
        className="shrink-0 flex items-center justify-center py-3 cursor-grab active:cursor-grabbing touch-manipulation"
        onPointerDown={handleDragStart}
        onClick={() => setExpanded(v => !v)}
      >
        <div className="w-10 h-1 rounded-full bg-[var(--text-muted)]/30" />
      </div>

      {/* Content — scrollable when expanded */}
      <div className={`flex-1 overflow-y-auto overscroll-contain px-4 pb-4 ${expanded ? '' : 'overflow-hidden'}`}>
        {children}
      </div>
    </div>
  )
}

/**
 * Quick action bar that floats above the bottom sheet.
 * Use for primary actions like Capture, Export, etc.
 */
export function FloatingBar({
  children,
  className = '',
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={`lg:hidden fixed bottom-16 left-1/2 -translate-x-1/2 z-[51] flex items-center gap-3 px-5 py-2.5 rounded-full bg-[var(--panel-bg)]/95 backdrop-blur-xl border border-[var(--overlay-border)] shadow-2xl ${className}`}>
      {children}
    </div>
  )
}
