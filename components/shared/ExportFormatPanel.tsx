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

/** 
 * Robust canvas export function
 * Uses File System Access API (showSaveFilePicker) when available for reliable filenames.
 * Falls back to toBlob + anchor download.
 * Automatically handles white background for JPG.
 */
export async function exportCanvasAs(
  canvas: HTMLCanvasElement, 
  format: ExportFormat, 
  baseFilename: string
): Promise<void> {
  const { mime, quality } = getExportMime(format)
  const filename = `${baseFilename}.${format === 'jpg' ? 'jpg' : format}`

  // For JPG, composite onto a white background (removes transparency)
  let finalCanvas = canvas
  if (format === 'jpg') {
    const tmp = document.createElement('canvas')
    tmp.width = canvas.width; tmp.height = canvas.height
    const ctx = tmp.getContext('2d')!
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, tmp.width, tmp.height)
    ctx.drawImage(canvas, 0, 0)
    finalCanvas = tmp
  }

  // Modern: File System Access API
  if ('showSaveFilePicker' in window) {
    try {
      const extMap = { png: '.png', jpg: '.jpg', webp: '.webp' } as const
      const handle = await (window as any).showSaveFilePicker({
        suggestedName: filename,
        types: [{
          description: `${format.toUpperCase()} Image`,
          accept: { [mime]: [extMap[format]] },
        }],
      })
      const writable = await handle.createWritable()
      const blob = await new Promise<Blob>((resolve) => {
        finalCanvas.toBlob((b) => resolve(b!), mime, quality)
      })
      await writable.write(blob)
      await writable.close()
      return
    } catch (fsErr: any) {
      if (fsErr.name === 'AbortError') throw new Error('AbortError') // Cancelled by user
      console.warn('File System API failed, falling back...', fsErr)
    }
  }

  // Fallback: Blob URL download
  return new Promise((resolve, reject) => {
    finalCanvas.toBlob((blob) => {
      if (!blob) { reject(new Error('Canvas toBlob failed')); return }
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.style.display = 'none'
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      setTimeout(() => {
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
        resolve()
      }, 500)
    }, mime, quality)
  })
}
