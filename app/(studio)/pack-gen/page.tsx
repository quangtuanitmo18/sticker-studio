'use client'

import * as React from 'react'
import { useDropzone } from 'react-dropzone'
import { UploadCloud, Image as ImageIcon, Download, Sparkles, Trash2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Loading } from '@/components/ui/Loading'
import { downloadUrl } from '@/lib/download'

const STYLES = [
  { id: '3D Pixar', label: '3D Pixar', image: 'https://picsum.photos/seed/pixar/200/200' },
  { id: 'Anime', label: 'Anime', image: 'https://picsum.photos/seed/anime/200/200' },
  { id: 'Chibi', label: 'Chibi', image: 'https://picsum.photos/seed/chibi/200/200' },
  { id: 'Watercolor', label: 'Watercolor', image: 'https://picsum.photos/seed/watercolor/200/200' },
  { id: 'Cyberpunk', label: 'Cyberpunk', image: 'https://picsum.photos/seed/cyberpunk/200/200' },
  { id: 'Claymation', label: 'Claymation', image: 'https://picsum.photos/seed/claymation/200/200' },
  { id: 'Pencil Sketch', label: 'Pencil Sketch', image: 'https://picsum.photos/seed/sketch/200/200' },
  { id: 'Pop Art', label: 'Pop Art', image: 'https://picsum.photos/seed/popart/200/200' }
]

const EMOTIONS = [
  { id: 'laughing', emoji: '😂', label: 'Laughing', prompt: 'Laughing out loud, crying tears of joy, hilarious, big open mouth smile' },
  { id: 'affectionate', emoji: '🥰', label: 'Affectionate', prompt: 'Affectionate, smiling face with hearts, loving, warm, caring' },
  { id: 'thinking', emoji: '🤔', label: 'Thinking', prompt: 'Thinking, hand on chin, pondering, curious, inquisitive' },
  { id: 'winking', emoji: '😉', label: 'Winking', prompt: 'Winking, playful, cheeky, one eye closed, slight smile' },
  { id: 'blowing_kiss', emoji: '😘', label: 'Blowing Kiss', prompt: 'Blowing a kiss, winking, heart, affectionate, sweet' },
  { id: 'crying', emoji: '😢', label: 'Crying', prompt: 'Crying, sad, single tear, upset, emotional' }
]

export default function PackGenPage() {
  const [sourceImage, setSourceImage] = React.useState<{ url: string, base64: string, mimeType: string } | null>(null)
  const [selectedStyle, setSelectedStyle] = React.useState(STYLES[0].id)
  const [generatedPack, setGeneratedPack] = React.useState<{ id: string, url: string }[]>([])
  const [isGenerating, setIsGenerating] = React.useState(false)
  const [loadingText, setLoadingText] = React.useState('')
  const [error, setError] = React.useState<string | null>(null)

  const onDrop = React.useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        setSourceImage({
          url: URL.createObjectURL(file),
          base64: result,
          mimeType: file.type
        })
        setGeneratedPack([])
        setError(null)
      }
      reader.readAsDataURL(file)
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.webp'] },
    maxFiles: 1
  })

  const generatePack = async () => {
    if (!sourceImage) return
    setIsGenerating(true)
    setError(null)
    setGeneratedPack([])

    try {
      const base64Data = sourceImage.base64.split(',')[1]
      const mimeType = sourceImage.mimeType

      const newPack: { id: string, url: string }[] = []

      for (const emotion of EMOTIONS) {
        setLoadingText(`Generating ${emotion.id} sticker...`)
        
        const res = await fetch('/api/generate-sticker', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageBase64: base64Data,
            mimeType,
            style: selectedStyle,
            emotionPrompt: emotion.prompt,
          }),
        })

        if (!res.ok) {
          const errData = await res.json().catch(() => ({ error: 'Unknown error' }))
          throw new Error(errData.error || `Server error: ${res.status}`)
        }

        const result = await res.json()
        const generatedBase64 = `data:${result.mimeType};base64,${result.imageBase64}`

        setLoadingText(`Removing background for ${emotion.id}...`)
        
        // Resize generated image before sending to remove-bg API
        const resizedBase64 = await new Promise<string>((resolve, reject) => {
          const img = new Image()
          img.onload = () => {
            const canvas = document.createElement('canvas')
            let width = img.width
            let height = img.height
            const MAX_WIDTH = 1024
            const MAX_HEIGHT = 1024

            if (width > height) {
              if (width > MAX_WIDTH) {
                height *= MAX_WIDTH / width
                width = MAX_WIDTH
              }
            } else {
              if (height > MAX_HEIGHT) {
                width *= MAX_HEIGHT / height
                height = MAX_HEIGHT
              }
            }

            canvas.width = width
            canvas.height = height
            const ctx = canvas.getContext('2d')
            if (ctx) {
              ctx.drawImage(img, 0, 0, width, height)
              const mimeType = generatedBase64.startsWith('data:image/png') ? 'image/png' : 'image/jpeg'
              const quality = mimeType === 'image/jpeg' ? 0.8 : undefined
              resolve(canvas.toDataURL(mimeType, quality))
            } else {
              resolve(generatedBase64)
            }
          }
          img.onerror = () => resolve(generatedBase64)
          img.src = generatedBase64
        })

        // Call remove-bg API
        const bgRes = await fetch('/api/remove-bg', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageUrl: resizedBase64 })
        })

        if (!bgRes.ok) {
          console.warn(`Background removal failed for ${emotion.id}, using original`)
          newPack.push({ id: emotion.id, url: generatedBase64 })
        } else {
          const bgData = await bgRes.json()
          newPack.push({ id: emotion.id, url: bgData.url })
        }
        
        setGeneratedPack([...newPack])
      }

      setLoadingText('Done!')
    } catch (err: any) {
      console.error(err)
      setError(err.message || 'Failed to generate pack')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleDownloadAll = () => {
    generatedPack.forEach((sticker, index) => {
      setTimeout(() => {
        downloadUrl(sticker.url, `sticker_${selectedStyle.replace(/\s+/g, '_').toLowerCase()}_${sticker.id}.png`)
      }, index * 500)
    })
  }

  return (
    <div className="flex flex-col items-center justify-start min-h-[calc(100vh-4rem)] p-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center justify-center gap-2">
          <Sparkles className="w-8 h-8 text-indigo-500" />
          AI Pack Generator
        </h1>
        <p className="text-zinc-500">Upload a selfie to generate a full pack of reaction stickers.</p>
        <p className="text-xs text-indigo-500 mt-2 font-medium">💡 Tip: Use a clear photo with consistent framing for the best sticker pack results.</p>
      </div>

      <div className="w-full max-w-7xl grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Controls */}
        <div className="space-y-6">
          {/* Upload Area */}
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
            <h2 className="text-lg font-semibold mb-4">1. Your Photo</h2>
            {!sourceImage ? (
              <div 
                {...getRootProps()} 
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors
                  ${isDragActive ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' : 'border-zinc-300 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-600'}`}
              >
                <input {...getInputProps()} />
                <UploadCloud className="w-10 h-10 mx-auto text-zinc-400 mb-4" />
                <p className="text-sm font-medium mb-1">Drop a selfie here</p>
                <p className="text-xs text-zinc-500">PNG, JPG up to 5MB</p>
              </div>
            ) : (
              <div className="relative aspect-square rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800 group">
                <img src={sourceImage.url} alt="Source" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Button variant="secondary" size="sm" onClick={() => setSourceImage(null)}>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Remove
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Style Selector */}
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
            <h2 className="text-lg font-semibold mb-4">2. Choose Style</h2>
            <div className="grid grid-cols-2 gap-3">
              {STYLES.map(style => (
                <button
                  key={style.id}
                  onClick={() => setSelectedStyle(style.id)}
                  disabled={isGenerating}
                  className={`relative flex flex-col items-center justify-center p-2 rounded-xl border-2 transition-all overflow-hidden ${
                    selectedStyle === style.id 
                      ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' 
                      : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
                  }`}
                >
                  <div className="w-full aspect-square rounded-lg overflow-hidden mb-2 bg-zinc-100 dark:bg-zinc-800">
                    <img src={style.image} alt={style.label} className="w-full h-full object-cover" />
                  </div>
                  <span className="text-xs font-medium text-center">{style.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Generate Button */}
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
            <h2 className="text-lg font-semibold mb-4">3. Generate</h2>
            <Button 
              className="w-full h-12 text-base" 
              onClick={generatePack}
              disabled={!sourceImage || isGenerating}
            >
              {isGenerating ? (
                <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Generating Pack...</>
              ) : (
                <><Sparkles className="w-5 h-5 mr-2" /> Generate 6 Stickers</>
              )}
            </Button>
            
            {error && (
              <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-lg border border-red-100 dark:border-red-900/30">
                {error}
              </div>
            )}
          </div>

          {/* Emotions Preview */}
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
            <h2 className="text-lg font-semibold mb-2">6 Expressive Emotions</h2>
            <p className="text-sm text-zinc-500 mb-4">Every sticker pack includes all these expressions</p>
            <div className="grid grid-cols-3 gap-3">
              {EMOTIONS.map(emotion => (
                <div key={emotion.id} className="flex flex-col items-center justify-center p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-100 dark:border-zinc-800">
                  <span className="text-2xl mb-1">{emotion.emoji}</span>
                  <span className="text-[10px] font-medium text-zinc-600 dark:text-zinc-400 text-center">{emotion.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Results */}
        <div className="lg:col-span-2 bg-zinc-50 dark:bg-zinc-900/50 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 min-h-[500px] flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Your Sticker Pack</h2>
            {generatedPack.length > 0 && !isGenerating && (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleDownloadAll}>
                  <Download className="w-4 h-4 mr-2" />
                  Download All
                </Button>
              </div>
            )}
          </div>

          {isGenerating ? (
            <div className="flex-1 flex flex-col items-center justify-center text-zinc-500">
              <Loading text={loadingText} size="lg" />
              <p className="text-sm mt-4 max-w-xs text-center">This process takes about 30-60 seconds as we generate and process multiple images.</p>
            </div>
          ) : generatedPack.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              {EMOTIONS.map((emotion) => {
                const sticker = generatedPack.find(s => s.id === emotion.id)
                return (
                  <div key={emotion.id} className="flex flex-col items-center gap-3">
                    <div className="w-full aspect-square bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-zinc-200/50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-200 dark:border-zinc-700 flex items-center justify-center p-4 relative group">
                      {sticker ? (
                        <>
                          <img src={sticker.url} alt={emotion.id} className="w-full h-full object-contain drop-shadow-xl transition-transform group-hover:scale-105" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl flex items-center justify-center">
                            <Button size="sm" variant="secondary" onClick={() => downloadUrl(sticker.url, `sticker_${emotion.id}.png`)}>
                              <Download className="w-4 h-4 mr-2" /> Download
                            </Button>
                          </div>
                        </>
                      ) : (
                        <div className="text-zinc-400 flex flex-col items-center">
                          <ImageIcon className="w-8 h-8 mb-2 opacity-50" />
                          <span className="text-xs uppercase tracking-wider font-medium">{emotion.label}</span>
                        </div>
                      )}
                    </div>
                    <span className="text-sm font-medium">{emotion.emoji} {emotion.label}</span>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-zinc-400 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl">
              <ImageIcon className="w-16 h-16 mb-4 opacity-20" />
              <p>Upload a photo and click Generate to see your pack here.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
