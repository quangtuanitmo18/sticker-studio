import React from 'react'
import { StickerOverlay } from '@/lib/video-processor'
import { AssetPanel } from '@/components/shared/AssetPanel'
import { X, ZoomIn, ZoomOut } from 'lucide-react'

interface StickersTabProps {
  stickerOverlays: StickerOverlay[]
  setStickerOverlays: React.Dispatch<React.SetStateAction<StickerOverlay[]>>
}

export default function StickersTab({ stickerOverlays, setStickerOverlays }: StickersTabProps) {
  const handleAddAsset = (src: string) => {
    setStickerOverlays(prev => [
      ...prev,
      {
        id: Date.now().toString(),
        src,
        x: 0.5,
        y: 0.5,
        size: 20, // default scale size percentage
      }
    ])
  }

  const handleResize = (id: string, delta: number) => {
    setStickerOverlays(prev => prev.map(s => s.id === id ? { ...s, size: Math.max(5, Math.min(80, s.size + delta)) } : s))
  }

  return (
    <div className="space-y-4">
      <AssetPanel onAddAsset={handleAddAsset} />

      {stickerOverlays.length > 0 && (
         <div className="pt-4 border-t border-[var(--overlay-border)] space-y-2">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)] block">
              Layers ({stickerOverlays.length})
            </label>
            <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar pr-1">
              {stickerOverlays.map((layer) => (
                 <div key={layer.id} className="p-2 bg-[var(--card-bg)] border border-[var(--overlay-border)] rounded-lg flex items-center justify-between gap-2">
                   <div className="w-8 h-8 rounded bg-[var(--background)] flex-shrink-0 flex items-center justify-center p-1 border border-[var(--overlay-border)]">
                     <img src={layer.src} alt="" className="w-full h-full object-contain" />
                   </div>
                   <div className="flex bg-[var(--background)] rounded border border-[var(--overlay-border)]">
                     <button onClick={() => handleResize(layer.id, -5)} className="p-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--card-bg-hover)] border-r border-[var(--overlay-border)]">
                       <ZoomOut className="w-3.5 h-3.5" />
                     </button>
                     <button onClick={() => handleResize(layer.id, 5)} className="p-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--card-bg-hover)]">
                       <ZoomIn className="w-3.5 h-3.5" />
                     </button>
                   </div>
                   <button onClick={() => setStickerOverlays(prev => prev.filter(s => s.id !== layer.id))} className="text-[var(--text-muted)] hover:text-red-400 p-1">
                     <X className="w-4 h-4" />
                   </button>
                 </div>
              ))}
            </div>
         </div>
      )}
    </div>
  )
}
