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
  document.body.appendChild(a)
  a.click()
  setTimeout(() => {
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, 150)
}

/** Download from a URL (data: or blob: or https:) */
export async function downloadUrl(url: string, filename: string) {
  // Chrome ignores `download` attr on large data: URLs — convert to blob first
  if (url.startsWith('data:')) {
    const res = await fetch(url)
    const blob = await res.blob()
    downloadBlob(blob, filename)
    return
  }
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
}
