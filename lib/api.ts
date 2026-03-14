/**
 * Shared API utilities
 * Centralizes fetch calls to internal API routes
 */

/** Remove background from an image using the /api/remove-bg endpoint */
export async function removeBg(imageData: string): Promise<string> {
  const res = await fetch('/api/remove-bg', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image: imageData }),
  })

  if (!res.ok) {
    throw new Error(`Remove BG failed: ${res.status} ${res.statusText}`)
  }

  const data = await res.json()
  return data.result
}
