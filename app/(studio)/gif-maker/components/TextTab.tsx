import React, { useState } from 'react'
import { Type, X } from 'lucide-react'
import { TextOverlay, TEXT_ANIMATION_PRESETS } from '@/lib/video-processor'
import { TextPanel } from '@/components/shared/TextPanel'

interface TextTabProps {
  textOverlays: TextOverlay[]
  setTextOverlays: React.Dispatch<React.SetStateAction<TextOverlay[]>>
}

export default function TextTab({ textOverlays, setTextOverlays }: TextTabProps) {
  // Local state for the TextPanel builder
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
        x: 0.5,
        y: 0.5,
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
        x: 0.5,
        y: 0.5,
        animationPreset: 'none' // Presets from shared-assets don't have animation presets yet
      }
    ])
  }

  return (
    <div className="space-y-6">
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
        <div className="pt-6 border-t border-[var(--overlay-border)] space-y-3">
          <label className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)] block">
            Text Layers ({textOverlays.length})
          </label>
          <div className="space-y-3">
            {textOverlays.map((layer, idx) => (
              <div key={layer.id} className="p-3 bg-[var(--card-bg)] border border-[var(--overlay-border)] rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[var(--text-secondary)]">Layer {idx + 1}</span>
                  <button onClick={() => setTextOverlays(prev => prev.filter(t => t.id !== layer.id))} className="text-[var(--text-muted)] hover:text-red-400">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <input 
                  type="text" 
                  value={layer.text} 
                  onChange={(e) => setTextOverlays(prev => prev.map(t => t.id === layer.id ? { ...t, text: e.target.value } : t))}
                  className="w-full bg-[var(--background)] border border-[var(--overlay-border)] rounded px-2 py-1.5 text-sm focus:outline-none focus:border-[#FF6B4A] text-[var(--text-primary)] placeholder-[var(--text-muted)]"
                  placeholder="Enter text..."
                />
                
                {/* Animation Preset specifically for GIF Maker */}
                <select 
                  value={layer.animationPreset}
                  onChange={(e) => setTextOverlays(prev => prev.map(t => t.id === layer.id ? { ...t, animationPreset: e.target.value as any } : t))}
                  className="w-full bg-[var(--background)] border border-[var(--overlay-border)] rounded px-2 py-1.5 text-sm focus:outline-none focus:border-[#FF6B4A] text-[var(--text-primary)]"
                >
                  {TEXT_ANIMATION_PRESETS.map(preset => (
                    <option key={preset.id} value={preset.id} className="bg-[var(--background)] text-[var(--text-primary)]">
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
