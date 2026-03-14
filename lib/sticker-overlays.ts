/**
 * 2D overlay definitions for sticker pack
 * Overlays are drawn on top of the 3D render using Canvas2D
 */

// ─── Types ───────────────────────────────────────────────────

export interface StickerOverlay {
  id: string
  label: string
  emoji: string
  /** Draw function receives canvas context + dimensions */
  draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void
}

// ─── Overlay drawing helpers ────────────────────────────────

function drawHearts(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const hearts = [
    { x: 0.15, y: 0.15, size: 28, rotation: -20 },
    { x: 0.85, y: 0.1, size: 22, rotation: 15 },
    { x: 0.1, y: 0.75, size: 18, rotation: -10 },
    { x: 0.9, y: 0.7, size: 24, rotation: 25 },
    { x: 0.75, y: 0.35, size: 16, rotation: -5 },
  ]

  hearts.forEach(({ x, y, size, rotation }) => {
    ctx.save()
    ctx.translate(x * w, y * h)
    ctx.rotate((rotation * Math.PI) / 180)
    ctx.font = `${size}px serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('❤️', 0, 0)
    ctx.restore()
  })
}

function drawStars(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const stars = [
    { x: 0.12, y: 0.12, size: 24 },
    { x: 0.88, y: 0.08, size: 20 },
    { x: 0.08, y: 0.85, size: 16 },
    { x: 0.92, y: 0.78, size: 22 },
    { x: 0.2, y: 0.45, size: 14 },
    { x: 0.82, y: 0.5, size: 18 },
  ]

  stars.forEach(({ x, y, size }) => {
    ctx.font = `${size}px serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('✨', x * w, y * h)
  })
}

function drawSparkles(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const sparkles = [
    { x: 0.1, y: 0.15, size: 20 },
    { x: 0.9, y: 0.1, size: 18 },
    { x: 0.15, y: 0.8, size: 14 },
    { x: 0.85, y: 0.85, size: 22 },
    { x: 0.5, y: 0.05, size: 16 },
  ]

  sparkles.forEach(({ x, y, size }) => {
    ctx.font = `${size}px serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('💫', x * w, y * h)
  })
}

function drawFire(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const fires = [
    { x: 0.15, y: 0.85, size: 30 },
    { x: 0.35, y: 0.9, size: 26 },
    { x: 0.55, y: 0.87, size: 32 },
    { x: 0.75, y: 0.88, size: 28 },
    { x: 0.9, y: 0.85, size: 24 },
  ]

  fires.forEach(({ x, y, size }) => {
    ctx.font = `${size}px serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('🔥', x * w, y * h)
  })
}

function drawLightning(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const bolts = [
    { x: 0.1, y: 0.2, size: 36, rotation: -15 },
    { x: 0.9, y: 0.15, size: 32, rotation: 20 },
    { x: 0.15, y: 0.7, size: 28, rotation: -10 },
    { x: 0.85, y: 0.75, size: 30, rotation: 10 },
  ]

  bolts.forEach(({ x, y, size, rotation }) => {
    ctx.save()
    ctx.translate(x * w, y * h)
    ctx.rotate((rotation * Math.PI) / 180)
    ctx.font = `${size}px serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('⚡', 0, 0)
    ctx.restore()
  })
}

function drawConfetti(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const emojis = ['🎉', '🎊', '✨', '🎈', '🎀']
  const positions = [
    { x: 0.1, y: 0.1, size: 22 },
    { x: 0.9, y: 0.08, size: 20 },
    { x: 0.05, y: 0.5, size: 18 },
    { x: 0.95, y: 0.45, size: 24 },
    { x: 0.15, y: 0.85, size: 20 },
    { x: 0.85, y: 0.9, size: 22 },
    { x: 0.5, y: 0.05, size: 26 },
  ]

  positions.forEach(({ x, y, size }, i) => {
    ctx.font = `${size}px serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(emojis[i % emojis.length], x * w, y * h)
  })
}

function drawCrying(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const tears = [
    { x: 0.3, y: 0.55, size: 18 },
    { x: 0.7, y: 0.55, size: 18 },
    { x: 0.25, y: 0.65, size: 14 },
    { x: 0.75, y: 0.65, size: 14 },
    { x: 0.3, y: 0.75, size: 10 },
    { x: 0.7, y: 0.75, size: 10 },
  ]

  tears.forEach(({ x, y, size }) => {
    ctx.font = `${size}px serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('💧', x * w, y * h)
  })
}

function drawMusic(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const notes = ['🎵', '🎶', '♪', '🎵', '🎶']
  const positions = [
    { x: 0.1, y: 0.15, size: 22 },
    { x: 0.85, y: 0.1, size: 26 },
    { x: 0.15, y: 0.6, size: 18 },
    { x: 0.9, y: 0.55, size: 20 },
    { x: 0.5, y: 0.05, size: 24 },
  ]

  positions.forEach(({ x, y, size }, i) => {
    ctx.font = `${size}px serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(notes[i], x * w, y * h)
  })
}

// ─── Overlay presets ─────────────────────────────────────────

export const OVERLAY_PRESETS: StickerOverlay[] = [
  { id: 'none', label: 'None', emoji: '🚫', draw: () => {} },
  { id: 'hearts', label: 'Hearts', emoji: '❤️', draw: drawHearts },
  { id: 'stars', label: 'Stars', emoji: '⭐', draw: drawStars },
  { id: 'sparkles', label: 'Sparkles', emoji: '💫', draw: drawSparkles },
  { id: 'fire', label: 'Fire', emoji: '🔥', draw: drawFire },
  { id: 'lightning', label: 'Lightning', emoji: '⚡', draw: drawLightning },
  { id: 'confetti', label: 'Confetti', emoji: '🎉', draw: drawConfetti },
  { id: 'crying', label: 'Tears', emoji: '💧', draw: drawCrying },
  { id: 'music', label: 'Music', emoji: '🎵', draw: drawMusic },
]
