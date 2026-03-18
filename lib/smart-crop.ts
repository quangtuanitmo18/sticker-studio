/**
 * AI Smart Crop — auto-crops image to the main subject.
 * Uses canvas-based analysis to find the bounding box of non-transparent pixels
 * after background removal, with padding.
 */

export interface CropResult {
  dataUrl: string
  cropRect: { x: number; y: number; w: number; h: number }
  originalSize: { w: number; h: number }
}

/**
 * Smart crop: finds the bounding box of visible (non-transparent) pixels
 * and crops to that region with configurable padding.
 * Works best on images that already have background removed.
 */
export async function smartCrop(
  imageUrl: string,
  options: { padding?: number; square?: boolean } = {},
): Promise<CropResult> {
  const { padding = 20, square = true } = options

  const img = await loadImage(imageUrl)
  const canvas = document.createElement('canvas')
  canvas.width = img.width
  canvas.height = img.height
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(img, 0, 0)

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const { data, width, height } = imageData

  // Find bounding box of non-transparent pixels
  let minX = width
  let minY = height
  let maxX = 0
  let maxY = 0

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const alpha = data[(y * width + x) * 4 + 3]
      if (alpha > 10) {
        if (x < minX) minX = x
        if (x > maxX) maxX = x
        if (y < minY) minY = y
        if (y > maxY) maxY = y
      }
    }
  }

  // No visible pixels found
  if (minX > maxX || minY > maxY) {
    return {
      dataUrl: imageUrl,
      cropRect: { x: 0, y: 0, w: width, h: height },
      originalSize: { w: width, h: height },
    }
  }

  // Add padding
  let cropX = Math.max(0, minX - padding)
  let cropY = Math.max(0, minY - padding)
  let cropW = Math.min(width - cropX, (maxX - minX + 1) + padding * 2)
  let cropH = Math.min(height - cropY, (maxY - minY + 1) + padding * 2)

  // Make square if requested
  if (square) {
    const maxDim = Math.max(cropW, cropH)
    const centerX = cropX + cropW / 2
    const centerY = cropY + cropH / 2

    cropX = Math.max(0, Math.round(centerX - maxDim / 2))
    cropY = Math.max(0, Math.round(centerY - maxDim / 2))
    cropW = Math.min(width - cropX, maxDim)
    cropH = Math.min(height - cropY, maxDim)

    // Re-center if we hit an edge
    const actualMax = Math.max(cropW, cropH)
    cropW = actualMax
    cropH = actualMax
  }

  // Render cropped image
  const outCanvas = document.createElement('canvas')
  outCanvas.width = cropW
  outCanvas.height = cropH
  const outCtx = outCanvas.getContext('2d')!
  outCtx.drawImage(canvas, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH)

  return {
    dataUrl: outCanvas.toDataURL('image/png'),
    cropRect: { x: cropX, y: cropY, w: cropW, h: cropH },
    originalSize: { w: width, h: height },
  }
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
