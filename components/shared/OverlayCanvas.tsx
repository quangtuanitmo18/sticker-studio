'use client'

import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useRef } from 'react'
import { Image as KonvaImage, Text as KonvaText, Layer, Line, Stage, Transformer } from 'react-konva'
import useImage from 'use-image'

// ─── Shared element type ───────────────────────────────────
export type CanvasElement = {
  id: string
  type: 'image' | 'text' | 'main-sticker'
  x: number
  y: number
  width?: number
  height?: number
  rotation?: number
  scaleX?: number
  scaleY?: number
  // Text
  text?: string
  fontSize?: number
  fontFamily?: string
  fill?: string
  stroke?: string
  strokeWidth?: number
  // Image
  src?: string
}

export interface OverlayCanvasHandle {
  exportOverlay: (targetW?: number, targetH?: number) => Promise<string>
}

interface OverlayCanvasProps {
  elements: CanvasElement[]
  setElements: React.Dispatch<React.SetStateAction<CanvasElement[]>>
  selectedId: string | null
  setSelectedId: (id: string | null) => void
  width: number
  height: number
  className?: string
  /** When true (default), renders as absolute-positioned overlay on top of content.
   *  When false, renders as a normal block-level canvas (Maker mode). */
  overlay?: boolean
}

/** Extract only Konva-safe props */
function toKonvaProps(el: CanvasElement) {
  const { type, ...rest } = el
  return rest
}

// Snap threshold in pixels
const SNAP_THRESHOLD = 6

// ─── URLImage (draggable + transformable) ────────────────────
function URLImage({ element, isSelected, onSelect, onChange, onDragMove }: {
  element: CanvasElement; isSelected: boolean
  onSelect: () => void; onChange: (el: CanvasElement) => void; onDragMove?: (e: any) => void
}) {
  const [image] = useImage(element.src || '', 'anonymous')
  const shapeRef = useRef<any>(null)
  const trRef = useRef<any>(null)

  useEffect(() => {
    if (isSelected && trRef.current && shapeRef.current) {
      trRef.current.nodes([shapeRef.current])
      trRef.current.getLayer().batchDraw()
    }
  }, [isSelected])

  return (
    <React.Fragment>
      <KonvaImage
        {...toKonvaProps(element)}
        ref={shapeRef} image={image}
        onClick={onSelect} onTap={onSelect}
        onMouseDown={onSelect}
        draggable
        hitFunc={(context: any, shape: any) => {
          context.beginPath()
          context.rect(0, 0, shape.width(), shape.height())
          context.closePath()
          context.fillStrokeShape(shape)
        }}
        onDragMove={onDragMove}
        onDragEnd={e => onChange({ ...element, x: e.target.x(), y: e.target.y() })}
        onTransformEnd={() => {
          const node = shapeRef.current
          const sx = node.scaleX(), sy = node.scaleY()
          node.scaleX(1); node.scaleY(1)
          onChange({ ...element, x: node.x(), y: node.y(), rotation: node.rotation(), width: Math.max(5, node.width() * sx), height: Math.max(node.height() * sy) })
        }}
      />
      {isSelected && (
        <Transformer ref={trRef} boundBoxFunc={(oldBox, newBox) => newBox.width < 5 || newBox.height < 5 ? oldBox : newBox} />
      )}
    </React.Fragment>
  )
}

// ─── TextElement (draggable + transformable + dbl-click edit) ─
function TextElement({ element, isSelected, onSelect, onChange, onDblClick, onDragMove }: {
  element: CanvasElement; isSelected: boolean
  onSelect: () => void; onChange: (el: CanvasElement) => void; onDblClick: (node: any) => void; onDragMove?: (e: any) => void
}) {
  const shapeRef = useRef<any>(null)
  const trRef = useRef<any>(null)

  useEffect(() => {
    if (isSelected && trRef.current && shapeRef.current) {
      trRef.current.nodes([shapeRef.current])
      trRef.current.getLayer().batchDraw()
    }
  }, [isSelected])

  // Force Konva to re-render text when fontFamily changes (canvas font caching issue)
  useEffect(() => {
    const node = shapeRef.current
    if (!node || !element.fontFamily) return
    const font = element.fontFamily
    // Load the font into the browser's font system, then force Konva to clear cache & redraw
    document.fonts.load(`bold ${element.fontSize || 48}px "${font}"`).then(() => {
      node.fontFamily(font)
      node.clearCache()
      const layer = node.getLayer()
      if (layer) layer.batchDraw()
    }).catch(() => {
      // Font load failed (e.g. system font), still apply
      node.fontFamily(font)
      node.clearCache()
      const layer = node.getLayer()
      if (layer) layer.batchDraw()
    })
  }, [element.fontFamily, element.fontSize])

  return (
    <React.Fragment>
      <KonvaText
        {...toKonvaProps(element)}
        ref={shapeRef}
        onClick={onSelect} onTap={onSelect}
        onMouseDown={onSelect}
        onDblClick={() => shapeRef.current && onDblClick(shapeRef.current)}
        onDblTap={() => shapeRef.current && onDblClick(shapeRef.current)}
        draggable
        onDragMove={onDragMove}
        onDragEnd={e => onChange({ ...element, x: e.target.x(), y: e.target.y() })}
        onTransformEnd={() => {
          const node = shapeRef.current
          const sx = node.scaleX(), sy = node.scaleY()
          node.scaleX(1); node.scaleY(1)
          onChange({ ...element, x: node.x(), y: node.y(), rotation: node.rotation(), width: Math.max(5, node.width() * sx), height: Math.max(node.height() * sy) })
        }}
      />
      {isSelected && (
        <Transformer ref={trRef} boundBoxFunc={(oldBox, newBox) => newBox.width < 5 || newBox.height < 5 ? oldBox : newBox} />
      )}
    </React.Fragment>
  )
}

// ─── Main OverlayCanvas Component ─────────────────────────────
const OverlayCanvas = forwardRef<OverlayCanvasHandle, OverlayCanvasProps>(
  function OverlayCanvas({ elements, setElements, selectedId, setSelectedId, width, height, className, overlay = true }, ref) {
    const stageRef = useRef<any>(null)
    const editingRef = useRef(false)

    // Snap guides state
    const [guides, setGuides] = React.useState<{ x?: number; y?: number }>({})

    // Export: returns transparent PNG dataUrl — optionally at target resolution
    useImperativeHandle(ref, () => ({
      exportOverlay: (targetW?: number, targetH?: number) => new Promise<string>(resolve => {
        setSelectedId(null)
        setTimeout(() => {
          if (stageRef.current) {
            // Calculate pixelRatio to render at target resolution
            const ratio = targetW && targetH ? Math.max(targetW / width, targetH / height) : 2
            resolve(stageRef.current.toDataURL({ pixelRatio: ratio }))
          } else {
            resolve('')
          }
        }, 100)
      })
    }), [setSelectedId, width, height])

    const checkDeselect = (e: any) => {
      // Only deselect when clicking on empty stage area
      if (e.target === e.target.getStage()) setSelectedId(null)
    }

    const handleChange = useCallback((index: number, newAttrs: CanvasElement) => {
      setElements(prev => {
        const copy = prev.slice()
        copy[index] = newAttrs
        return copy
      })
    }, [setElements])

    // ─── Keyboard shortcuts ──────────────────────────────────
    useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
        // Don't handle keys if editing text or focused on an input
        if (editingRef.current) return
        const tag = (e.target as HTMLElement)?.tagName
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
        if (!selectedId) return

        // Delete / Backspace → remove selected element
        if (e.key === 'Delete' || e.key === 'Backspace') {
          e.preventDefault()
          setElements(prev => prev.filter(el => el.id !== selectedId))
          setSelectedId(null)
          return
        }

        // Arrow keys → nudge selected element by 1px (10px with Shift)
        const step = e.shiftKey ? 10 : 1
        if (e.key === 'ArrowLeft') { e.preventDefault(); setElements(prev => prev.map(el => el.id === selectedId ? { ...el, x: el.x - step } : el)); return }
        if (e.key === 'ArrowRight') { e.preventDefault(); setElements(prev => prev.map(el => el.id === selectedId ? { ...el, x: el.x + step } : el)); return }
        if (e.key === 'ArrowUp') { e.preventDefault(); setElements(prev => prev.map(el => el.id === selectedId ? { ...el, y: el.y - step } : el)); return }
        if (e.key === 'ArrowDown') { e.preventDefault(); setElements(prev => prev.map(el => el.id === selectedId ? { ...el, y: el.y + step } : el)); return }

        // Ctrl+D / Cmd+D → duplicate selected element
        if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
          e.preventDefault()
          setElements(prev => {
            const el = prev.find(e => e.id === selectedId)
            if (!el) return prev
            const dup: CanvasElement = { ...el, id: `${el.id}-dup-${Date.now()}`, x: el.x + 20, y: el.y + 20 }
            return [...prev, dup]
          })
          return
        }
      }

      window.addEventListener('keydown', handleKeyDown)
      return () => window.removeEventListener('keydown', handleKeyDown)
    }, [selectedId, setElements, setSelectedId])

    // ─── Snap-to-center on drag ──────────────────────────────
    const handleDragMove = useCallback((e: any) => {
      const node = e.target
      const cx = width / 2
      const cy = height / 2
      const nw = node.width() * (node.scaleX() || 1)
      const nh = node.height() * (node.scaleY() || 1)
      const nodeCx = node.x() + nw / 2
      const nodeCy = node.y() + nh / 2
      const newGuides: { x?: number; y?: number } = {}

      if (Math.abs(nodeCx - cx) < SNAP_THRESHOLD) {
        node.x(cx - nw / 2)
        newGuides.x = cx
      }
      if (Math.abs(nodeCy - cy) < SNAP_THRESHOLD) {
        node.y(cy - nh / 2)
        newGuides.y = cy
      }
      setGuides(newGuides)
    }, [width, height])

    const handleDragEnd = useCallback(() => {
      setGuides({})
    }, [])

    // Double-click-to-edit text
    const handleTextDblClick = useCallback((element: CanvasElement, konvaNode: any) => {
      if (editingRef.current) return
      editingRef.current = true
      const stage = stageRef.current
      if (!stage || !konvaNode) { editingRef.current = false; return }

      const container = stage.container()
      const stageBox = container.getBoundingClientRect()
      const absPos = konvaNode.getAbsolutePosition()

      konvaNode.hide()
      konvaNode.getLayer().batchDraw()

      const textarea = document.createElement('textarea')
      document.body.appendChild(textarea)
      textarea.value = element.text || ''
      Object.assign(textarea.style, {
        position: 'fixed',
        top: `${stageBox.top + absPos.y}px`,
        left: `${stageBox.left + absPos.x}px`,
        width: `${Math.max(konvaNode.width() * (konvaNode.scaleX() || 1) + 20, 120)}px`,
        minHeight: `${Math.max(konvaNode.height() * (konvaNode.scaleY() || 1) + 10, 40)}px`,
        fontSize: `${(element.fontSize || 60) * (konvaNode.scaleY() || 1)}px`,
        fontFamily: element.fontFamily || 'Impact',
        color: element.fill || '#ffffff',
        border: '2px solid #FF6B4A', borderRadius: '8px',
        padding: '4px 8px', margin: '0', overflow: 'hidden',
        background: 'rgba(28, 25, 23, 0.95)', outline: 'none',
        resize: 'none', lineHeight: '1.2', zIndex: '10000', transformOrigin: 'left top',
      })
      textarea.focus(); textarea.select()

      let removed = false
      const removeTextarea = () => {
        if (removed) return; removed = true
        const newText = textarea.value
        if (newText !== element.text) {
          setElements(prev => prev.map(el => el.id === element.id ? { ...el, text: newText } : el))
        }
        konvaNode.show(); konvaNode.getLayer()?.batchDraw()
        textarea.remove(); editingRef.current = false
      }
      textarea.addEventListener('blur', removeTextarea)
      textarea.addEventListener('keydown', (e: KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); textarea.blur() }
        if (e.key === 'Escape') { textarea.value = element.text || ''; textarea.blur() }
      })
    }, [setElements])

    return (
      <Stage
        width={width} height={height}
        onClick={checkDeselect} onTap={checkDeselect}
        ref={stageRef}
        className={className}
        style={overlay
          ? { position: 'absolute' as const, top: 0, left: 0, zIndex: 10, pointerEvents: 'auto' as const }
          : undefined
        }
      >
        <Layer>
          {elements.map((el, i) => {
            if (el.type === 'image' || el.type === 'main-sticker') {
              return (
                <URLImage key={el.id} element={el}
                  isSelected={el.id === selectedId}
                  onSelect={() => setSelectedId(el.id)}
                  onDragMove={handleDragMove}
                  onChange={newAttrs => { handleChange(i, newAttrs); handleDragEnd() }}
                />
              )
            }
            if (el.type === 'text') {
              return (
                <TextElement key={el.id} element={el}
                  isSelected={el.id === selectedId}
                  onSelect={() => setSelectedId(el.id)}
                  onDblClick={konvaNode => handleTextDblClick(el, konvaNode)}
                  onDragMove={handleDragMove}
                  onChange={newAttrs => { handleChange(i, newAttrs); handleDragEnd() }}
                />
              )
            }
            return null
          })}

          {/* Snap-to-center guidelines */}
          {guides.x !== undefined && (
            <Line points={[guides.x, 0, guides.x, height]} stroke="#FF6B4A" strokeWidth={1} dash={[4, 4]} opacity={0.7} />
          )}
          {guides.y !== undefined && (
            <Line points={[0, guides.y, width, guides.y]} stroke="#FF6B4A" strokeWidth={1} dash={[4, 4]} opacity={0.7} />
          )}
        </Layer>
      </Stage>
    )
  }
)

export default OverlayCanvas
