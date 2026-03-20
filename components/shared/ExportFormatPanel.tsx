'use client'

import { Download, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

export type ExportFormat = 'png' | 'jpg' | 'webp'

const FORMATS: { id: ExportFormat; label: string }[] = [
  { id: 'png', label: 'PNG' },
  { id: 'jpg', label: 'JPEG' },
  { id: 'webp', label: 'WEBP' },
]

interface ExportFormatPanelProps {
  format: ExportFormat
  onFormatChange: (fmt: ExportFormat) => void
  onExport: () => void
  isExporting?: boolean
  disabled?: boolean
  /** Label below the format toggles, e.g. "Export Strip" or "Export Collage (1024×1024)" */
  exportLabel?: string
}

export function ExportFormatPanel({
  format,
  onFormatChange,
  onExport,
  isExporting = false,
  disabled = false,
  exportLabel = 'Export',
}: ExportFormatPanelProps) {
  return (
    <div className="space-y-3">
      <div>
        <label className="text-[11px] font-semibold uppercase tracking-wider text-(--text-muted) mb-2 block">
          Standard Export
        </label>
        <div className="flex gap-1">
          {FORMATS.map(fmt => (
            <button
              key={fmt.id}
              onClick={() => onFormatChange(fmt.id)}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold uppercase transition-all cursor-pointer ${
                format === fmt.id
                  ? 'bg-[#FF6B4A] text-white'
                  : 'bg-(--input-bg) text-(--text-muted) hover:bg-(--card-bg-hover)'
              }`}
            >
              {fmt.label}
            </button>
          ))}
        </div>
      </div>
      <Button
        className="w-full gap-2"
        onClick={onExport}
        disabled={disabled || isExporting}
      >
        {isExporting ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Download className="w-4 h-4" />
        )}
        {exportLabel}
      </Button>
    </div>
  )
}

/** Helper: get MIME type and quality for a given export format */
export function getExportMime(format: ExportFormat) {
  const mimeMap = { png: 'image/png', jpg: 'image/jpeg', webp: 'image/webp' } as const
  const qualityMap = { png: undefined, jpg: 0.92, webp: 0.90 } as const
  return { mime: mimeMap[format], quality: qualityMap[format], ext: format }
}

/** Helper: ensure JPG gets white background (no transparency) */
export function canvasToExportDataUrl(canvas: HTMLCanvasElement, format: ExportFormat): string {
  const { mime, quality } = getExportMime(format)
  if (format === 'jpg') {
    const tmp = document.createElement('canvas')
    tmp.width = canvas.width; tmp.height = canvas.height
    const ctx = tmp.getContext('2d')!
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, tmp.width, tmp.height)
    ctx.drawImage(canvas, 0, 0)
    return tmp.toDataURL(mime, quality)
  }
  return canvas.toDataURL(mime, quality)
}
