/**
 * Sticker frame & shape templates
 * Provides clip paths and decorative frames for sticker customization
 * Used by: Maker page border panel
 */

// ─── Types ───────────────────────────────────────────────────

export interface StickerFrame {
  id: string
  label: string
  emoji: string
  category: 'basic' | 'fun' | 'decorative' | 'speech'
  /** Draws clip path on the canvas context */
  clipPath: (ctx: CanvasRenderingContext2D, w: number, h: number) => void
  /** Optional: draws decorative border after clipping */
  drawBorder?: (ctx: CanvasRenderingContext2D, w: number, h: number) => void
}

// ─── Path Helpers ────────────────────────────────────────────

function roundedRect(ctx: CanvasRenderingContext2D, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(r, 0)
  ctx.lineTo(w - r, 0)
  ctx.quadraticCurveTo(w, 0, w, r)
  ctx.lineTo(w, h - r)
  ctx.quadraticCurveTo(w, h, w - r, h)
  ctx.lineTo(r, h)
  ctx.quadraticCurveTo(0, h, 0, h - r)
  ctx.lineTo(0, r)
  ctx.quadraticCurveTo(0, 0, r, 0)
  ctx.closePath()
}

function circle(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const r = Math.min(w, h) / 2
  ctx.beginPath()
  ctx.arc(w / 2, h / 2, r, 0, Math.PI * 2)
  ctx.closePath()
}

function heart(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const cx = w / 2, s = Math.min(w, h) * 0.45
  ctx.beginPath()
  ctx.moveTo(cx, h * 0.85)
  ctx.bezierCurveTo(cx - s * 2.2, h * 0.45, cx - s * 1.2, h * 0.05, cx, h * 0.35)
  ctx.bezierCurveTo(cx + s * 1.2, h * 0.05, cx + s * 2.2, h * 0.45, cx, h * 0.85)
  ctx.closePath()
}

function star(ctx: CanvasRenderingContext2D, w: number, h: number, points = 5) {
  const cx = w / 2, cy = h / 2
  const outer = Math.min(w, h) * 0.48
  const inner = outer * 0.4
  ctx.beginPath()
  for (let i = 0; i < points * 2; i++) {
    const angle = (i * Math.PI) / points - Math.PI / 2
    const r = i % 2 === 0 ? outer : inner
    const x = cx + Math.cos(angle) * r
    const y = cy + Math.sin(angle) * r
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
  }
  ctx.closePath()
}

function hexagon(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const cx = w / 2, cy = h / 2
  const r = Math.min(w, h) * 0.47
  ctx.beginPath()
  for (let i = 0; i < 6; i++) {
    const angle = (i * Math.PI) / 3 - Math.PI / 6
    const x = cx + Math.cos(angle) * r
    const y = cy + Math.sin(angle) * r
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
  }
  ctx.closePath()
}

function diamond(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const cx = w / 2, cy = h / 2
  const rx = w * 0.45, ry = h * 0.45
  ctx.beginPath()
  ctx.moveTo(cx, cy - ry)
  ctx.lineTo(cx + rx, cy)
  ctx.lineTo(cx, cy + ry)
  ctx.lineTo(cx - rx, cy)
  ctx.closePath()
}

function cloud(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const cx = w / 2, cy = h / 2
  const s = Math.min(w, h) * 0.22
  ctx.beginPath()
  ctx.arc(cx, cy + s * 0.3, s * 1.5, 0, Math.PI * 2)
  ctx.arc(cx - s * 1.2, cy + s * 0.1, s, 0, Math.PI * 2)
  ctx.arc(cx + s * 1.2, cy + s * 0.1, s, 0, Math.PI * 2)
  ctx.arc(cx - s * 0.5, cy - s * 0.6, s * 1.1, 0, Math.PI * 2)
  ctx.arc(cx + s * 0.5, cy - s * 0.6, s * 1.1, 0, Math.PI * 2)
  ctx.closePath()
}

function speechBubble(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const r = Math.min(w, h) * 0.08
  const bw = w * 0.85, bh = h * 0.7
  const bx = (w - bw) / 2, by = (h - bh) / 2.5
  ctx.beginPath()
  ctx.moveTo(bx + r, by)
  ctx.lineTo(bx + bw - r, by)
  ctx.quadraticCurveTo(bx + bw, by, bx + bw, by + r)
  ctx.lineTo(bx + bw, by + bh - r)
  ctx.quadraticCurveTo(bx + bw, by + bh, bx + bw - r, by + bh)
  ctx.lineTo(bx + bw * 0.35, by + bh)
  ctx.lineTo(bx + bw * 0.2, by + bh + h * 0.15)
  ctx.lineTo(bx + bw * 0.25, by + bh)
  ctx.lineTo(bx + r, by + bh)
  ctx.quadraticCurveTo(bx, by + bh, bx, by + bh - r)
  ctx.lineTo(bx, by + r)
  ctx.quadraticCurveTo(bx, by, bx + r, by)
  ctx.closePath()
}

function thoughtBubble(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const cx = w / 2, cy = h * 0.42
  const rx = w * 0.38, ry = h * 0.32
  ctx.beginPath()
  ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2)
  ctx.closePath()
  // Small bubbles
  ctx.moveTo(w * 0.32, h * 0.76)
  ctx.arc(w * 0.3, h * 0.76, w * 0.04, 0, Math.PI * 2)
  ctx.moveTo(w * 0.24, h * 0.86)
  ctx.arc(w * 0.22, h * 0.86, w * 0.025, 0, Math.PI * 2)
}

function burst(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const cx = w / 2, cy = h / 2
  const outer = Math.min(w, h) * 0.48
  const inner = outer * 0.65
  const points = 12
  ctx.beginPath()
  for (let i = 0; i < points * 2; i++) {
    const angle = (i * Math.PI) / points - Math.PI / 2
    const r = i % 2 === 0 ? outer : inner
    const x = cx + Math.cos(angle) * r
    const y = cy + Math.sin(angle) * r
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
  }
  ctx.closePath()
}

function shield(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const cx = w / 2
  const top = h * 0.08
  const bottom = h * 0.88
  const sw = w * 0.44
  ctx.beginPath()
  ctx.moveTo(cx, top)
  ctx.lineTo(cx + sw, top + h * 0.08)
  ctx.lineTo(cx + sw, h * 0.55)
  ctx.quadraticCurveTo(cx + sw, h * 0.7, cx, bottom)
  ctx.quadraticCurveTo(cx - sw, h * 0.7, cx - sw, h * 0.55)
  ctx.lineTo(cx - sw, top + h * 0.08)
  ctx.closePath()
}

// ─── Frame Definitions ──────────────────────────────────────

export const STICKER_FRAMES: StickerFrame[] = [
  {
    id: 'none',
    label: 'None',
    emoji: '🚫',
    category: 'basic',
    clipPath: () => {},
  },
  {
    id: 'rounded',
    label: 'Rounded',
    emoji: '⬜',
    category: 'basic',
    clipPath: (ctx, w, h) => roundedRect(ctx, w, h, Math.min(w, h) * 0.1),
  },
  {
    id: 'circle',
    label: 'Circle',
    emoji: '⭕',
    category: 'basic',
    clipPath: (ctx, w, h) => circle(ctx, w, h),
  },
  {
    id: 'heart',
    label: 'Heart',
    emoji: '❤️',
    category: 'fun',
    clipPath: (ctx, w, h) => heart(ctx, w, h),
  },
  {
    id: 'star',
    label: 'Star',
    emoji: '⭐',
    category: 'fun',
    clipPath: (ctx, w, h) => star(ctx, w, h),
  },
  {
    id: 'hexagon',
    label: 'Hexagon',
    emoji: '⬡',
    category: 'basic',
    clipPath: (ctx, w, h) => hexagon(ctx, w, h),
  },
  {
    id: 'diamond',
    label: 'Diamond',
    emoji: '💎',
    category: 'basic',
    clipPath: (ctx, w, h) => diamond(ctx, w, h),
  },
  {
    id: 'cloud',
    label: 'Cloud',
    emoji: '☁️',
    category: 'fun',
    clipPath: (ctx, w, h) => cloud(ctx, w, h),
  },
  {
    id: 'speech',
    label: 'Speech',
    emoji: '💬',
    category: 'speech',
    clipPath: (ctx, w, h) => speechBubble(ctx, w, h),
  },
  {
    id: 'thought',
    label: 'Thought',
    emoji: '💭',
    category: 'speech',
    clipPath: (ctx, w, h) => thoughtBubble(ctx, w, h),
  },
  {
    id: 'burst',
    label: 'Burst',
    emoji: '💥',
    category: 'fun',
    clipPath: (ctx, w, h) => burst(ctx, w, h),
  },
  {
    id: 'shield',
    label: 'Shield',
    emoji: '🛡️',
    category: 'decorative',
    clipPath: (ctx, w, h) => shield(ctx, w, h),
  },
  {
    id: 'stamp',
    label: 'Stamp',
    emoji: '📮',
    category: 'decorative',
    clipPath: (ctx, w, h) => {
      const m = Math.min(w, h) * 0.06
      const r = m * 0.6
      const cols = Math.floor(w / (m * 2))
      const rows = Math.floor(h / (m * 2))
      const dx = w / cols
      const dy = h / rows
      roundedRect(ctx, w, h, m * 2)
      // Scalloped edge
      for (let i = 0; i < cols; i++) {
        ctx.moveTo(i * dx + dx / 2, 0)
        ctx.arc(i * dx + dx / 2, 0, r, 0, Math.PI, true)
        ctx.moveTo(i * dx + dx / 2, h)
        ctx.arc(i * dx + dx / 2, h, r, Math.PI, 0, true)
      }
      for (let i = 0; i < rows; i++) {
        ctx.moveTo(0, i * dy + dy / 2)
        ctx.arc(0, i * dy + dy / 2, r, Math.PI / 2, -Math.PI / 2, true)
        ctx.moveTo(w, i * dy + dy / 2)
        ctx.arc(w, i * dy + dy / 2, r, -Math.PI / 2, Math.PI / 2, true)
      }
    },
  },
]

export const FRAME_CATEGORIES = [
  { id: 'basic', label: 'Basic', emoji: '⬜' },
  { id: 'fun', label: 'Fun', emoji: '🎉' },
  { id: 'speech', label: 'Speech', emoji: '💬' },
  { id: 'decorative', label: 'Decorative', emoji: '🎀' },
] as const

// ─── Apply frame to an image ─────────────────────────────────

export async function applyFrameToImage(
  imageUrl: string,
  frameId: string,
  borderColor = '#ffffff',
  borderWidth = 4,
): Promise<string> {
  const frame = STICKER_FRAMES.find(f => f.id === frameId)
  if (!frame || frameId === 'none') return imageUrl

  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      const pad = borderWidth * 2
      const canvas = document.createElement('canvas')
      canvas.width = img.width + pad
      canvas.height = img.height + pad
      const ctx = canvas.getContext('2d')
      if (!ctx) return reject('No 2d context')

      ctx.save()
      ctx.translate(pad / 2, pad / 2)

      // Draw border
      if (borderWidth > 0) {
        ctx.save()
        frame.clipPath(ctx, img.width, img.height)
        ctx.strokeStyle = borderColor
        ctx.lineWidth = borderWidth * 2
        ctx.stroke()
        ctx.restore()
      }

      // Clip and draw image
      ctx.save()
      frame.clipPath(ctx, img.width, img.height)
      ctx.clip()
      ctx.drawImage(img, 0, 0)
      ctx.restore()

      // Draw decorative border if exists
      if (frame.drawBorder) {
        frame.drawBorder(ctx, img.width, img.height)
      }

      ctx.restore()
      resolve(canvas.toDataURL('image/png'))
    }
    img.onerror = () => reject(new Error('Failed to load image'))
    img.src = imageUrl
  })
}
