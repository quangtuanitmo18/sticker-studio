// ─── Photobooth shared constants & utilities ─────────────────

// Strip background themes
export const STRIP_BACKGROUNDS = [
  { id: 'white', label: 'White', css: '#ffffff' },
  { id: 'black', label: 'Dark', css: '#1a1a1a' },
  { id: 'cream', label: 'Cream', css: '#fef3c7' },
  { id: 'blush', label: 'Blush', css: '#fce7f3' },
  { id: 'mint', label: 'Mint', css: '#d1fae5' },
  { id: 'lavender', label: 'Lavender', css: '#ede9fe' },
  { id: 'sunset', label: 'Sunset', css: 'linear-gradient(180deg, #FF6B4A, #F59E0B)' },
  { id: 'ocean', label: 'Ocean', css: 'linear-gradient(180deg, #3B82F6, #10B981)' },
  { id: 'berry', label: 'Berry', css: 'linear-gradient(180deg, #8B5CF6, #EC4899)' },
  { id: 'night', label: 'Night', css: 'linear-gradient(180deg, #0f172a, #1e3a5f)' },
  { id: 'gold', label: 'Gold', css: 'linear-gradient(180deg, #F59E0B, #d97706)' },
  { id: 'confetti', label: 'Confetti', css: '#ffffff', pattern: 'confetti' },
  { id: 'polka', label: 'Polka', css: '#fce7f3', pattern: 'polka' },
  { id: 'stripes', label: 'Stripes', css: '#ede9fe', pattern: 'stripes' },
]

// Scene presets — 1-click setup
export const SCENE_PRESETS = [
  { id: 'classic', label: '📷 Classic', filter: 'none', frame: 'classic', bg: 'white', font: 'Impact', fill:'#000', desc: 'Clean white borders' },
  { id: 'wedding', label: '💒 Wedding', filter: 'fade', frame: 'gold', bg: 'cream', font: 'Georgia', fill:'#8B7355', desc: 'Elegant & warm' },
  { id: 'party', label: '🎉 Party', filter: 'vivid', frame: 'coral', bg: 'confetti', font: 'Comic Sans MS', fill:'#FF6B4A', desc: 'Fun & colorful' },
  { id: 'retro', label: '📼 Retro', filter: 'vintage', frame: 'none', bg: 'cream', font: 'Courier New', fill:'#8B4513', desc: 'Nostalgic vibes' },
  { id: 'neon', label: '🌃 Neon', filter: 'neon', frame: 'gradient3', bg: 'night', font: 'Arial Black', fill:'#00e5ff', desc: 'Cyberpunk glow' },
  { id: 'bw', label: '🖤 B&W', filter: 'grayscale', frame: 'black', bg: 'black', font: 'Georgia', fill:'#fff', desc: 'Timeless monochrome' },
  { id: 'summer', label: '☀️ Summer', filter: 'warm', frame: 'gradient1', bg: 'sunset', font: 'Verdana', fill:'#fff', desc: 'Golden hour' },
  { id: 'dreamy', label: '✨ Dreamy', filter: 'fade', frame: 'gradient2', bg: 'lavender', font: 'Georgia', fill:'#7c3aed', desc: 'Soft & ethereal' },
]

// Face props
export const FACE_PROPS = [
  { id: 'crown', label: '👑', src: 'https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/svg/1f451.svg', y: -15 },
  { id: 'tophat', label: '🎩', src: 'https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/svg/1f3a9.svg', y: -15 },
  { id: 'party', label: '🥳', src: 'https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/svg/1f973.svg', y: 0 },
  { id: 'sunglasses', label: '🕶️', src: 'https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/svg/1f576.svg', y: 5 },
  { id: 'nerd', label: '🤓', src: 'https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/svg/1f913.svg', y: 0 },
  { id: 'kiss', label: '💋', src: 'https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/svg/1f48b.svg', y: 10 },
  { id: 'star', label: '⭐', src: 'https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/svg/2b50.svg', y: -10 },
  { id: 'heart', label: '❤️', src: 'https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/svg/2764.svg', y: -10 },
  { id: 'fire', label: '🔥', src: 'https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/svg/1f525.svg', y: -10 },
  { id: 'rainbow', label: '🌈', src: 'https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/svg/1f308.svg', y: -15 },
  { id: 'sparkles', label: '✨', src: 'https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/svg/2728.svg', y: -10 },
  { id: 'butterfly', label: '🦋', src: 'https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/svg/1f98b.svg', y: -12 },
  { id: 'flower', label: '🌸', src: 'https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/svg/1f338.svg', y: -10 },
  { id: 'clown', label: '🤡', src: 'https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/svg/1f921.svg', y: 0 },
  { id: 'devil', label: '😈', src: 'https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/svg/1f608.svg', y: 0 },
  { id: 'alien', label: '👽', src: 'https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/svg/1f47d.svg', y: 0 },
]

// Photo frames
export const PHOTO_FRAMES = [
  { id: 'none', label: 'None', emoji: '✖️', border: 0, color: 'transparent', radius: 0 },
  { id: 'classic', label: 'Classic', emoji: '⬜', border: 16, color: '#ffffff', radius: 4 },
  { id: 'black', label: 'Dark', emoji: '⬛', border: 16, color: '#1a1a1a', radius: 4 },
  { id: 'gold', label: 'Gold', emoji: '🟡', border: 12, color: '#d4a017', radius: 8 },
  { id: 'coral', label: 'Coral', emoji: '🟠', border: 12, color: '#FF6B4A', radius: 12 },
  { id: 'gradient1', label: 'Sunset', emoji: '🌅', border: 14, color: 'linear-gradient(135deg, #FF6B4A, #F59E0B)', radius: 12 },
  { id: 'gradient2', label: 'Ocean', emoji: '🌊', border: 14, color: 'linear-gradient(135deg, #3B82F6, #10B981)', radius: 12 },
  { id: 'gradient3', label: 'Berry', emoji: '🫐', border: 14, color: 'linear-gradient(135deg, #8B5CF6, #EC4899)', radius: 12 },
]

// Strip templates
export interface StripTemplate {
  id: string; label: string; emoji: string; slots: number
  render: (ctx: CanvasRenderingContext2D, photos: HTMLCanvasElement[], W: number, H: number, bgColor: string) => void
}

function drawPhotoFill(ctx: CanvasRenderingContext2D, photo: HTMLCanvasElement, x: number, y: number, w: number, h: number, r: number) {
  ctx.save(); ctx.beginPath(); ctx.roundRect(x, y, w, h, r); ctx.clip()
  const scale = Math.max(w / photo.width, h / photo.height)
  ctx.drawImage(photo, x + (w - photo.width * scale) / 2, y + (h - photo.height * scale) / 2, photo.width * scale, photo.height * scale)
  ctx.restore()
}

function fillStripBg(ctx: CanvasRenderingContext2D, W: number, H: number, bgCss: string, pattern?: string) {
  if (bgCss.startsWith('linear-gradient')) {
    const colors = bgCss.match(/#[a-fA-F0-9]{6}/g) || ['#fff', '#fff']
    const grad = ctx.createLinearGradient(0, 0, 0, H)
    grad.addColorStop(0, colors[0]); grad.addColorStop(1, colors[1] || colors[0])
    ctx.fillStyle = grad
  } else {
    ctx.fillStyle = bgCss
  }
  ctx.fillRect(0, 0, W, H)
  if (pattern === 'confetti') {
    const confettiColors = ['#FF6B4A', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899']
    for (let i = 0; i < 60; i++) {
      ctx.fillStyle = confettiColors[i % confettiColors.length]
      ctx.globalAlpha = 0.15
      ctx.fillRect(Math.random() * W, Math.random() * H, 6 + Math.random() * 8, 3 + Math.random() * 4)
    }
    ctx.globalAlpha = 1
  } else if (pattern === 'polka') {
    ctx.fillStyle = 'rgba(0,0,0,0.04)'
    for (let y = 0; y < H; y += 24) for (let x = (y % 48 === 0 ? 0 : 12); x < W; x += 24) {
      ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI * 2); ctx.fill()
    }
  } else if (pattern === 'stripes') {
    ctx.fillStyle = 'rgba(0,0,0,0.03)'
    for (let x = -H; x < W + H; x += 16) {
      ctx.save(); ctx.translate(x, 0); ctx.rotate(Math.PI / 4); ctx.fillRect(0, 0, 6, H * 2); ctx.restore()
    }
  }
}

export const STRIP_TEMPLATES: StripTemplate[] = [
  {
    id: 'classic4', label: 'Classic 4', emoji: '🎞️', slots: 4,
    render: (ctx, photos, W, H, bg) => {
      const bgDef = STRIP_BACKGROUNDS.find(b => b.id === bg) || STRIP_BACKGROUNDS[0]
      fillStripBg(ctx, W, H, bgDef.css, bgDef.pattern)
      const pad = 24, slotH = (H - pad * 5) / 4
      photos.slice(0, 4).forEach((p, i) => drawPhotoFill(ctx, p, pad, pad + i * (slotH + pad), W - pad * 2, slotH, 8))
    },
  },
  {
    id: 'grid2x2', label: '2×2 Grid', emoji: '⬜', slots: 4,
    render: (ctx, photos, W, H, bg) => {
      const bgDef = STRIP_BACKGROUNDS.find(b => b.id === bg) || STRIP_BACKGROUNDS[0]
      fillStripBg(ctx, W, H, bgDef.css, bgDef.pattern)
      const pad = 20, cw = (W - pad * 3) / 2, ch = (H - pad * 3) / 2
      const pos = [[pad, pad], [pad * 2 + cw, pad], [pad, pad * 2 + ch], [pad * 2 + cw, pad * 2 + ch]]
      photos.slice(0, 4).forEach((p, i) => drawPhotoFill(ctx, p, pos[i][0], pos[i][1], cw, ch, 8))
    },
  },
  {
    id: 'polaroid', label: 'Polaroid', emoji: '📸', slots: 1,
    render: (ctx, photos, W, H, bg) => {
      const bgDef = STRIP_BACKGROUNDS.find(b => b.id === bg) || STRIP_BACKGROUNDS[0]
      fillStripBg(ctx, W, H, bgDef.css, bgDef.pattern)
      const pad = 40, bPad = 100
      ctx.shadowColor = 'rgba(0,0,0,0.15)'; ctx.shadowBlur = 20; ctx.shadowOffsetY = 8
      if (photos[0]) drawPhotoFill(ctx, photos[0], pad, pad, W - pad * 2, H - pad - bPad, 4)
      ctx.shadowBlur = 0
      ctx.fillStyle = '#666'; ctx.font = '24px Georgia'; ctx.textAlign = 'center'
      ctx.fillText(new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }), W / 2, H - bPad / 2 + 10)
    },
  },
  {
    id: 'filmstrip', label: 'Film Strip', emoji: '🎬', slots: 3,
    render: (ctx, photos, W, H, bg) => {
      ctx.fillStyle = '#1a1a1a'; ctx.fillRect(0, 0, W, H)
      for (let y = 20; y < H; y += 40) {
        ctx.fillStyle = '#333'
        ctx.beginPath(); ctx.arc(18, y, 8, 0, Math.PI * 2); ctx.fill()
        ctx.beginPath(); ctx.arc(W - 18, y, 8, 0, Math.PI * 2); ctx.fill()
      }
      const pad = 44, slotH = (H - pad * 4) / 3
      photos.slice(0, 3).forEach((p, i) => drawPhotoFill(ctx, p, pad, pad + i * (slotH + pad), W - pad * 2, slotH, 4))
    },
  },
  {
    id: 'strip3_banner', label: '3 + Banner', emoji: '🏷️', slots: 3,
    render: (ctx, photos, W, H, bg) => {
      const bgDef = STRIP_BACKGROUNDS.find(b => b.id === bg) || STRIP_BACKGROUNDS[0]
      fillStripBg(ctx, W, H, bgDef.css, bgDef.pattern)
      const pad = 20, bannerH = 80, slotH = (H - pad * 4 - bannerH) / 3
      photos.slice(0, 3).forEach((p, i) => drawPhotoFill(ctx, p, pad, pad + i * (slotH + pad), W - pad * 2, slotH, 8))
      const by = H - bannerH - pad / 2
      ctx.fillStyle = '#FF6B4A'; ctx.beginPath(); ctx.roundRect(pad, by, W - pad * 2, bannerH, 12); ctx.fill()
      ctx.fillStyle = '#fff'; ctx.font = 'bold 28px Impact'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
      ctx.fillText('PHOTOBOOTH ⚡', W / 2, by + bannerH / 2)
    },
  },
]

// Sound effects via Web Audio API
export function playShutterSound() {
  try {
    const ctx = new AudioContext()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain); gain.connect(ctx.destination)
    osc.frequency.setValueAtTime(800, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.08)
    gain.gain.setValueAtTime(0.3, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1)
    osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.1)
  } catch {}
}

export function playBeep() {
  try {
    const ctx = new AudioContext()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain); gain.connect(ctx.destination)
    osc.type = 'sine'
    osc.frequency.setValueAtTime(880, ctx.currentTime)
    gain.gain.setValueAtTime(0.15, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15)
    osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.15)
  } catch {}
}

export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}
