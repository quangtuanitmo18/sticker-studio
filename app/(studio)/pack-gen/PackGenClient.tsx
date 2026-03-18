'use client'

import { Loading } from '@/components/ui/Loading'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/toast'
import { downloadUrl } from '@/lib/download'
import { ArrowLeft, ArrowRight, Check, Download, UploadCloud } from 'lucide-react'
import * as React from 'react'
import { useDropzone } from 'react-dropzone'

function parseErrorMessage(err: any): string {
  const raw = typeof err === 'string' ? err : err?.message || 'Something went wrong'
  // Strip JSON objects from error messages
  if (raw.includes('{') && raw.includes('}')) {
    const match = raw.match(/^([^{]+)/)
    if (match) return match[1].trim() || 'Generation failed. Please try again.'
  }
  if (raw.length > 150) return raw.slice(0, 120) + '...'
  return raw
}

const STYLES = [
  { id: '3D Pixar', label: '3D Pixar', image: '/styles/laughing.png' },
  { id: 'Anime', label: 'Anime', image: '/styles/affectionate.png' },
  { id: 'Chibi', label: 'Chibi', image: '/styles/winking.png' },
  { id: 'Watercolor', label: 'Watercolor', image: '/styles/thinking.png' },
  { id: 'Cyberpunk', label: 'Cyberpunk', image: '/styles/blowing_kiss.png' },
  { id: 'Claymation', label: 'Claymation', image: '/styles/crying.png' },
  { id: 'Pencil Sketch', label: 'Pencil Sketch', image: '/styles/laughing.png' },
  { id: 'Pop Art', label: 'Pop Art', image: '/styles/affectionate.png' }
]

const EMOTIONS = [
  { id: 'laughing', emoji: '😂', label: 'Laughing', prompt: 'Laughing out loud, crying tears of joy, hilarious, big open mouth smile' },
  { id: 'affectionate', emoji: '🥰', label: 'Affectionate', prompt: 'Affectionate, smiling face with hearts, loving, warm, caring' },
  { id: 'thinking', emoji: '🤔', label: 'Thinking', prompt: 'Thinking, hand on chin, pondering, curious, inquisitive' },
  { id: 'winking', emoji: '😉', label: 'Winking', prompt: 'Winking, playful, cheeky, one eye closed, slight smile' },
  { id: 'blowing_kiss', emoji: '😘', label: 'Blowing Kiss', prompt: 'Blowing a kiss, winking, heart, affectionate, sweet' },
  { id: 'crying', emoji: '😢', label: 'Crying', prompt: 'Crying, sad, single tear, upset, emotional' }
]

const STEPS = ['Upload', 'Style', 'Generate']

export default function PackGenPage() {
  const [step, setStep] = React.useState(0)
  const [sourceImage, setSourceImage] = React.useState<{ url: string, base64: string, mimeType: string } | null>(null)
  const [selectedStyle, setSelectedStyle] = React.useState(STYLES[0].id)
  const [generatedPack, setGeneratedPack] = React.useState<{ id: string, url: string }[]>([])
  const [isGenerating, setIsGenerating] = React.useState(false)
  const [loadingText, setLoadingText] = React.useState('')
  const [error, setError] = React.useState<string | null>(null)
  const { toast } = useToast()

  const onDrop = React.useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        setSourceImage({ url: URL.createObjectURL(file), base64: result, mimeType: file.type })
        setGeneratedPack([])
        setError(null)
        setStep(1) // auto-advance
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
    setStep(2) // advance to results
    setIsGenerating(true)
    setError(null)
    setGeneratedPack([])
    try {
      const base64Data = sourceImage.base64.split(',')[1]
      const mimeType = sourceImage.mimeType
      const newPack: { id: string, url: string }[] = []
      for (const emotion of EMOTIONS) {
        setLoadingText(`Creating ${emotion.label}...`)
        const res = await fetch('/api/generate-sticker', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageBase64: base64Data, mimeType, style: selectedStyle, emotionPrompt: emotion.prompt }),
        })
        if (!res.ok) {
          const errData = await res.json().catch(() => ({ error: 'Unknown error' }))
          throw new Error(errData.error || `Server error: ${res.status}`)
        }
        const result = await res.json()
        const generatedBase64 = `data:${result.mimeType};base64,${result.imageBase64}`
        setLoadingText(`Processing ${emotion.label}...`)
        const resizedBase64 = await new Promise<string>((resolve) => {
          const img = new Image()
          img.onload = () => {
            const canvas = document.createElement('canvas')
            let w = img.width, h = img.height
            if (w > h) { if (w > 1024) { h *= 1024 / w; w = 1024 } }
            else { if (h > 1024) { w *= 1024 / h; h = 1024 } }
            canvas.width = w; canvas.height = h
            const ctx = canvas.getContext('2d')
            if (ctx) { ctx.drawImage(img, 0, 0, w, h); resolve(canvas.toDataURL(generatedBase64.startsWith('data:image/png') ? 'image/png' : 'image/jpeg', 0.8)) }
            else resolve(generatedBase64)
          }
          img.onerror = () => resolve(generatedBase64)
          img.src = generatedBase64
        })
        const bgRes = await fetch('/api/remove-bg', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageUrl: resizedBase64 })
        })
        if (!bgRes.ok) { newPack.push({ id: emotion.id, url: generatedBase64 }) }
        else { const bgData = await bgRes.json(); newPack.push({ id: emotion.id, url: bgData.url }) }
        setGeneratedPack([...newPack])
      }
      setLoadingText('Done!')
      toast('Sticker pack generated successfully! 🎉', 'success')
    } catch (err: any) {
      console.error(err)
      setError(parseErrorMessage(err))
    } finally { setIsGenerating(false) }
  }

  const handleDownloadAll = () => {
    generatedPack.forEach((sticker, i) => {
      setTimeout(() => downloadUrl(sticker.url, `sticker_${selectedStyle.replace(/\s+/g, '_').toLowerCase()}_${sticker.id}.png`), i * 500)
    })
    toast(`Downloading ${generatedPack.length} stickers...`, 'success')
  }

  return (
    <div className="flex-1 flex flex-col">
      {/* ═══ Step indicator ═══ */}
      <div className="shrink-0 flex items-center justify-center gap-2 py-4 md:py-5 px-4 md:px-6 border-b border-[var(--overlay-border)]">
        {STEPS.map((s, i) => (
          <React.Fragment key={s}>
            {i > 0 && <div className={`w-12 h-[1px] ${i <= step ? 'bg-[#FF6B4A]' : 'bg-white/[0.06]'} transition-colors`} />}
            <button
              onClick={() => { if (i < step || (i === 1 && sourceImage)) setStep(i) }}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                i === step ? 'bg-[#FF6B4A]/15 text-[#FF6B4A]'
                : i < step ? 'bg-[var(--card-bg-hover)] text-[var(--text-secondary)]'
                : 'text-[var(--text-muted)]'
              }`}
            >
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                i < step ? 'bg-[#FF6B4A] text-white' : i === step ? 'bg-[#FF6B4A]/20 text-[#FF6B4A]' : 'bg-[var(--card-bg-hover)] text-[var(--text-muted)]'
              }`}>
                {i < step ? <Check className="w-3 h-3" /> : i + 1}
              </span>
              {s}
            </button>
          </React.Fragment>
        ))}
      </div>

      {/* ═══ Step content ═══ */}
      <div className="flex-1 flex flex-col">
        {/* Step 0: Upload */}
        {step === 0 && (
          <div className="flex-1 flex items-center justify-center p-4 md:p-6 pb-24 md:pb-6 animate-fade-in">
            <div className="w-full max-w-2xl">
              <div className="text-center mb-8">
                <h1 className="font-(--font-display) text-3xl md:text-4xl font-bold mb-3 text-[var(--text-primary)]">
                  AI Sticker Pack
                </h1>
                <p className="text-[var(--text-tertiary)] text-sm">Upload a clear selfie to generate 6 expressive reaction stickers</p>
              </div>
              <div
                {...getRootProps()}
                className={`aspect-square max-w-md mx-auto rounded-3xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all duration-300 ${
                  isDragActive ? 'border-[#FF6B4A] bg-[#FF6B4A]/[0.03] scale-[1.01]' : 'border-[var(--overlay-border)] hover:border-[var(--overlay-border-hover)] hover:bg-[var(--card-bg)]'
                }`}
              >
                <input {...getInputProps()} />
                <div className="w-16 h-16 rounded-2xl bg-[var(--card-bg-hover)] flex items-center justify-center mb-5">
                  <UploadCloud className="w-7 h-7 text-[var(--text-tertiary)]" />
                </div>
                <p className="text-base font-semibold text-[var(--text-secondary)] mb-1">
                  {isDragActive ? 'Drop here' : 'Drop your photo'}
                </p>
                <p className="text-sm text-[var(--text-muted)]">or click to browse</p>
              </div>
              {/* Emotions preview */}
              <div className="flex items-center justify-center gap-4 mt-8">
                {EMOTIONS.map(e => (
                  <span key={e.id} className="text-2xl" title={e.label}>{e.emoji}</span>
                ))}
              </div>
              <p className="text-center text-[11px] text-[var(--text-muted)] mt-2">These 6 emotions will be generated</p>
            </div>
          </div>
        )}

        {/* Step 1: Style */}
        {step === 1 && (
          <div className="flex-1 flex flex-col p-4 md:p-6 pb-24 md:pb-6 animate-fade-in">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="font-(--font-display) text-2xl font-bold text-[var(--text-primary)]">Choose a Style</h2>
                <p className="text-sm text-[var(--text-tertiary)] mt-1">Pick the visual style for your sticker pack</p>
              </div>
              {sourceImage && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl overflow-hidden border border-[var(--overlay-border)]">
                    <img src={sourceImage.url} alt="Source" className="w-full h-full object-cover" />
                  </div>
                  <button onClick={() => { setSourceImage(null); setStep(0) }} className="text-xs text-[var(--text-muted)] hover:text-[var(--text-secondary)] cursor-pointer">Change photo</button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 flex-1">
              {STYLES.map(style => (
                <button
                  key={style.id}
                  onClick={() => setSelectedStyle(style.id)}
                  className={`group rounded-2xl border overflow-hidden transition-all duration-200 cursor-pointer flex flex-col ${
                    selectedStyle === style.id
                      ? 'border-[#FF6B4A] ring-1 ring-[#FF6B4A]/30 bg-[#FF6B4A]/[0.05]'
                      : 'border-[var(--overlay-border)] hover:border-[var(--overlay-border-hover)] bg-[var(--card-bg)]'
                  }`}
                >
                  <div className="aspect-square overflow-hidden bg-stone-900">
                    <img src={style.image} alt={style.label} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                  </div>
                  <div className="p-3">
                    <span className={`text-sm font-semibold ${selectedStyle === style.id ? 'text-[#FF6B4A]' : 'text-[var(--text-secondary)]'}`}>
                      {style.label}
                    </span>
                  </div>
                </button>
              ))}
            </div>

            <div className="mt-6 flex items-center justify-between">
              <Button variant="ghost" size="sm" onClick={() => setStep(0)}>
                <ArrowLeft className="w-4 h-4" /> Back
              </Button>
              <Button size="lg" onClick={generatePack}>
                Generate Pack <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Results */}
        {step === 2 && (
          <div className="flex-1 flex flex-col p-4 md:p-6 pb-24 md:pb-6 animate-fade-in">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="font-(--font-display) text-2xl font-bold text-[var(--text-primary)]">
                  {isGenerating ? 'Generating...' : 'Your Pack'}
                </h2>
                <p className="text-sm text-[var(--text-tertiary)] mt-1">
                  {isGenerating ? loadingText : `${generatedPack.length} stickers • ${selectedStyle} style`}
                </p>
              </div>
              {!isGenerating && generatedPack.length > 0 && (
                <Button variant="outline" size="sm" onClick={handleDownloadAll}>
                  <Download className="w-4 h-4" /> Download All
                </Button>
              )}
            </div>

            {error && (
              <div className="mb-4 px-4 py-3 bg-red-950/50 text-red-400 text-sm rounded-xl border border-red-900/30">
                {error}
                <Button variant="ghost" size="sm" className="ml-3 text-red-400" onClick={() => { setStep(1); setError(null) }}>
                  Try Again
                </Button>
              </div>
            )}

            {/* Results grid with stagger animation */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-5 flex-1">
              {EMOTIONS.map((emotion, i) => {
                const sticker = generatedPack.find(s => s.id === emotion.id)
                return (
                  <div
                    key={emotion.id}
                    className="flex flex-col items-center gap-3 animate-slide-up"
                    style={{ animationDelay: `${i * 0.08}s` }}
                  >
                    <div className="w-full aspect-square rounded-2xl bg-[var(--canvas-bg)] bg-size-[16px_16px] border border-[var(--overlay-border)] flex items-center justify-center p-4 relative group overflow-hidden">
                      {sticker ? (
                        <>
                          <img src={sticker.url} alt={emotion.label} className="w-full h-full object-contain drop-shadow-xl transition-transform duration-300 group-hover:scale-105" />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-2xl">
                            <Button size="sm" variant="secondary" onClick={() => downloadUrl(sticker.url, `sticker_${emotion.id}.png`)}>
                              <Download className="w-4 h-4" /> Save
                            </Button>
                          </div>
                        </>
                      ) : isGenerating ? (
                        <Loading size="sm" text="" />
                      ) : (
                        <div className="text-[var(--text-muted)] flex flex-col items-center gap-1">
                          <span className="text-3xl">{emotion.emoji}</span>
                        </div>
                      )}
                    </div>
                    <span className="text-xs font-medium text-[var(--text-tertiary)]">{emotion.emoji} {emotion.label}</span>
                  </div>
                )
              })}
            </div>

            {!isGenerating && (
              <div className="mt-6 flex items-center justify-between">
                <Button variant="ghost" size="sm" onClick={() => setStep(1)}>
                  <ArrowLeft className="w-4 h-4" /> Change Style
                </Button>
                <Button variant="ghost" size="sm" onClick={() => { setStep(0); setSourceImage(null); setGeneratedPack([]) }}>
                  New Pack
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
