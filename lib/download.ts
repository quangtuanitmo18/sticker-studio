/**
 * Shared download utilities
 * Used by: AvatarCreator (PNG/JPEG/GLB export), pack-gen, maker
 */

/** Download a Blob as a file */
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

/** Download from a URL (data: or blob: or https:) */
export function downloadUrl(url: string, filename: string) {
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
}
