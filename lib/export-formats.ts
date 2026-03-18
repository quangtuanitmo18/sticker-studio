/**
 * Export format helpers for messaging platforms
 * Converts sticker images to platform-specific formats
 * Used by: Maker, Pack Gen, Sticker Pack exports
 */

// ─── Types ───────────────────────────────────────────────────

export interface ExportFormat {
  id: string
  label: string
  emoji: string
  description: string
  maxSize: number // px
  maxFileSize?: number // bytes
  format: 'webp' | 'png' | 'gif'
  quality?: number
  transparent: boolean
}

// ─── Platform formats ────────────────────────────────────────

export const EXPORT_FORMATS: ExportFormat[] = [
  {
    id: 'png',
    label: 'PNG',
    emoji: '🖼️',
    description: 'Lossless, best quality',
    maxSize: 4096,
    format: 'png',
    transparent: true,
  },
  {
    id: 'webp',
    label: 'WebP',
    emoji: '🌐',
    description: 'Modern web format',
    maxSize: 4096,
    format: 'webp',
    quality: 90,
    transparent: true,
  },
  {
    id: 'telegram',
    label: 'Telegram',
    emoji: '✈️',
    description: '512×512 WebP, ≤512KB',
    maxSize: 512,
    maxFileSize: 512 * 1024,
    format: 'webp',
    quality: 90,
    transparent: true,
  },
  {
    id: 'whatsapp',
    label: 'WhatsApp',
    emoji: '💬',
    description: '512×512 WebP, ≤100KB',
    maxSize: 512,
    maxFileSize: 100 * 1024,
    format: 'webp',
    quality: 75,
    transparent: true,
  },
  {
    id: 'discord',
    label: 'Discord',
    emoji: '🎮',
    description: '320×320 PNG/GIF, ≤256KB',
    maxSize: 320,
    maxFileSize: 256 * 1024,
    format: 'png',
    transparent: true,
  },
  {
    id: 'imessage',
    label: 'iMessage',
    emoji: '🍎',
    description: '300×300 PNG, ≤500KB',
    maxSize: 300,
    maxFileSize: 500 * 1024,
    format: 'png',
    transparent: true,
  },
]

// ─── Conversion utilities ────────────────────────────────────

/** Resize image to fit within maxSize while preserving aspect ratio */
function resizeCanvas(
  sourceCanvas: HTMLCanvasElement,
  maxSize: number,
): HTMLCanvasElement {
  const { width, height } = sourceCanvas
  if (width <= maxSize && height <= maxSize) {
    // Make it square if needed by centering
    const canvas = document.createElement('canvas')
    canvas.width = maxSize
    canvas.height = maxSize
    const ctx = canvas.getContext('2d')!
    const scale = Math.min(maxSize / width, maxSize / height)
    const nw = width * scale
    const nh = height * scale
    ctx.drawImage(sourceCanvas, (maxSize - nw) / 2, (maxSize - nh) / 2, nw, nh)
    return canvas
  }

  const scale = Math.min(maxSize / width, maxSize / height)
  const nw = Math.round(width * scale)
  const nh = Math.round(height * scale)

  const canvas = document.createElement('canvas')
  canvas.width = maxSize
  canvas.height = maxSize
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(sourceCanvas, (maxSize - nw) / 2, (maxSize - nh) / 2, nw, nh)
  return canvas
}

/** Convert dataURL or Blob to canvas */
async function imageToCanvas(source: string | Blob): Promise<HTMLCanvasElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0)
      resolve(canvas)
    }
    img.onerror = () => reject(new Error('Failed to load image'))
    if (source instanceof Blob) {
      img.src = URL.createObjectURL(source)
    } else {
      img.src = source
    }
  })
}

/** Convert canvas to blob with quality reduction to meet file size limit */
async function canvasToBlob(
  canvas: HTMLCanvasElement,
  format: string,
  quality: number,
  maxFileSize?: number,
): Promise<Blob> {
  const mimeType = format === 'webp' ? 'image/webp' : format === 'gif' ? 'image/gif' : 'image/png'

  let q = quality / 100
  let blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(b => b ? resolve(b) : reject('toBlob failed'), mimeType, q)
  })

  // Reduce quality iteratively if file is too large
  if (maxFileSize) {
    let attempts = 0
    while (blob.size > maxFileSize && q > 0.1 && attempts < 10) {
      q -= 0.08
      attempts++
      blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(b => b ? resolve(b) : reject('toBlob failed'), mimeType, q)
      })
    }
  }

  return blob
}

// ─── Main export function ────────────────────────────────────

export interface ExportResult {
  blob: Blob
  filename: string
  format: ExportFormat
  finalSize: { width: number; height: number }
  fileSize: number
  withinLimits: boolean
}

/**
 * Convert an image (dataURL or Blob) to the specified platform format
 */
export async function exportForPlatform(
  source: string | Blob,
  formatId: string,
  baseName = 'sticker',
): Promise<ExportResult> {
  const format = EXPORT_FORMATS.find(f => f.id === formatId)
  if (!format) throw new Error(`Unknown format: ${formatId}`)

  const sourceCanvas = await imageToCanvas(source)
  const resized = resizeCanvas(sourceCanvas, format.maxSize)
  const blob = await canvasToBlob(
    resized,
    format.format,
    format.quality ?? 100,
    format.maxFileSize,
  )

  const ext = format.format === 'webp' ? 'webp' : format.format === 'gif' ? 'gif' : 'png'
  const filename = `${baseName}_${format.id}.${ext}`

  return {
    blob,
    filename,
    format,
    finalSize: { width: resized.width, height: resized.height },
    fileSize: blob.size,
    withinLimits: !format.maxFileSize || blob.size <= format.maxFileSize,
  }
}

/**
 * Export a batch of stickers for a platform (for sticker packs)
 */
export async function exportPackForPlatform(
  sources: (string | Blob)[],
  formatId: string,
  packName = 'sticker_pack',
): Promise<ExportResult[]> {
  const results: ExportResult[] = []
  for (let i = 0; i < sources.length; i++) {
    const result = await exportForPlatform(
      sources[i],
      formatId,
      `${packName}_${String(i + 1).padStart(2, '0')}`,
    )
    results.push(result)
  }
  return results
}

/** Format file size for display */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`
}
