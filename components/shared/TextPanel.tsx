'use client'

import { PanelSection } from '@/components/shared/PanelSection'
import { Button } from '@/components/ui/button'
import { FONTS, TEXT_PRESETS } from '@/lib/shared-assets'
import { Plus, Type } from 'lucide-react'

interface TextConfig {
  text: string
  fontFamily: string
  fontSize: number
  fill: string
  stroke: string
  strokeWidth: number
}

interface TextPanelProps {
  text: string
  onTextChange: (t: string) => void
  fontFamily: string
  onFontChange: (f: string) => void
  fontSize: number
  onSizeChange: (s: number) => void
  fillColor: string
  onFillChange: (c: string) => void
  strokeColor: string
  onStrokeChange: (c: string) => void
  strokeWidth: number
  onStrokeWidthChange: (w: number) => void
  onAddText: (config: TextConfig) => void
  onAddPreset?: (preset: typeof TEXT_PRESETS[0]) => void
  selectedText?: string
}

export function TextPanel({
  text, onTextChange, fontFamily, onFontChange,
  fontSize, onSizeChange, fillColor, onFillChange,
  strokeColor, onStrokeChange, strokeWidth, onStrokeWidthChange,
  onAddText, onAddPreset, selectedText,
}: TextPanelProps) {
  const handleAdd = () => {
    if (!text.trim()) return
    onAddText({ text, fontFamily, fontSize, fill: fillColor, stroke: strokeColor, strokeWidth })
  }

  return (
    <div className="space-y-4">
      {selectedText && (
        <div className="rounded-lg bg-[#FF6B4A]/8 border border-[#FF6B4A]/15 px-3 py-2 flex items-center gap-2">
          <Type className="w-3.5 h-3.5 text-[#FF6B4A] shrink-0" />
          <span className="text-[11px] text-[#FF6B4A]/80 leading-tight">
            Editing: <strong className="text-[#FF6B4A]">&ldquo;{selectedText}&rdquo;</strong>
          </span>
        </div>
      )}

      <PanelSection title="Add Text">
        <input
          type="text" placeholder="WOW!, OMG, LOL..."
          value={text} onChange={(e) => onTextChange(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          className="w-full px-3 py-2.5 border border-(--overlay-border) rounded-xl bg-(--input-bg) text-(--text-primary) placeholder:text-(--text-muted) focus:border-[#FF6B4A]/30 focus:outline-none text-sm"
        />
        <Button onClick={handleAdd} className="w-full" size="sm" disabled={!text.trim()}>
          <Plus className="w-4 h-4" /> Add to Canvas
        </Button>
      </PanelSection>

      <PanelSection title="Font">
        <div className="grid grid-cols-2 gap-1.5">
          {FONTS.map(f => (
            <button key={f.value} onClick={() => onFontChange(f.value)}
              className={`py-2 px-2 rounded-lg text-left transition-all cursor-pointer ${
                fontFamily === f.value
                  ? 'bg-[#FF6B4A]/15 text-[#FF6B4A] border border-[#FF6B4A]/20'
                  : 'bg-(--card-bg) text-(--text-tertiary) border border-(--overlay-border) hover:bg-(--card-bg-hover) hover:text-(--text-secondary)'
              }`}>
              <span className="text-[10px] block text-(--text-muted)">{f.label}</span>
              <span className="text-sm font-bold" style={{ fontFamily: f.value }}>{f.sample}</span>
            </button>
          ))}
        </div>
      </PanelSection>

      <PanelSection title="Size & Stroke">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] text-(--text-muted) block mb-1">Font Size</label>
            <div className="flex items-center gap-1">
              <input type="range" min="16" max="120" value={fontSize} onChange={e => onSizeChange(Number(e.target.value))} className="flex-1" style={{ background: `linear-gradient(to right, #FF6B4A ${((fontSize - 16) / 104) * 100}%, var(--overlay-border) ${((fontSize - 16) / 104) * 100}%)` }} />
              <span className="text-[10px] text-(--text-muted) font-mono w-6 text-right">{fontSize}</span>
            </div>
          </div>
          <div>
            <label className="text-[10px] text-(--text-muted) block mb-1">Stroke Width</label>
            <div className="flex items-center gap-1">
              <input type="range" min="0" max="10" value={strokeWidth} onChange={e => onStrokeWidthChange(Number(e.target.value))} className="flex-1" style={{ background: `linear-gradient(to right, #FF6B4A ${strokeWidth * 10}%, var(--overlay-border) ${strokeWidth * 10}%)` }} />
              <span className="text-[10px] text-(--text-muted) font-mono w-4 text-right">{strokeWidth}</span>
            </div>
          </div>
        </div>
      </PanelSection>

      <PanelSection title="Colors">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] text-(--text-muted) block mb-1.5">Fill</label>
            <div className="flex items-center gap-2">
              <input type="color" value={fillColor} onChange={(e) => onFillChange(e.target.value)} className="w-7 h-7 rounded cursor-pointer border border-(--overlay-border)" />
              <span className="text-[10px] uppercase text-(--text-muted) font-mono">{fillColor}</span>
            </div>
          </div>
          <div>
            <label className="text-[10px] text-(--text-muted) block mb-1.5">Stroke</label>
            <div className="flex items-center gap-2">
              <input type="color" value={strokeColor} onChange={(e) => onStrokeChange(e.target.value)} className="w-7 h-7 rounded cursor-pointer border border-(--overlay-border)" />
              <span className="text-[10px] uppercase text-(--text-muted) font-mono">{strokeColor}</span>
            </div>
          </div>
        </div>
      </PanelSection>

      {onAddPreset && (
        <PanelSection title="Style Presets">
          <div className="grid grid-cols-2 gap-1.5">
            {TEXT_PRESETS.map(preset => (
              <button key={preset.label} onClick={() => onAddPreset(preset)}
                className="py-2.5 px-3 rounded-lg bg-(--card-bg) border border-(--overlay-border) text-left hover:bg-(--card-bg-hover) hover:border-(--overlay-border-hover) transition-all cursor-pointer">
                <span className="text-[11px] font-bold block" style={{ fontFamily: preset.font, color: preset.fill, textShadow: `1px 1px 0 ${preset.stroke}` }}>
                  {preset.label}
                </span>
              </button>
            ))}
          </div>
        </PanelSection>
      )}
    </div>
  )
}
