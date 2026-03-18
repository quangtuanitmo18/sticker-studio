/**
 * Canvas-based image filter engine
 * Applies real-time visual filters to images using Canvas2D
 * Used by: Maker page filter panel
 */

// ─── Types ───────────────────────────────────────────────────

export interface ImageFilter {
  id: string
  label: string
  emoji: string
  category: 'color' | 'artistic' | 'vintage' | 'special'
  apply: (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => void
}

// ─── Filter Helpers ──────────────────────────────────────────

function getImageData(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) {
  return ctx.getImageData(0, 0, canvas.width, canvas.height)
}

function putImageData(ctx: CanvasRenderingContext2D, data: ImageData) {
  ctx.putImageData(data, 0, 0)
}

function adjustBrightness(data: ImageData, amount: number) {
  const d = data.data
  for (let i = 0; i < d.length; i += 4) {
    d[i] = Math.min(255, Math.max(0, d[i] + amount))
    d[i + 1] = Math.min(255, Math.max(0, d[i + 1] + amount))
    d[i + 2] = Math.min(255, Math.max(0, d[i + 2] + amount))
  }
}

function adjustContrast(data: ImageData, amount: number) {
  const d = data.data
  const factor = (259 * (amount + 255)) / (255 * (259 - amount))
  for (let i = 0; i < d.length; i += 4) {
    d[i] = Math.min(255, Math.max(0, factor * (d[i] - 128) + 128))
    d[i + 1] = Math.min(255, Math.max(0, factor * (d[i + 1] - 128) + 128))
    d[i + 2] = Math.min(255, Math.max(0, factor * (d[i + 2] - 128) + 128))
  }
}

function adjustSaturation(data: ImageData, amount: number) {
  const d = data.data
  for (let i = 0; i < d.length; i += 4) {
    const gray = 0.2989 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]
    d[i] = Math.min(255, Math.max(0, gray + amount * (d[i] - gray)))
    d[i + 1] = Math.min(255, Math.max(0, gray + amount * (d[i + 1] - gray)))
    d[i + 2] = Math.min(255, Math.max(0, gray + amount * (d[i + 2] - gray)))
  }
}

function tintColor(data: ImageData, r: number, g: number, b: number, intensity: number) {
  const d = data.data
  for (let i = 0; i < d.length; i += 4) {
    d[i] = Math.min(255, d[i] * (1 - intensity) + r * intensity)
    d[i + 1] = Math.min(255, d[i + 1] * (1 - intensity) + g * intensity)
    d[i + 2] = Math.min(255, d[i + 2] * (1 - intensity) + b * intensity)
  }
}

// ─── Filter Definitions ─────────────────────────────────────

export const IMAGE_FILTERS: ImageFilter[] = [
  {
    id: 'none',
    label: 'Original',
    emoji: '🖼️',
    category: 'color',
    apply: () => {},
  },
  {
    id: 'grayscale',
    label: 'B&W',
    emoji: '⬛',
    category: 'color',
    apply: (ctx, canvas) => {
      const data = getImageData(ctx, canvas)
      const d = data.data
      for (let i = 0; i < d.length; i += 4) {
        const gray = 0.2989 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]
        d[i] = d[i + 1] = d[i + 2] = gray
      }
      putImageData(ctx, data)
    },
  },
  {
    id: 'sepia',
    label: 'Sepia',
    emoji: '🟤',
    category: 'vintage',
    apply: (ctx, canvas) => {
      const data = getImageData(ctx, canvas)
      const d = data.data
      for (let i = 0; i < d.length; i += 4) {
        const r = d[i], g = d[i + 1], b = d[i + 2]
        d[i] = Math.min(255, r * 0.393 + g * 0.769 + b * 0.189)
        d[i + 1] = Math.min(255, r * 0.349 + g * 0.686 + b * 0.168)
        d[i + 2] = Math.min(255, r * 0.272 + g * 0.534 + b * 0.131)
      }
      putImageData(ctx, data)
    },
  },
  {
    id: 'vintage',
    label: 'Vintage',
    emoji: '📷',
    category: 'vintage',
    apply: (ctx, canvas) => {
      const data = getImageData(ctx, canvas)
      adjustContrast(data, 20)
      adjustBrightness(data, 10)
      adjustSaturation(data, 0.7)
      tintColor(data, 255, 220, 180, 0.15)
      putImageData(ctx, data)
    },
  },
  {
    id: 'warm',
    label: 'Warm',
    emoji: '🌅',
    category: 'color',
    apply: (ctx, canvas) => {
      const data = getImageData(ctx, canvas)
      tintColor(data, 255, 180, 100, 0.12)
      adjustBrightness(data, 8)
      putImageData(ctx, data)
    },
  },
  {
    id: 'cool',
    label: 'Cool',
    emoji: '❄️',
    category: 'color',
    apply: (ctx, canvas) => {
      const data = getImageData(ctx, canvas)
      tintColor(data, 100, 150, 255, 0.12)
      adjustContrast(data, 10)
      putImageData(ctx, data)
    },
  },
  {
    id: 'vivid',
    label: 'Vivid',
    emoji: '🌈',
    category: 'color',
    apply: (ctx, canvas) => {
      const data = getImageData(ctx, canvas)
      adjustSaturation(data, 1.5)
      adjustContrast(data, 25)
      putImageData(ctx, data)
    },
  },
  {
    id: 'fade',
    label: 'Fade',
    emoji: '🌫️',
    category: 'vintage',
    apply: (ctx, canvas) => {
      const data = getImageData(ctx, canvas)
      const d = data.data
      for (let i = 0; i < d.length; i += 4) {
        d[i] = Math.min(255, d[i] * 0.85 + 30)
        d[i + 1] = Math.min(255, d[i + 1] * 0.85 + 30)
        d[i + 2] = Math.min(255, d[i + 2] * 0.85 + 30)
      }
      adjustSaturation(data, 0.6)
      putImageData(ctx, data)
    },
  },
  {
    id: 'dramatic',
    label: 'Dramatic',
    emoji: '🎭',
    category: 'artistic',
    apply: (ctx, canvas) => {
      const data = getImageData(ctx, canvas)
      adjustContrast(data, 60)
      adjustBrightness(data, -15)
      adjustSaturation(data, 1.2)
      putImageData(ctx, data)
    },
  },
  {
    id: 'neon',
    label: 'Neon',
    emoji: '💡',
    category: 'special',
    apply: (ctx, canvas) => {
      const data = getImageData(ctx, canvas)
      adjustSaturation(data, 2.0)
      adjustContrast(data, 40)
      adjustBrightness(data, 15)
      putImageData(ctx, data)
    },
  },
  {
    id: 'duotone_blue',
    label: 'Blue Duo',
    emoji: '💙',
    category: 'artistic',
    apply: (ctx, canvas) => {
      const data = getImageData(ctx, canvas)
      const d = data.data
      for (let i = 0; i < d.length; i += 4) {
        const gray = 0.2989 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]
        const t = gray / 255
        d[i] = Math.min(255, 10 + t * 100)
        d[i + 1] = Math.min(255, 20 + t * 150)
        d[i + 2] = Math.min(255, 60 + t * 195)
      }
      putImageData(ctx, data)
    },
  },
  {
    id: 'duotone_pink',
    label: 'Pink Duo',
    emoji: '💗',
    category: 'artistic',
    apply: (ctx, canvas) => {
      const data = getImageData(ctx, canvas)
      const d = data.data
      for (let i = 0; i < d.length; i += 4) {
        const gray = 0.2989 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]
        const t = gray / 255
        d[i] = Math.min(255, 80 + t * 175)
        d[i + 1] = Math.min(255, 10 + t * 120)
        d[i + 2] = Math.min(255, 60 + t * 160)
      }
      putImageData(ctx, data)
    },
  },
  {
    id: 'invert',
    label: 'Invert',
    emoji: '🔄',
    category: 'special',
    apply: (ctx, canvas) => {
      const data = getImageData(ctx, canvas)
      const d = data.data
      for (let i = 0; i < d.length; i += 4) {
        d[i] = 255 - d[i]
        d[i + 1] = 255 - d[i + 1]
        d[i + 2] = 255 - d[i + 2]
      }
      putImageData(ctx, data)
    },
  },
  {
    id: 'pixel',
    label: 'Pixel',
    emoji: '🟩',
    category: 'special',
    apply: (ctx, canvas) => {
      const size = 8
      const w = canvas.width
      const h = canvas.height
      const data = getImageData(ctx, canvas)
      const d = data.data
      for (let y = 0; y < h; y += size) {
        for (let x = 0; x < w; x += size) {
          let r = 0, g = 0, b = 0, count = 0
          for (let dy = 0; dy < size && y + dy < h; dy++) {
            for (let dx = 0; dx < size && x + dx < w; dx++) {
              const idx = ((y + dy) * w + (x + dx)) * 4
              r += d[idx]; g += d[idx + 1]; b += d[idx + 2]; count++
            }
          }
          r /= count; g /= count; b /= count
          for (let dy = 0; dy < size && y + dy < h; dy++) {
            for (let dx = 0; dx < size && x + dx < w; dx++) {
              const idx = ((y + dy) * w + (x + dx)) * 4
              d[idx] = r; d[idx + 1] = g; d[idx + 2] = b
            }
          }
        }
      }
      putImageData(ctx, data)
    },
  },
  {
    id: 'posterize',
    label: 'Poster',
    emoji: '🎨',
    category: 'artistic',
    apply: (ctx, canvas) => {
      const data = getImageData(ctx, canvas)
      const d = data.data
      const levels = 5
      const step = 255 / levels
      for (let i = 0; i < d.length; i += 4) {
        d[i] = Math.round(d[i] / step) * step
        d[i + 1] = Math.round(d[i + 1] / step) * step
        d[i + 2] = Math.round(d[i + 2] / step) * step
      }
      putImageData(ctx, data)
    },
  },
  {
    id: 'vignette',
    label: 'Vignette',
    emoji: '🔲',
    category: 'vintage',
    apply: (ctx, canvas) => {
      const { width: w, height: h } = canvas
      const gradient = ctx.createRadialGradient(w / 2, h / 2, w * 0.25, w / 2, h / 2, w * 0.7)
      gradient.addColorStop(0, 'rgba(0,0,0,0)')
      gradient.addColorStop(1, 'rgba(0,0,0,0.6)')
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, w, h)
    },
  },
]

// ─── Apply filter to an image URL ────────────────────────────

export async function applyFilterToImage(
  imageUrl: string,
  filterId: string,
): Promise<string> {
  const filter = IMAGE_FILTERS.find(f => f.id === filterId)
  if (!filter || filterId === 'none') return imageUrl

  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext('2d')
      if (!ctx) return reject('No 2d context')
      ctx.drawImage(img, 0, 0)
      filter.apply(ctx, canvas)
      resolve(canvas.toDataURL('image/png'))
    }
    img.onerror = () => reject(new Error('Failed to load image'))
    img.src = imageUrl
  })
}

export const FILTER_CATEGORIES = [
  { id: 'color', label: 'Color', emoji: '🎨' },
  { id: 'vintage', label: 'Vintage', emoji: '📷' },
  { id: 'artistic', label: 'Artistic', emoji: '🖌️' },
  { id: 'special', label: 'Special', emoji: '✨' },
] as const
