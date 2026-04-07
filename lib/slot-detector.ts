// ─── Auto-detect photo slots from a frame PNG ──────────────────
// Pure client-side canvas pixel analysis. No AI model needed.
//
// Detection modes (tried in order):
// 1. True transparency: alpha < threshold
// 2. Checkerboard pattern: alternating white/gray pixels (common in
//    frame templates where transparency was "baked in" as pixels)
// 3. Light placeholder regions: large areas of white/near-white

export interface DetectedSlot {
  x: number
  y: number
  w: number
  h: number
}

interface Region {
  minX: number
  minY: number
  maxX: number
  maxY: number
  pixelCount: number
}

// ─── Main entry point ─────────────────────────────────────────
export function detectSlots(
  image: HTMLImageElement,
  options: {
    alphaThreshold?: number
    minAreaFraction?: number
    mergeDistance?: number
    analysisSize?: number
  } = {}
): DetectedSlot[] {
  const {
    alphaThreshold = 10,   // Reduced from 30 to prevent soft drop-shadows from bridging distinct slots
    minAreaFraction = 0.01,
    mergeDistance = 0.005, // Reduced from 0.03 to avoid merging distinct adjacent slots
    analysisSize = 2048,   // Increased from 600 to prevent thin dividing lines from disappearing
  } = options

  const origW = image.naturalWidth
  const origH = image.naturalHeight
  if (origW === 0 || origH === 0) return []

  // ─── 1. Downscale for performance ──────────────────────────
  const scaleFactor = Math.min(1, analysisSize / Math.max(origW, origH))
  const aW = Math.round(origW * scaleFactor)
  const aH = Math.round(origH * scaleFactor)

  const canvas = document.createElement('canvas')
  canvas.width = aW
  canvas.height = aH
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!
  ctx.drawImage(image, 0, 0, aW, aH)
  const imageData = ctx.getImageData(0, 0, aW, aH)
  const pixels = imageData.data

  // ─── 2. Build binary mask (multi-mode) ─────────────────────
  const mask = new Uint8Array(aW * aH)
  let isPlaceholderMode = false

  // Mode 1: True transparency
  let transparentCount = 0
  for (let i = 0; i < aW * aH; i++) {
    if (pixels[i * 4 + 3] < alphaThreshold) {
      mask[i] = 1
      transparentCount++
    }
  }

  const totalPixels = aW * aH
  const transparentPercent = (transparentCount / totalPixels) * 100

  if (transparentPercent >= 1) {
    console.log(`[slot-detector] Mode: TRUE TRANSPARENCY — ${transparentPercent.toFixed(1)}% transparent pixels`)
  } else {
    // Mode 2: Checkerboard pattern + light region detection
    console.log(`[slot-detector] No transparency found (${transparentPercent.toFixed(1)}%). Trying checkerboard/placeholder detection...`)
    isPlaceholderMode = true

    // Reset mask
    mask.fill(0)
    let placeholderCount = 0
    for (let i = 0; i < totalPixels; i++) {
      const r = pixels[i * 4]
      const g = pixels[i * 4 + 1]
      const b = pixels[i * 4 + 2]

      const minC = Math.min(r, g, b)
      const maxC = Math.max(r, g, b)
      const isNeutral = (maxC - minC) < 30
      const isLight = minC > 170

      if (isNeutral && isLight) {
        mask[i] = 1
        placeholderCount++
      }
    }

    const placeholderPercent = (placeholderCount / totalPixels) * 100
    console.log(`[slot-detector] Placeholder detection: ${placeholderCount}/${totalPixels} pixels (${placeholderPercent.toFixed(1)}%) are light neutral`)

    if (placeholderPercent < 1) {
      console.log(`[slot-detector] No usable regions found`)
      return []
    }
  }

  // ─── 3. Connected component labeling + detection ───────────
  // In placeholder mode, do NOT merge boxes (dark frame borders already separate slots)
  const effectiveMerge = isPlaceholderMode ? 0 : mergeDistance
  const result = runDetection(mask, aW, aH, totalPixels, minAreaFraction, effectiveMerge, scaleFactor, origW, origH)

  if (result.length > 0) {
    console.log(`[slot-detector] ✅ Detected ${result.length} slot(s):`, result)
  }

  return result
}

// ─── Core detection: flood-fill + bbox + merge + scale ───────
function runDetection(
  mask: Uint8Array, aW: number, aH: number,
  totalPixels: number, minAreaFraction: number, mergeDistance: number,
  scaleFactor: number, origW: number, origH: number
): DetectedSlot[] {
  const labels = new Int32Array(aW * aH)
  const regions: Region[] = []
  let labelCount = 0

  for (let y = 0; y < aH; y++) {
    for (let x = 0; x < aW; x++) {
      const idx = y * aW + x
      if (mask[idx] === 0 || labels[idx] !== 0) continue

      labelCount++
      const region: Region = { minX: x, minY: y, maxX: x, maxY: y, pixelCount: 0 }
      const queue: number[] = [idx]
      labels[idx] = labelCount

      while (queue.length > 0) {
        const ci = queue.pop()!
        const cx = ci % aW
        const cy = (ci - cx) / aW
        region.pixelCount++
        if (cx < region.minX) region.minX = cx
        if (cx > region.maxX) region.maxX = cx
        if (cy < region.minY) region.minY = cy
        if (cy > region.maxY) region.maxY = cy

        // 4-connected neighbors
        const neighbors = [
          cy > 0 ? ci - aW : -1,
          cy < aH - 1 ? ci + aW : -1,
          cx > 0 ? ci - 1 : -1,
          cx < aW - 1 ? ci + 1 : -1,
        ]
        for (const ni of neighbors) {
          if (ni >= 0 && mask[ni] === 1 && labels[ni] === 0) {
            labels[ni] = labelCount
            queue.push(ni)
          }
        }
      }

      regions.push(region)
    }
  }

  // Filter small regions
  const minPixels = totalPixels * minAreaFraction
  let significantRegions = regions.filter(r => r.pixelCount >= minPixels)

  // Discard exterior transparent background:
  // If a region touches at least 3 edges of the image, we assume it's the outside canvas/background
  significantRegions = significantRegions.filter(r => {
    const touchesLeft = r.minX < 5
    const touchesRight = r.maxX > aW - 5
    const touchesTop = r.minY < 5
    const touchesBottom = r.maxY > aH - 5
    const edgeCount = (touchesLeft ? 1 : 0) + (touchesRight ? 1 : 0) + (touchesTop ? 1 : 0) + (touchesBottom ? 1 : 0)
    
    // Also, usually the exterior is huge. We can safely ignore it.
    if (edgeCount >= 3) {
      console.log(`[slot-detector] Ignoring exterior background region (touches ${edgeCount} edges)`)
      return false
    }
    return true
  })

  // Filter by aspect ratio (reject very thin/elongated regions — likely borders)
  significantRegions = significantRegions.filter(r => {
    const rw = r.maxX - r.minX + 1
    const rh = r.maxY - r.minY + 1
    const aspect = Math.max(rw, rh) / Math.max(1, Math.min(rw, rh))
    // Also check fill ratio: how much of the bounding box is actually filled
    const fillRatio = r.pixelCount / (rw * rh)
    return aspect < 5 && fillRatio > 0.3
  })

  console.log(`[slot-detector] Found ${regions.length} total regions, ${significantRegions.length} significant (>= ${(minAreaFraction * 100).toFixed(1)}% area, good aspect/fill ratio, not exterior)`)

  if (significantRegions.length === 0) return []

  // Convert to bounding boxes
  let boxes: DetectedSlot[] = significantRegions.map(r => ({
    x: r.minX, y: r.minY,
    w: r.maxX - r.minX + 1, h: r.maxY - r.minY + 1,
  }))

  // Merge nearby boxes
  const diagPx = Math.sqrt(aW * aW + aH * aH)
  boxes = mergeBoxes(boxes, diagPx * mergeDistance)

  // Scale back to original coordinates
  const invScale = 1 / scaleFactor
  const result: DetectedSlot[] = boxes.map(b => ({
    x: Math.round(b.x * invScale),
    y: Math.round(b.y * invScale),
    w: Math.round(b.w * invScale),
    h: Math.round(b.h * invScale),
  }))

  // Sort top-to-bottom, left-to-right
  result.sort((a, b) => {
    const rowA = Math.floor(a.y / (origH * 0.1))
    const rowB = Math.floor(b.y / (origH * 0.1))
    if (rowA !== rowB) return rowA - rowB
    return a.x - b.x
  })

  // Clamp to frame bounds
  return result.map(s => ({
    x: Math.max(0, s.x),
    y: Math.max(0, s.y),
    w: Math.min(s.w, origW - s.x),
    h: Math.min(s.h, origH - s.y),
  }))
}

// ─── Merge overlapping/nearby bounding boxes ─────────────────
function mergeBoxes(boxes: DetectedSlot[], threshold: number): DetectedSlot[] {
  if (boxes.length <= 1) return boxes

  let merged = true
  let current = [...boxes]

  while (merged) {
    merged = false
    const next: DetectedSlot[] = []
    const used = new Set<number>()

    for (let i = 0; i < current.length; i++) {
      if (used.has(i)) continue
      let box = { ...current[i] }

      for (let j = i + 1; j < current.length; j++) {
        if (used.has(j)) continue
        if (boxDistance(box, current[j]) < threshold) {
          const minX = Math.min(box.x, current[j].x)
          const minY = Math.min(box.y, current[j].y)
          const maxX = Math.max(box.x + box.w, current[j].x + current[j].w)
          const maxY = Math.max(box.y + box.h, current[j].y + current[j].h)
          box = { x: minX, y: minY, w: maxX - minX, h: maxY - minY }
          used.add(j)
          merged = true
        }
      }

      next.push(box)
      used.add(i)
    }

    current = next
  }

  return current
}

function boxDistance(a: DetectedSlot, b: DetectedSlot): number {
  const aRight = a.x + a.w, aBottom = a.y + a.h
  const bRight = b.x + b.w, bBottom = b.y + b.h
  const dx = Math.max(0, Math.max(a.x - bRight, b.x - aRight))
  const dy = Math.max(0, Math.max(a.y - bBottom, b.y - aBottom))
  return Math.sqrt(dx * dx + dy * dy)
}

// ─── Utility: check if frame has transparent regions ─────────
export function hasTransparentRegions(
  image: HTMLImageElement,
  threshold = 30,
  minPercent = 1
): boolean {
  try {
    const nw = image.naturalWidth
    const nh = image.naturalHeight
    if (!nw || !nh) return false

    const size = 200
    const scale = Math.min(1, size / Math.max(nw, nh))
    const w = Math.round(nw * scale)
    const h = Math.round(nh * scale)

    const canvas = document.createElement('canvas')
    canvas.width = w; canvas.height = h
    const ctx = canvas.getContext('2d', { willReadFrequently: true })!
    ctx.clearRect(0, 0, w, h)
    ctx.drawImage(image, 0, 0, w, h)
    const data = ctx.getImageData(0, 0, w, h).data

    let transparentCount = 0
    const total = w * h
    for (let i = 0; i < total; i++) {
      if (data[i * 4 + 3] < threshold) transparentCount++
    }
    return (transparentCount / total) * 100 >= minPercent
  } catch {
    return false
  }
}
