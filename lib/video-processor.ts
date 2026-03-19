/**
 * Client-side video processing utilities.
 * Handles: video loading, frame extraction, trimming, speed, overlays.
 * No server required — uses HTML5 Video + Canvas APIs.
 */

// ─── Types ──────────────────────────────────────────────────

export interface VideoMetadata {
  duration: number
  width: number
  height: number
}

export interface TrimRange {
  start: number
  end: number
}

export interface FrameExtractionOptions {
  trim: TrimRange
  speed: number
  fps: number
  maxSize: number
  filter?: string
}

export interface TextOverlay {
  id: string
  text: string
  x: number // 0–1 relative
  y: number // 0–1 relative
  fontSize: number
  fontFamily: string
  fill: string
  stroke: string
  strokeWidth: number
  animationPreset: string
}

export interface StickerOverlay {
  id: string
  src: string
  x: number
  y: number
  size: number
}

// ─── Text Animation Presets ─────────────────────────────────

export const TEXT_ANIMATION_PRESETS = [
  { id: 'none', label: 'Static', emoji: '📌', desc: 'No animation' },
  { id: 'bounce', label: 'Bounce', emoji: '⬆️', desc: 'Bouncing text' },
  { id: 'fade', label: 'Fade', emoji: '🌫️', desc: 'Fade in and out' },
  { id: 'typewriter', label: 'Typewriter', emoji: '⌨️', desc: 'Type letter by letter' },
  { id: 'slide', label: 'Slide In', emoji: '➡️', desc: 'Slide from right' },
  { id: 'glow', label: 'Pulse', emoji: '✨', desc: 'Pulsing glow effect' },
  { id: 'shake', label: 'Shake', emoji: '📳', desc: 'Shaky text' },
  { id: 'wave', label: 'Wave', emoji: '🌊', desc: 'Wavy motion' },
  { id: 'zoom', label: 'Zoom In', emoji: '🔍', desc: 'Zoom in entrance' },
]

interface TextAnimTransform {
  translateX: number
  translateY: number
  opacity: number
  scale: number
  rotation: number
  visibleChars?: number
}

function getTextAnimation(
  presetId: string | undefined,
  frame: number,
  total: number,
): TextAnimTransform {
  const t = total > 1 ? frame / (total - 1) : 0
  const none: TextAnimTransform = {
    translateX: 0,
    translateY: 0,
    opacity: 1,
    scale: 1,
    rotation: 0,
  }
  if (!presetId || presetId === 'none') return none

  switch (presetId) {
    case 'bounce':
      return { ...none, translateY: -Math.abs(Math.sin(t * Math.PI * 2)) * 20 }
    case 'fade':
      return { ...none, opacity: 0.3 + Math.sin(t * Math.PI) * 0.7 }
    case 'typewriter':
      return { ...none, visibleChars: Math.floor(t * 20) + 1 }
    case 'slide':
      return {
        ...none,
        translateX: (1 - Math.min(t * 3, 1)) * 200,
        opacity: Math.min(t * 3, 1),
      }
    case 'glow':
      return { ...none, scale: 1 + Math.sin(t * Math.PI * 2) * 0.12 }
    case 'shake':
      return {
        ...none,
        translateX: Math.sin(t * Math.PI * 8) * 8,
        rotation: Math.sin(t * Math.PI * 6) * 5,
      }
    case 'wave':
      return {
        ...none,
        translateY: Math.sin(t * Math.PI * 4) * 15,
        rotation: Math.sin(t * Math.PI * 2) * 10,
      }
    case 'zoom': {
      const s = t < 0.3 ? t / 0.3 : 1
      return { ...none, scale: s, opacity: s }
    }
    default:
      return none
  }
}

// ─── Video loading ──────────────────────────────────────────

export function loadVideo(
  source: File | Blob | string,
): Promise<{ video: HTMLVideoElement; metadata: VideoMetadata }> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video')
    video.muted = true
    video.playsInline = true
    video.preload = 'auto'
    video.crossOrigin = 'anonymous'

    video.onloadedmetadata = () => {
      resolve({
        video,
        metadata: {
          duration: video.duration,
          width: video.videoWidth,
          height: video.videoHeight,
        },
      })
    }
    video.onerror = () => reject(new Error('Failed to load video'))

    if (source instanceof File || source instanceof Blob) {
      video.src = URL.createObjectURL(source)
    } else {
      video.src = source
    }
  })
}

// ─── Frame capture ──────────────────────────────────────────

function seekTo(video: HTMLVideoElement, time: number): Promise<void> {
  return new Promise((resolve, reject) => {
    const onSeeked = () => {
      video.removeEventListener('seeked', onSeeked)
      resolve()
    }
    video.addEventListener('seeked', onSeeked)
    video.currentTime = time
    setTimeout(() => {
      video.removeEventListener('seeked', onSeeked)
      reject(new Error('Seek timeout'))
    }, 5000)
  })
}

export async function captureFrameAsDataUrl(
  video: HTMLVideoElement,
  time: number,
  maxSize?: number,
): Promise<string> {
  await seekTo(video, time)

  let w = video.videoWidth
  let h = video.videoHeight
  if (maxSize && (w > maxSize || h > maxSize)) {
    const scale = maxSize / Math.max(w, h)
    w = Math.round(w * scale)
    h = Math.round(h * scale)
  }

  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(video, 0, 0, w, h)
  return canvas.toDataURL('image/jpeg', 0.7)
}

// ─── Thumbnail strip ────────────────────────────────────────

export async function generateThumbnails(
  originalVideo: HTMLVideoElement,
  count = 12,
  height = 48,
): Promise<string[]> {
  // Create an isolated background video so we don't disrupt the main playback with seeking!
  const video = document.createElement('video')
  video.src = originalVideo.src
  video.muted = true
  video.playsInline = true
  video.crossOrigin = 'anonymous'
  
  await new Promise<void>((resolve) => {
    if (video.readyState >= 1) resolve()
    else {
      video.onloadedmetadata = () => resolve()
      video.onerror = () => resolve() // don't hang if error
    }
  })

  const thumbs: string[] = []
  const interval = video.duration / count
  const ar = video.videoWidth / video.videoHeight
  const thumbW = Math.round(height * ar) || height // fallback

  for (let i = 0; i < count; i++) {
    try {
      await seekTo(video, i * interval)
      const canvas = document.createElement('canvas')
      canvas.width = thumbW
      canvas.height = height
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(video, 0, 0, thumbW, height)
      thumbs.push(canvas.toDataURL('image/jpeg', 0.5))
    } catch {
      thumbs.push('')
    }
  }
  
  // Clean up
  video.src = ''
  video.load()
  
  return thumbs
}

// ─── Full frame extraction for GIF ──────────────────────────

export async function extractFramesForGif(
  video: HTMLVideoElement,
  options: FrameExtractionOptions,
  textOverlays: TextOverlay[],
  stickerOverlays: StickerOverlay[],
  filterFn?: (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => void,
  onProgress?: (current: number, total: number) => void,
): Promise<ImageData[]> {
  const { trim, speed, fps, maxSize } = options
  const duration = (trim.end - trim.start) / speed
  const totalFrames = Math.max(1, Math.ceil(duration * fps))
  const frameInterval = (trim.end - trim.start) / totalFrames

  // Determine output size
  let outW = video.videoWidth
  let outH = video.videoHeight
  if (outW > maxSize || outH > maxSize) {
    const scale = maxSize / Math.max(outW, outH)
    outW = Math.round(outW * scale)
    outH = Math.round(outH * scale)
  }

  // Pre-load sticker images
  const stickerImages: Map<string, HTMLImageElement> = new Map()
  for (const s of stickerOverlays) {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.src = s.src
    await new Promise<void>((r) => {
      img.onload = () => r()
      img.onerror = () => r()
    })
    stickerImages.set(s.id, img)
  }

  const canvas = document.createElement('canvas')
  canvas.width = outW
  canvas.height = outH
  const ctx = canvas.getContext('2d')!

  const frames: ImageData[] = []

  for (let i = 0; i < totalFrames; i++) {
    const time = trim.start + i * frameInterval
    try {
      await seekTo(video, time)
    } catch {
      continue
    }

    ctx.clearRect(0, 0, outW, outH)
    ctx.drawImage(video, 0, 0, outW, outH)

    // Apply filter
    if (filterFn) filterFn(ctx, canvas)

    // Draw sticker overlays
    for (const s of stickerOverlays) {
      const img = stickerImages.get(s.id)
      if (img) {
        const boxW = (s.size / 100) * outW
        const boxH = (s.size / 100) * outH
        const scale = Math.min(boxW / img.width, boxH / img.height)
        const drawW = img.width * scale
        const drawH = img.height * scale
        ctx.drawImage(img, s.x * outW - drawW / 2, s.y * outH - drawH / 2, drawW, drawH)
      }
    }

    // Draw text overlays with animation
    for (const overlay of textOverlays) {
      drawAnimatedText(ctx, overlay, i, totalFrames, outW, outH)
    }

    frames.push(ctx.getImageData(0, 0, outW, outH))
    onProgress?.(i + 1, totalFrames)
  }

  return frames
}

function drawAnimatedText(
  ctx: CanvasRenderingContext2D,
  overlay: TextOverlay,
  frameIndex: number,
  totalFrames: number,
  canvasW: number,
  canvasH: number,
) {
  const x = overlay.x * canvasW
  const y = overlay.y * canvasH
  const anim = getTextAnimation(overlay.animationPreset, frameIndex, totalFrames)

  ctx.save()
  ctx.font = `bold ${overlay.fontSize}px ${overlay.fontFamily}`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.globalAlpha = anim.opacity
  ctx.translate(x + anim.translateX, y + anim.translateY)
  ctx.rotate((anim.rotation * Math.PI) / 180)
  ctx.scale(anim.scale, anim.scale)

  const displayText =
    anim.visibleChars !== undefined
      ? overlay.text.slice(0, anim.visibleChars)
      : overlay.text

  if (overlay.strokeWidth > 0) {
    ctx.strokeStyle = overlay.stroke
    ctx.lineWidth = overlay.strokeWidth
    ctx.lineJoin = 'round'
    ctx.strokeText(displayText, 0, 0)
  }
  ctx.fillStyle = overlay.fill
  ctx.fillText(displayText, 0, 0)

  ctx.restore()
}

// ─── Format helpers ─────────────────────────────────────────

export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  const ms = Math.floor((seconds % 1) * 10)
  return `${m}:${String(s).padStart(2, '0')}.${ms}`
}
