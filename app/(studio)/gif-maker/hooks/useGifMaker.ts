import { useState } from 'react'
import { VideoMetadata, TrimRange, extractFramesForGif, TextOverlay, StickerOverlay, loadVideo } from '@/lib/video-processor'
import { useToast } from '@/components/ui/toast'

export function useGifMaker() {
  const { toast } = useToast()
  
  // Core Video State
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [videoUrl, setVideoUrl] = useState<string>('')
  const [metadata, setMetadata] = useState<VideoMetadata | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [remoteUrl, setRemoteUrl] = useState('')

  // Editor State
  const [trim, setTrim] = useState<TrimRange>({ start: 0, end: 0 })
  const [currentTime, setCurrentTime] = useState(0)
  const [speed, setSpeed] = useState(1)
  const [textOverlays, setTextOverlays] = useState<TextOverlay[]>([])
  const [stickerOverlays, setStickerOverlays] = useState<StickerOverlay[]>([])
  const [draggingTextId, setDraggingTextId] = useState<string | null>(null)

  const handleFileUpload = async (file: File | Blob, isUrl = false) => {
    try {
      if (file instanceof File && !file.type.startsWith('video/')) {
        toast('Please upload a valid video.', 'error')
        return
      }
      setIsLoading(true)

      const source = isUrl ? (file as unknown as string) : file
      const { video, metadata: meta } = await loadVideo(source)

      if (meta.duration > 60) {
        toast('Videos longer than 60s might process slower.', 'info')
      }

      if (file instanceof File) setVideoFile(file)
      setVideoUrl(isUrl ? (source as string) : URL.createObjectURL(file as File))
      setMetadata(meta)
      setTrim({ start: 0, end: Math.min(meta.duration, 5) }) // Default 5s trim
      setCurrentTime(0)
    } catch (err) {
      console.error('Failed to load video', err)
      toast('Failed to load video. It might be corrupt or an unsupported URL format.', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const handleUrlSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!remoteUrl) return

    setIsLoading(true)
    try {
      // Direct mp4/webm link
      if (remoteUrl.endsWith('.mp4') || remoteUrl.endsWith('.webm') || remoteUrl.endsWith('.mov')) {
        await handleFileUpload(remoteUrl as unknown as File, true)
        return
      }

      // Extract via server route
      toast('Extracting video stream...', 'info')
      const res = await fetch('/api/fetch-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: remoteUrl })
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to extract video url')
      }

      const data = await res.json()
      if (data.url) {
        await handleFileUpload(data.url as unknown as File, true)
        if (data.mocked) {
          toast("YouTube Localhost is blocked, so I'm loading a sample video from a simulator to test the UI!", 'info')
        }
      } else {
        throw new Error('No stream URL extracted.')
      }
    } catch (err: any) {
      console.error('URL Fetch Error:', err)
      toast(err.message || 'Unsupported URL or extraction failed.', 'error')
      setIsLoading(false)
    }
  }

  const resetAll = () => {
    setVideoFile(null)
    setVideoUrl('')
    setMetadata(null)
    setTrim({ start: 0, end: 0 })
    setCurrentTime(0)
    setTextOverlays([])
    setStickerOverlays([])
  }

  const handleExport = async (videoElement: HTMLVideoElement | null) => {
    if (!videoElement || !metadata) return
    setIsLoading(true)

    await new Promise(resolve => setTimeout(resolve, 50))
    toast('Extracting frames...', 'info')

    try {
      const frames = await extractFramesForGif(
        videoElement,
        { trim, speed, fps: 12, maxSize: 512 },
        textOverlays,
        stickerOverlays,
        undefined,
        () => { }
      )

      await new Promise(resolve => setTimeout(resolve, 50))
      const { encodeGif } = await import('@/lib/gif-encoder')

      const outW = frames[0]?.width || 512
      const outH = frames[0]?.height || 512

      const gifData = encodeGif(frames, outW, outH, 12)
      const blob = new Blob([gifData as unknown as BlobPart], { type: 'image/gif' })
      const fileName = `sticker-studio-${Date.now()}.gif`

      if ('showSaveFilePicker' in window) {
        try {
          const handle = await (window as any).showSaveFilePicker({
            suggestedName: fileName,
            types: [{ description: 'GIF Image', accept: { 'image/gif': ['.gif'] } }],
          })
          const writable = await handle.createWritable()
          await writable.write(blob)
          await writable.close()
          toast('GIF Saved successfully!', 'success')
          setIsLoading(false)
          return
        } catch (err: any) {
          if (err.name === 'AbortError') { setIsLoading(false); return }
          console.warn('FilePicker fallback triggered', err)
        }
      }

      // Fallback download
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.style.display = 'none'
      a.href = url
      a.setAttribute('download', fileName)
      document.body.appendChild(a)
      a.click()
      setTimeout(() => {
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)
      }, 200)

      toast('GIF Generated successfully!', 'success')
    } catch (err) {
      console.error('GIF generation error:', err)
      toast('Failed to generate GIF', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  return {
    videoFile, videoUrl, metadata, isLoading, remoteUrl, setIsLoading,
    setRemoteUrl, handleFileUpload, handleUrlSubmit,
    trim, setTrim, currentTime, setCurrentTime, speed, setSpeed,
    textOverlays, setTextOverlays, stickerOverlays, setStickerOverlays,
    draggingTextId, setDraggingTextId, handleExport, resetAll
  }
}
