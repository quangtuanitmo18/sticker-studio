'use client'

import React, { useRef, useEffect, useCallback } from 'react'
import { Stage, Layer, Image as KonvaImage, Text as KonvaText, Transformer } from 'react-konva'
import useImage from 'use-image'

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

  // Text specific
  text?: string
  fontSize?: number
  fontFamily?: string
  fill?: string
  stroke?: string
  strokeWidth?: number

  // Image specific
  src?: string
}

interface CanvasEditorProps {
  elements: CanvasElement[]
  setElements: React.Dispatch<React.SetStateAction<CanvasElement[]>>
  selectedId: string | null
  setSelectedId: (id: string | null) => void
  onExport: (dataUrl: string) => void
  width: number
  height: number
}

/** Extract only Konva-safe props from a CanvasElement */
function toKonvaProps(el: CanvasElement) {
  const { type, ...rest } = el
  return rest
}

function URLImage({ element, isSelected, onSelect, onChange }: any) {
  const [image] = useImage(element.src, 'anonymous')
  const shapeRef = useRef<any>(null)
  const trRef = useRef<any>(null)

  useEffect(() => {
    if (isSelected && trRef.current && shapeRef.current) {
      trRef.current.nodes([shapeRef.current])
      trRef.current.getLayer().batchDraw()
    }
  }, [isSelected])

  const konvaProps = toKonvaProps(element)

  return (
    <React.Fragment>
      <KonvaImage
        onClick={onSelect}
        onTap={onSelect}
        ref={shapeRef}
        image={image}
        {...konvaProps}
        draggable
        onDragEnd={(e) => {
          onChange({ ...element, x: e.target.x(), y: e.target.y() })
        }}
        onTransformEnd={() => {
          const node = shapeRef.current
          const scaleX = node.scaleX()
          const scaleY = node.scaleY()
          node.scaleX(1)
          node.scaleY(1)
          onChange({
            ...element,
            x: node.x(),
            y: node.y(),
            rotation: node.rotation(),
            width: Math.max(5, node.width() * scaleX),
            height: Math.max(node.height() * scaleY),
          })
        }}
      />
      {isSelected && (
        <Transformer
          ref={trRef}
          boundBoxFunc={(oldBox, newBox) => {
            if (newBox.width < 5 || newBox.height < 5) return oldBox
            return newBox
          }}
        />
      )}
    </React.Fragment>
  )
}

function TextElement({ element, isSelected, onSelect, onChange, onDblClick }: any) {
  const shapeRef = useRef<any>(null)
  const trRef = useRef<any>(null)

  useEffect(() => {
    if (isSelected && trRef.current && shapeRef.current) {
      trRef.current.nodes([shapeRef.current])
      trRef.current.getLayer().batchDraw()
    }
  }, [isSelected])

  const konvaProps = toKonvaProps(element)

  const handleDblClick = () => {
    // Pass the actual Konva node ref so the parent can get accurate position
    if (shapeRef.current) {
      onDblClick(shapeRef.current)
    }
  }

  return (
    <React.Fragment>
      <KonvaText
        onClick={onSelect}
        onTap={onSelect}
        onDblClick={handleDblClick}
        onDblTap={handleDblClick}
        ref={shapeRef}
        {...konvaProps}
        draggable
        onDragEnd={(e) => {
          onChange({ ...element, x: e.target.x(), y: e.target.y() })
        }}
        onTransformEnd={() => {
          const node = shapeRef.current
          const scaleX = node.scaleX()
          const scaleY = node.scaleY()
          node.scaleX(1)
          node.scaleY(1)
          onChange({
            ...element,
            x: node.x(),
            y: node.y(),
            rotation: node.rotation(),
            width: Math.max(5, node.width() * scaleX),
            height: Math.max(node.height() * scaleY),
          })
        }}
      />
      {isSelected && (
        <Transformer
          ref={trRef}
          boundBoxFunc={(oldBox, newBox) => {
            if (newBox.width < 5 || newBox.height < 5) return oldBox
            return newBox
          }}
        />
      )}
    </React.Fragment>
  )
}

export default function CanvasEditor({ elements, setElements, selectedId, setSelectedId, onExport, width, height }: CanvasEditorProps) {
  const stageRef = useRef<any>(null)
  const editingRef = useRef(false)

  const checkDeselect = (e: any) => {
    const clickedOnEmpty = e.target === e.target.getStage()
    if (clickedOnEmpty) setSelectedId(null)
  }

  useEffect(() => {
    (window as any).exportCanvas = () => {
      if (stageRef.current) {
        setSelectedId(null)
        setTimeout(() => {
          const dataUrl = stageRef.current.toDataURL({ pixelRatio: 2 })
          onExport(dataUrl)
        }, 100)
      }
    }
    return () => { delete (window as any).exportCanvas }
  }, [onExport, setSelectedId])

  // Double-click-to-edit: receives the Konva Text node directly from child
  const handleTextDblClick = useCallback((element: CanvasElement, konvaNode: any) => {
    if (editingRef.current) return
    editingRef.current = true

    const stage = stageRef.current
    if (!stage || !konvaNode) {
      editingRef.current = false
      return
    }

    const container = stage.container()
    const stageBox = container.getBoundingClientRect()

    // Hide the Konva text while editing
    konvaNode.hide()
    konvaNode.getLayer().batchDraw()

    // Get position relative to viewport
    const absPos = konvaNode.getAbsolutePosition()
    const areaPosition = {
      x: stageBox.left + absPos.x,
      y: stageBox.top + absPos.y,
    }

    const textarea = document.createElement('textarea')
    document.body.appendChild(textarea)

    textarea.value = element.text || ''
    textarea.style.position = 'fixed'
    textarea.style.top = areaPosition.y + 'px'
    textarea.style.left = areaPosition.x + 'px'
    textarea.style.width = Math.max(konvaNode.width() * (konvaNode.scaleX() || 1) + 20, 120) + 'px'
    textarea.style.minHeight = Math.max(konvaNode.height() * (konvaNode.scaleY() || 1) + 10, 40) + 'px'
    textarea.style.fontSize = (element.fontSize || 60) * (konvaNode.scaleY() || 1) + 'px'
    textarea.style.fontFamily = element.fontFamily || 'Impact'
    textarea.style.color = element.fill || '#ffffff'
    textarea.style.border = '2px solid #FF6B4A'
    textarea.style.borderRadius = '8px'
    textarea.style.padding = '4px 8px'
    textarea.style.margin = '0'
    textarea.style.overflow = 'hidden'
    textarea.style.background = 'rgba(28, 25, 23, 0.95)'
    textarea.style.outline = 'none'
    textarea.style.resize = 'none'
    textarea.style.lineHeight = '1.2'
    textarea.style.zIndex = '10000'
    textarea.style.transformOrigin = 'left top'

    textarea.focus()
    textarea.select()

    let removed = false
    const removeTextarea = () => {
      if (removed) return
      removed = true
      const newText = textarea.value
      if (newText !== element.text) {
        setElements(prev => prev.map(el =>
          el.id === element.id ? { ...el, text: newText } : el
        ))
      }
      konvaNode.show()
      konvaNode.getLayer()?.batchDraw()
      textarea.remove()
      editingRef.current = false
    }

    textarea.addEventListener('blur', removeTextarea)
    textarea.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        textarea.blur()
      }
      if (e.key === 'Escape') {
        textarea.value = element.text || ''
        textarea.blur()
      }
    })
  }, [setElements])

  return (
    <Stage
      width={width}
      height={height}
      onMouseDown={checkDeselect}
      onTouchStart={checkDeselect}
      ref={stageRef}
      className="bg-[#141211] rounded-xl overflow-hidden border border-stone-800/60"
    >
      <Layer>
        {elements.map((el, i) => {
          if (el.type === 'image' || el.type === 'main-sticker') {
            return (
              <URLImage
                key={el.id}
                element={el}
                isSelected={el.id === selectedId}
                onSelect={() => setSelectedId(el.id)}
                onChange={(newAttrs: any) => {
                  const els = elements.slice()
                  els[i] = newAttrs
                  setElements(els)
                }}
              />
            )
          }
          if (el.type === 'text') {
            return (
              <TextElement
                key={el.id}
                element={el}
                isSelected={el.id === selectedId}
                onSelect={() => setSelectedId(el.id)}
                onDblClick={(konvaNode: any) => handleTextDblClick(el, konvaNode)}
                onChange={(newAttrs: any) => {
                  const els = elements.slice()
                  els[i] = newAttrs
                  setElements(els)
                }}
              />
            )
          }
          return null
        })}
      </Layer>
    </Stage>
  )
}
