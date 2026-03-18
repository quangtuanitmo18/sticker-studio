'use client'

import { TEMPLATE_CATEGORIES, type TemplateCategory } from '@/lib/shared-assets'
import { useState } from 'react'

interface AssetPanelProps {
  onAddAsset: (src: string) => void
}

export function AssetPanel({ onAddAsset }: AssetPanelProps) {
  const [activeCategory, setActiveCategory] = useState<TemplateCategory>('emojis')

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1">
        {(Object.keys(TEMPLATE_CATEGORIES) as TemplateCategory[]).map((cat) => (
          <button key={cat} onClick={() => setActiveCategory(cat)}
            className={`px-2 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
              activeCategory === cat ? 'bg-[#FF6B4A]/15 text-[#FF6B4A]' : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[var(--card-bg)]'
            }`}>
            {TEMPLATE_CATEGORIES[cat].name}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-4 gap-1.5 max-h-[500px] overflow-y-auto">
        {TEMPLATE_CATEGORIES[activeCategory].items.map((src, idx) => (
          <div key={idx} onClick={() => onAddAsset(src)}
            className="aspect-square bg-[var(--card-bg)] rounded-lg border border-[var(--overlay-border)] flex items-center justify-center p-1 cursor-pointer hover:border-[#FF6B4A]/30 hover:bg-[var(--card-bg-hover)] transition-all">
            <img src={src} alt="" className="w-full h-full object-contain" loading="lazy" />
          </div>
        ))}
      </div>
    </div>
  )
}
