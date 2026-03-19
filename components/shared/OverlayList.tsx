'use client'

import { type CanvasElement } from '@/components/shared/OverlayCanvas'
import { Type, X } from 'lucide-react'

interface OverlayListProps {
  overlays: CanvasElement[]
  selectedId: string | null
  onSelect: (id: string | null) => void
  onRemove: (id: string) => void
}

export function OverlayList({ overlays, selectedId, onSelect, onRemove }: OverlayListProps) {
  if (overlays.length === 0) return null

  return (
    <div>
      <label className="text-[11px] font-semibold uppercase tracking-wider text-(--text-muted) mb-2 block">
        Overlays ({overlays.length})
      </label>
      <div className="space-y-1 max-h-40 overflow-y-auto">
        {overlays.map(ov => {
          const isSel = selectedId === ov.id
          return (
            <div
              key={ov.id}
              onClick={() => onSelect(isSel ? null : ov.id)}
              className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border transition-all cursor-pointer ${
                isSel
                  ? 'bg-[#FF6B4A]/10 border-[#FF6B4A]/20'
                  : 'bg-(--card-bg) border-(--overlay-border) hover:bg-(--card-bg-hover)'
              }`}
            >
              {ov.type === 'image' && ov.src ? (
                <img src={ov.src} alt="" className="w-5 h-5 shrink-0" />
              ) : (
                <Type className="w-4 h-4 text-(--text-tertiary) shrink-0" />
              )}
              <span
                className={`text-xs flex-1 truncate ${isSel ? 'text-[#FF6B4A] font-semibold' : 'text-(--text-secondary)'}`}
                style={ov.type === 'text' ? { fontFamily: ov.fontFamily, color: ov.fill } : undefined}
              >
                {ov.type === 'text' ? `Aa "${(ov.text || '').slice(0, 12)}"` : '🖼️ Sticker'}
              </span>
              <button
                onClick={e => { e.stopPropagation(); onRemove(ov.id) }}
                className="cursor-pointer"
              >
                <X className="w-3 h-3 text-(--text-tertiary) hover:text-white" />
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
