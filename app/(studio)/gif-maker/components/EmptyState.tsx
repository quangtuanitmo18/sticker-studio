import React from 'react'
import { Upload, Video } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface EmptyStateProps {
  onFileUpload: (file: File) => void
  remoteUrl: string
  setRemoteUrl: (url: string) => void
  onUrlSubmit: (e: React.FormEvent) => void
  isLoading: boolean
}

export default function EmptyState({
  onFileUpload,
  remoteUrl,
  setRemoteUrl,
  onUrlSubmit,
  isLoading
}: EmptyStateProps) {

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFileUpload(e.dataTransfer.files[0])
    }
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-80px)] p-6 bg-[var(--background)] text-[var(--text-primary)]">
      <div className="max-w-2xl w-full text-center space-y-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">Video to GIF Maker</h1>
          <p className="text-[var(--text-muted)] text-lg">
            Turn your local videos or recordings into shareable animated GIFs and stickers.
          </p>
        </div>

        <div className="flex flex-col md:flex-row items-stretch gap-6 w-full max-w-4xl mx-auto mt-8">
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            className="flex-1 border-2 border-dashed border-[var(--overlay-border)] rounded-2xl bg-[var(--card-bg)] px-8 py-16 flex flex-col items-center justify-center transition hover:border-[#FF6B4A]/50 hover:bg-[var(--card-bg-hover)] cursor-pointer shadow-xl group"
            onClick={() => document.getElementById('video-upload')?.click()}
          >
            <div className="w-16 h-16 rounded-full bg-[var(--background)] flex items-center justify-center mb-6 border border-[var(--overlay-border)] group-hover:border-[#FF6B4A]/30 group-hover:text-[#FF6B4A] transition-colors">
              <Upload className="w-8 h-8 text-[var(--text-muted)] group-hover:text-[#FF6B4A]" />
            </div>
            <h3 className="text-xl font-medium mb-1 text-[var(--text-primary)]">Drag and drop your video here</h3>
            <p className="text-sm text-[var(--text-muted)]">MP4, WebM, MOV (Max 50MB recommended)</p>
            <input
              id="video-upload"
              type="file"
              accept="video/*"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  onFileUpload(e.target.files[0])
                }
              }}
            />
          </div>

          <div className="hidden md:flex flex-col items-center justify-center gap-4">
            <div className="w-px bg-[var(--overlay-border)] flex-1" />
            <span className="text-xs font-semibold uppercase tracking-widest text-[var(--text-muted)]">OR</span>
            <div className="w-px bg-[var(--overlay-border)] flex-1" />
          </div>

          <div className="flex md:hidden items-center gap-4 w-full">
            <div className="h-px bg-[var(--overlay-border)] flex-1" />
            <span className="text-xs font-semibold uppercase tracking-widest text-[var(--text-muted)]">OR</span>
            <div className="h-px bg-[var(--overlay-border)] flex-1" />
          </div>

          <div className="flex-1 border border-[var(--overlay-border)] rounded-2xl bg-[var(--card-bg)] px-8 py-16 flex flex-col items-center justify-center shadow-xl">
            <div className="w-16 h-16 rounded-full bg-[var(--background)] flex items-center justify-center mb-6 border border-[var(--overlay-border)]">
              <Video className="w-8 h-8 text-[var(--text-muted)]" />
            </div>
            <h3 className="text-xl font-medium mb-1 text-[var(--text-primary)]">Import from URL</h3>
            <p className="text-sm text-[var(--text-muted)] mb-6 text-center">Paste a link from YouTube, Instagram, Facebook, etc.</p>
            <form onSubmit={onUrlSubmit} className="w-full flex items-center gap-2 bg-[var(--background)] border border-[var(--overlay-border)] rounded-xl p-1.5 focus-within:border-[#FF6B4A]/50 transition">
              <input
                type="url"
                placeholder="https://..."
                className="flex-1 bg-transparent border-none text-sm px-3 focus:outline-none text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
                value={remoteUrl}
                onChange={(e) => setRemoteUrl(e.target.value)}
                disabled={isLoading}
              />
              <Button type="submit" size="sm" className="px-6 bg-[#FF6B4A] hover:bg-[#FF6B4A]/90 text-white" disabled={!remoteUrl || isLoading}>
                {isLoading ? 'Extracting...' : 'Load'}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
