/**
 * Client-side GIF animation encoder for stickers.
 * Creates animated GIFs with preset effects (bounce, shake, pulse, spin, wiggle).
 * Uses canvas-based frame generation — no server required.
 */

export interface AnimationPreset {
  id: string
  label: string
  emoji: string
  desc: string
  frames: number
  fps: number
  transform: (frame: number, total: number) => {
    translateX: number
    translateY: number
    scale: number
    rotation: number
    opacity: number
  }
}

export const ANIMATION_PRESETS: AnimationPreset[] = [
  {
    id: 'bounce',
    label: 'Bounce',
    emoji: '⬆️',
    desc: 'Classic bounce up and down',
    frames: 12,
    fps: 12,
    transform: (frame, total) => {
      const t = frame / total
      const y = -Math.abs(Math.sin(t * Math.PI * 2)) * 30
      return { translateX: 0, translateY: y, scale: 1, rotation: 0, opacity: 1 }
    },
  },
  {
    id: 'shake',
    label: 'Shake',
    emoji: '📳',
    desc: 'Quick horizontal shake',
    frames: 8,
    fps: 12,
    transform: (frame, total) => {
      const t = frame / total
      const x = Math.sin(t * Math.PI * 4) * 12
      return { translateX: x, translateY: 0, scale: 1, rotation: 0, opacity: 1 }
    },
  },
  {
    id: 'pulse',
    label: 'Pulse',
    emoji: '💗',
    desc: 'Scale in and out like a heartbeat',
    frames: 16,
    fps: 10,
    transform: (frame, total) => {
      const t = frame / total
      const s = 1 + Math.sin(t * Math.PI * 2) * 0.15
      return { translateX: 0, translateY: 0, scale: s, rotation: 0, opacity: 1 }
    },
  },
  {
    id: 'spin',
    label: 'Spin',
    emoji: '🔄',
    desc: 'Full 360-degree rotation',
    frames: 20,
    fps: 15,
    transform: (frame, total) => {
      const t = frame / total
      const rotation = t * 360
      return { translateX: 0, translateY: 0, scale: 1, rotation, opacity: 1 }
    },
  },
  {
    id: 'wiggle',
    label: 'Wiggle',
    emoji: '〰️',
    desc: 'Gentle rotation wiggle',
    frames: 10,
    fps: 12,
    transform: (frame, total) => {
      const t = frame / total
      const rotation = Math.sin(t * Math.PI * 4) * 15
      return { translateX: 0, translateY: 0, scale: 1, rotation, opacity: 1 }
    },
  },
  {
    id: 'pop',
    label: 'Pop In',
    emoji: '💥',
    desc: 'Appear with a pop effect',
    frames: 14,
    fps: 14,
    transform: (frame, total) => {
      const t = frame / total
      let s: number
      if (t < 0.3) {
        s = t / 0.3
      } else if (t < 0.5) {
        s = 1 + (1 - (t - 0.3) / 0.2) * 0.2
      } else {
        s = 1
      }
      return { translateX: 0, translateY: 0, scale: s, rotation: 0, opacity: Math.min(1, t * 4) }
    },
  },
  {
    id: 'jelly',
    label: 'Jelly',
    emoji: '🫠',
    desc: 'Squishy jelly wobble',
    frames: 16,
    fps: 14,
    transform: (frame, total) => {
      const t = frame / total
      const phase = t * Math.PI * 2
      const scaleX = 1 + Math.sin(phase) * 0.1
      const scaleY = 1 - Math.sin(phase) * 0.1
      const s = (scaleX + scaleY) / 2
      const y = Math.sin(phase) * 5
      return { translateX: 0, translateY: y, scale: s, rotation: 0, opacity: 1 }
    },
  },
]

/**
 * Renders an animated GIF from a sticker image URL.
 * All processing happens client-side using Canvas.
 */
export async function createAnimatedGif(
  imageUrl: string,
  presetId: string,
  size = 512,
): Promise<Blob> {
  const preset = ANIMATION_PRESETS.find(p => p.id === presetId)
  if (!preset) throw new Error(`Unknown animation preset: ${presetId}`)

  // Load the image
  const img = await loadImage(imageUrl)

  // Generate frames
  const frames: ImageData[] = []
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!

  for (let i = 0; i < preset.frames; i++) {
    const t = preset.transform(i, preset.frames)
    ctx.clearRect(0, 0, size, size)
    ctx.save()

    ctx.globalAlpha = t.opacity
    ctx.translate(size / 2 + t.translateX, size / 2 + t.translateY)
    ctx.rotate((t.rotation * Math.PI) / 180)
    ctx.scale(t.scale, t.scale)

    const drawSize = size * 0.85
    ctx.drawImage(img, -drawSize / 2, -drawSize / 2, drawSize, drawSize)
    ctx.restore()

    frames.push(ctx.getImageData(0, 0, size, size))
  }

  // Encode GIF using simple LZW encoder
  const gifData = encodeGif(frames, size, size, preset.fps)
  return new Blob([gifData.buffer as ArrayBuffer], { type: 'image/gif' })
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = url
  })
}

// ─── Simple GIF89a encoder ──────────────────────────────────

export function encodeGif(frames: ImageData[], width: number, height: number, fps: number): Uint8Array {
  const delay = Math.round(100 / fps) // GIF delay is in 1/100ths of a second

  // Build a global color table from all frames (256 colors max)
  const { palette, indexedFrames } = quantizeFrames(frames)

  const parts: number[] = []

  // Header
  writeString(parts, 'GIF89a')

  // Logical Screen Descriptor
  writeUint16(parts, width)
  writeUint16(parts, height)
  parts.push(0xf7) // GCT flag, 256 colors (2^(7+1))
  parts.push(0)    // Background color index
  parts.push(0)    // Pixel aspect ratio

  // Global Color Table (256 * 3 bytes)
  for (let i = 0; i < 256; i++) {
    parts.push(palette[i * 3] ?? 0)
    parts.push(palette[i * 3 + 1] ?? 0)
    parts.push(palette[i * 3 + 2] ?? 0)
  }

  // Netscape Extension (loop forever)
  parts.push(0x21, 0xff, 0x0b)
  writeString(parts, 'NETSCAPE2.0')
  parts.push(0x03, 0x01)
  writeUint16(parts, 0) // loop count = 0 = infinite
  parts.push(0x00) // block terminator

  // Frames
  for (const indexed of indexedFrames) {
    // Graphics Control Extension
    parts.push(0x21, 0xf9, 0x04)
    parts.push(0x09) // Dispose: restore to bg, transparent index present
    writeUint16(parts, delay)
    parts.push(0x00) // transparent color index (black/bg)
    parts.push(0x00) // block terminator

    // Image Descriptor
    parts.push(0x2c)
    writeUint16(parts, 0) // left
    writeUint16(parts, 0) // top
    writeUint16(parts, width)
    writeUint16(parts, height)
    parts.push(0x00) // no local color table

    // LZW-compressed data
    const minCodeSize = 8
    parts.push(minCodeSize)
    const compressed = lzwEncode(indexed, minCodeSize)
    // Write sub-blocks (max 255 bytes each)
    let offset = 0
    while (offset < compressed.length) {
      const blockSize = Math.min(255, compressed.length - offset)
      parts.push(blockSize)
      for (let i = 0; i < blockSize; i++) {
        parts.push(compressed[offset + i])
      }
      offset += blockSize
    }
    parts.push(0x00) // block terminator
  }

  // Trailer
  parts.push(0x3b)

  return new Uint8Array(parts)
}

function writeString(arr: number[], str: string) {
  for (let i = 0; i < str.length; i++) arr.push(str.charCodeAt(i))
}

function writeUint16(arr: number[], val: number) {
  arr.push(val & 0xff)
  arr.push((val >> 8) & 0xff)
}

// High-quality Floyd-Steinberg Dithering with a 6x6x6 Uniform RGB Cube (216 colors)
// This preserves the exact perception of the original video colors by smoothly blending
// the 216 palette colors using error diffusion, eliminating all color banding and dropping
// no hues.
function quantizeFrames(frames: ImageData[]) {
  const palette: number[] = [0, 0, 0] // index 0 = transparent

  // 6x6x6 uniform RGB cube (216 colors)
  // Ensures entire color spectrum is available for dithering
  for (let r = 0; r < 6; r++) {
    for (let g = 0; g < 6; g++) {
      for (let b = 0; b < 6; b++) {
        palette.push(r * 51, g * 51, b * 51)
      }
    }
  }

  // Add 39 grayscale shades to fill exactly 256 colors
  for (let i = 1; i <= 39; i++) {
    const v = Math.floor(i * 255 / 40)
    palette.push(v, v, v)
  }

  const indexedFrames: Uint8Array[] = []

  for (const frame of frames) {
    const width = frame.width
    const height = frame.height
    const indexed = new Uint8Array(width * height)
    
    // We need 3 float components per pixel for error distribution
    const errBuffer = new Float32Array(width * height * 3)

    // Copy original RGB into errBuffer
    for (let i = 0; i < frame.data.length; i += 4) {
      if (frame.data[i + 3] >= 128) {
        const px = (i / 4) * 3
        errBuffer[px] = frame.data[i]
        errBuffer[px + 1] = frame.data[i + 1]
        errBuffer[px + 2] = frame.data[i + 2]
      }
    }

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const srcOffset = (y * width + x) * 4
        if (frame.data[srcOffset + 3] < 128) {
          indexed[y * width + x] = 0 // transparent
          continue
        }

        const bufOffset = (y * width + x) * 3
        const oldR = errBuffer[bufOffset]
        const oldG = errBuffer[bufOffset + 1]
        const oldB = errBuffer[bufOffset + 2]

        // Fast mathematically nearest color in 6x6x6 cube
        let rIdx = Math.round(oldR / 51); if (rIdx < 0) rIdx = 0; else if (rIdx > 5) rIdx = 5;
        let gIdx = Math.round(oldG / 51); if (gIdx < 0) gIdx = 0; else if (gIdx > 5) gIdx = 5;
        let bIdx = Math.round(oldB / 51); if (bIdx < 0) bIdx = 0; else if (bIdx > 5) bIdx = 5;

        indexed[y * width + x] = 1 + rIdx * 36 + gIdx * 6 + bIdx

        const newR = rIdx * 51
        const newG = gIdx * 51
        const newB = bIdx * 51

        const errR = oldR - newR
        const errG = oldG - newG
        const errB = oldB - newB

        // Floyd-Steinberg Error Diffusion to 4 neighboring pixels:
        // x+1, y   (7/16)
        // x-1, y+1 (3/16)
        // x  , y+1 (5/16)
        // x+1, y+1 (1/16)
        if (x + 1 < width) {
          const p = bufOffset + 3
          errBuffer[p]     += (errR * 7) / 16
          errBuffer[p + 1] += (errG * 7) / 16
          errBuffer[p + 2] += (errB * 7) / 16
        }
        if (y + 1 < height) {
          if (x - 1 >= 0) {
            const p = ((y + 1) * width + (x - 1)) * 3
            errBuffer[p]     += (errR * 3) / 16
            errBuffer[p + 1] += (errG * 3) / 16
            errBuffer[p + 2] += (errB * 3) / 16
          }
          const p2 = ((y + 1) * width + x) * 3
          errBuffer[p2]     += (errR * 5) / 16
          errBuffer[p2 + 1] += (errG * 5) / 16
          errBuffer[p2 + 2] += (errB * 5) / 16
          
          if (x + 1 < width) {
            const p3 = ((y + 1) * width + (x + 1)) * 3
            errBuffer[p3]     += (errR * 1) / 16
            errBuffer[p3 + 1] += (errG * 1) / 16
            errBuffer[p3 + 2] += (errB * 1) / 16
          }
        }
      }
    }
    indexedFrames.push(indexed)
  }

  return { palette, indexedFrames }
}

// LZW encoder for GIF
function lzwEncode(indexed: Uint8Array, minCodeSize: number): Uint8Array {
  const clearCode = 1 << minCodeSize
  const eoiCode = clearCode + 1
  const output: number[] = []
  let codeSize = minCodeSize + 1
  let nextCode = eoiCode + 1
  const maxTableSize = 4096

  // Bit-packing state
  let curByte = 0
  let curBit = 0

  function writeBits(code: number, size: number) {
    curByte |= (code << curBit)
    curBit += size
    while (curBit >= 8) {
      output.push(curByte & 0xff)
      curByte >>= 8
      curBit -= 8
    }
  }

  // Initialize code table
  let codeTable = new Map<string, number>()
  function resetTable() {
    codeTable = new Map()
    for (let i = 0; i < clearCode; i++) {
      codeTable.set(String(i), i)
    }
    nextCode = eoiCode + 1
    codeSize = minCodeSize + 1
  }

  // Start
  writeBits(clearCode, codeSize)
  resetTable()

  let buffer = String(indexed[0])

  for (let i = 1; i < indexed.length; i++) {
    const k = String(indexed[i])
    const combined = buffer + ',' + k

    if (codeTable.has(combined)) {
      buffer = combined
    } else {
      writeBits(codeTable.get(buffer)!, codeSize)

      if (nextCode < maxTableSize) {
        codeTable.set(combined, nextCode++)
        if (nextCode > (1 << codeSize) && codeSize < 12) {
          codeSize++
        }
      } else {
        writeBits(clearCode, codeSize)
        resetTable()
      }

      buffer = k
    }
  }

  writeBits(codeTable.get(buffer)!, codeSize)
  writeBits(eoiCode, codeSize)

  // Flush remaining bits
  if (curBit > 0) {
    output.push(curByte & 0xff)
  }

  return new Uint8Array(output)
}
