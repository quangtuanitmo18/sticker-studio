import React, { useState } from 'react'
import { X } from 'lucide-react'
import { TextOverlay, TEXT_ANIMATION_PRESETS } from '@/lib/video-processor'
import { TextPanel } from '@/components/shared/TextPanel'

interface TextTabProps {
  textOverlays: TextOverlay[]
  setTextOverlays: React.Dispatch<React.SetStateAction<TextOverlay[]>>
}

export default function TextTab({ textOverlays, setTextOverlays }: TextTabProps) {
  const [text, setText] = useState('')
  const [fontFamily, setFontFamily] = useState('Impact')
  const [fontSize, setFontSize] = useState(48)
  const [fillColor, setFillColor] = useState('#ffffff')
  const [strokeColor, setStrokeColor] = useState('#000000')
  const [strokeWidth, setStrokeWidth] = useState(3)

  const handleAddText = (config: any) => {
    setTextOverlays(prev => [
      ...prev,
      {
        id: `text-${Date.now()}`,
        text: config.text,
        fontFamily: config.fontFamily,
        fontSize: config.fontSize,
        fill: config.fill,
        stroke: config.stroke,
        strokeWidth: config.strokeWidth,
        x: 0.5, y: 0.5,
        animationPreset: 'none'
      }
    ])
    setText('')
  }

  const handleAddPreset = (preset: any) => {
    setTextOverlays(prev => [
      ...prev,
      {
        id: `text-${Date.now()}`,
        text: preset.label.split(' ').slice(1).join(' ') || preset.label,
        fontFamily: preset.font,
        fontSize: preset.size,
        fill: preset.fill,
        stroke: preset.stroke,
        strokeWidth: preset.strokeWidth,
        x: 0.5, y: 0.5,
        animationPreset: 'none'
      }
    ])
  }

  return (
    <div className="space-y-4">
      <TextPanel
        text={text}
        onTextChange={setText}
        fontFamily={fontFamily}
        onFontChange={setFontFamily}
        fontSize={fontSize}
        onSizeChange={setFontSize}
        fillColor={fillColor}
        onFillChange={setFillColor}
        strokeColor={strokeColor}
        onStrokeChange={setStrokeColor}
        strokeWidth={strokeWidth}
        onStrokeWidthChange={setStrokeWidth}
        onAddText={handleAddText}
        onAddPreset={handleAddPreset}
      />

      {textOverlays.length > 0 && (
        <div className="pt-4 border-t border-(--overlay-border) space-y-2">
          <label className="text-[11px] font-semibold uppercase tracking-wider text-(--text-muted) block">
            Text Layers ({textOverlays.length})
          </label>
          <div className="space-y-2">
            {textOverlays.map((layer, idx) => (
              <div key={layer.id} className="p-3 bg-(--card-bg) border border-(--overlay-border) rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-(--text-secondary)">Layer {idx + 1}</span>
                  <button
                    onClick={() => setTextOverlays(prev => prev.filter(t => t.id !== layer.id))}
                    className="w-5 h-5 flex items-center justify-center rounded text-(--text-muted) hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <input
                  type="text"
                  value={layer.text}
                  onChange={(e) => setTextOverlays(prev => prev.map(t => t.id === layer.id ? { ...t, text: e.target.value } : t))}
                  className="w-full bg-(--background) border border-(--overlay-border) rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-[#10B981]/60 text-(--text-primary) placeholder:text-(--text-muted)"
                  placeholder="Enter text..."
                />
                {/* Animation Preset */}
                <select
                  value={layer.animationPreset}
                  onChange={(e) => setTextOverlays(prev => prev.map(t => t.id === layer.id ? { ...t, animationPreset: e.target.value as any } : t))}
                  className="w-full bg-(--background) border border-(--overlay-border) rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-[#10B981]/60 text-(--text-primary) cursor-pointer"
                >
                  {TEXT_ANIMATION_PRESETS.map(preset => (
                    <option key={preset.id} value={preset.id}>
                      Animation: {preset.label}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
