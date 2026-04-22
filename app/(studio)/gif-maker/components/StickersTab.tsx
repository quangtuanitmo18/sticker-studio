import React from 'react'
import Image from 'next/image'
import { StickerOverlay } from '@/lib/video-processor'
import { AssetPanel } from '@/components/shared/AssetPanel'
import { X, ZoomIn, ZoomOut } from 'lucide-react'

interface StickersTabProps {
  stickerOverlays: StickerOverlay[]
  setStickerOverlays: React.Dispatch<React.SetStateAction<StickerOverlay[]>>
}

export default function StickersTab({ stickerOverlays, setStickerOverlays }: StickersTabProps) {
  const handleAddAsset = (src: string) => {
    setStickerOverlays((prev) => [
      ...prev,
      { id: Date.now().toString(), src, x: 0.5, y: 0.5, size: 20 },
    ])
  }

  const handleResize = (id: string, delta: number) => {
    setStickerOverlays((prev) =>
      prev.map((s) =>
        s.id === id ? { ...s, size: Math.max(5, Math.min(80, s.size + delta)) } : s,
      ),
    )
  }

  return (
    <div className="space-y-4">
      <AssetPanel onAddAsset={handleAddAsset} />

      {stickerOverlays.length > 0 && (
        <div className="pt-4 border-t border-(--overlay-border) space-y-2">
          <label className="text-[11px] font-semibold uppercase tracking-wider text-(--text-muted) block">
            Layers ({stickerOverlays.length})
          </label>
          <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
            {stickerOverlays.map((layer) => (
              <div
                key={layer.id}
                className="p-2 bg-(--card-bg) border border-(--overlay-border) rounded-xl flex items-center justify-between gap-2"
              >
                <div className="relative w-8 h-8 rounded-lg bg-(--background) shrink-0 flex items-center justify-center p-1 border border-(--overlay-border)">
                  <Image unoptimized src={layer.src} alt="" fill className="object-contain" />
                </div>
                <div className="flex bg-(--background) rounded-lg border border-(--overlay-border) overflow-hidden">
                  <button
                    onClick={() => handleResize(layer.id, -5)}
                    className="p-1.5 text-(--text-muted) hover:text-(--text-primary) hover:bg-(--card-bg-hover) border-r border-(--overlay-border) transition-colors cursor-pointer"
                  >
                    <ZoomOut className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleResize(layer.id, 5)}
                    className="p-1.5 text-(--text-muted) hover:text-(--text-primary) hover:bg-(--card-bg-hover) transition-colors cursor-pointer"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                  </button>
                </div>
                <button
                  onClick={() =>
                    setStickerOverlays((prev) => prev.filter((s) => s.id !== layer.id))
                  }
                  className="w-5 h-5 flex items-center justify-center rounded text-(--text-muted) hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                >
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
