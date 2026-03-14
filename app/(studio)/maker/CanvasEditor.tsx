'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
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

const URLImage = ({ element, isSelected, onSelect, onChange }: any) => {
  const [image] = useImage(element.src, 'anonymous')
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
        onClick={onSelect}
        onTap={onSelect}
        ref={shapeRef}
        image={image}
        {...element}
        draggable
        onDragEnd={(e) => {
          onChange({
            ...element,
            x: e.target.x(),
            y: e.target.y(),
          })
        }}
        onTransformEnd={(e) => {
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
            if (newBox.width < 5 || newBox.height < 5) {
              return oldBox
            }
            return newBox
          }}
        />
      )}
    </React.Fragment>
  )
}

const TextElement = ({ element, isSelected, onSelect, onChange }: any) => {
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
      <KonvaText
        onClick={onSelect}
        onTap={onSelect}
        ref={shapeRef}
        {...element}
        draggable
        onDragEnd={(e) => {
          onChange({
            ...element,
            x: e.target.x(),
            y: e.target.y(),
          })
        }}
        onTransformEnd={(e) => {
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
            if (newBox.width < 5 || newBox.height < 5) {
              return oldBox
            }
            return newBox
          }}
        />
      )}
    </React.Fragment>
  )
}

export default function CanvasEditor({ elements, setElements, selectedId, setSelectedId, onExport, width, height }: CanvasEditorProps) {
  const stageRef = useRef<any>(null)

  const checkDeselect = (e: any) => {
    const clickedOnEmpty = e.target === e.target.getStage()
    if (clickedOnEmpty) {
      setSelectedId(null)
    }
  }

  // Export function attached to window so parent can call it
  useEffect(() => {
    (window as any).exportCanvas = () => {
      if (stageRef.current) {
        // Deselect before export
        setSelectedId(null)
        setTimeout(() => {
          const dataUrl = stageRef.current.toDataURL({ pixelRatio: 2 })
          onExport(dataUrl)
        }, 100)
      }
    }
    return () => {
      delete (window as any).exportCanvas
    }
  }, [onExport, setSelectedId])

  return (
    <Stage
      width={width}
      height={height}
      onMouseDown={checkDeselect}
      onTouchStart={checkDeselect}
      ref={stageRef}
      className="bg-zinc-100 dark:bg-zinc-900 rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800"
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
