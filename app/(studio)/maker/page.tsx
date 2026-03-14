'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { useDropzone } from 'react-dropzone'
import { UploadCloud, Image as ImageIcon, Download, Type, LayoutTemplate, Square, Trash2, Layers } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Loading } from '@/components/ui/Loading'
import { downloadUrl } from '@/lib/download'
import dynamic from 'next/dynamic'
import { CanvasElement } from './CanvasEditor'

const CanvasEditor = dynamic(() => import('./CanvasEditor'), { ssr: false })

export default function MakerPage() {
  const [file, setFile] = useState<File | null>(null)
  const [originalUrl, setOriginalUrl] = useState<string | null>(null)
  const [processedUrl, setProcessedUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Canvas State
  const [elements, setElements] = useState<CanvasElement[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [isProcessingCanvas, setIsProcessingCanvas] = useState(false)

  // Tabs
  const [activeTab, setActiveTab] = useState<'border' | 'text' | 'templates'>('border')
  const [activeTemplateCategory, setActiveTemplateCategory] = useState<'shapes' | 'animals' | 'food' | 'nature' | 'objects' | 'avatars' | 'emojis'>('shapes')

  // Border State
  const [outlineWidth, setOutlineWidth] = useState(15)
  const [shadowBlur, setShadowBlur] = useState(15)
  const [outlineColor, setOutlineColor] = useState('#ffffff')
  
  // Text State
  const [stickerText, setStickerText] = useState('')
  const [textColor, setTextColor] = useState('#ffffff')
  const [textOutlineColor, setTextOutlineColor] = useState('#000000')
  const [fontFamily, setFontFamily] = useState('Impact')

  const generateOutline = useCallback(async (
    imageUrl: string, 
    width: number, 
    blur: number,
    color: string
  ) => {
    return new Promise<string>((resolve, reject) => {
      const img = new Image()
      if (!imageUrl.startsWith('data:') && !imageUrl.startsWith('blob:')) {
        img.crossOrigin = "anonymous"
      }
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        if (!ctx) return reject('No 2d context')

        const padding = width + blur + 10 
        
        canvas.width = img.width + padding * 2
        canvas.height = img.height + padding * 2

        // 1. Create silhouette
        const silCanvas = document.createElement('canvas')
        silCanvas.width = img.width
        silCanvas.height = img.height
        const silCtx = silCanvas.getContext('2d')
        if (!silCtx) return reject('No 2d context')
        silCtx.drawImage(img, 0, 0)
        silCtx.globalCompositeOperation = 'source-in'
        silCtx.fillStyle = color
        silCtx.fillRect(0, 0, silCanvas.width, silCanvas.height)

        // 2. Create outline
        const outCanvas = document.createElement('canvas')
        outCanvas.width = canvas.width
        outCanvas.height = canvas.height
        const outCtx = outCanvas.getContext('2d')
        if (!outCtx) return reject('No 2d context')

        const centerX = padding
        const centerY = padding

        // Draw silhouette in a circle to create outline
        const steps = 36 // Number of angles
        for (let i = 0; i < steps; i++) {
          const angle = (i * Math.PI * 2) / steps
          const x = centerX + Math.cos(angle) * width
          const y = centerY + Math.sin(angle) * width
          outCtx.drawImage(silCanvas, x, y)
        }

        // 3. Draw outline with shadow to main canvas
        ctx.shadowColor = 'rgba(0, 0, 0, 0.4)'
        ctx.shadowBlur = blur
        ctx.shadowOffsetX = 0
        ctx.shadowOffsetY = 4
        ctx.drawImage(outCanvas, 0, 0)

        // 4. Draw original image
        ctx.shadowColor = 'transparent'
        ctx.shadowBlur = 0
        ctx.shadowOffsetX = 0
        ctx.shadowOffsetY = 0
        ctx.drawImage(img, centerX, centerY)

        resolve(canvas.toDataURL('image/png'))
      }
      img.onerror = () => reject(new Error('Failed to load image for canvas processing'))
      img.src = imageUrl
    })
  }, [])

  useEffect(() => {
    if (!processedUrl) return
    
    let isMounted = true
    setIsProcessingCanvas(true)

    generateOutline(processedUrl, outlineWidth, shadowBlur, outlineColor)
      .then(url => {
        if (isMounted) {
          setElements(prev => {
            const existing = prev.find(e => e.type === 'main-sticker')
            if (existing) {
              return prev.map(e => e.type === 'main-sticker' ? { ...e, src: url } : e)
            } else {
              return [{
                id: 'main-sticker',
                type: 'main-sticker',
                src: url,
                x: 100,
                y: 100,
              }, ...prev]
            }
          })
        }
      })
      .catch(err => {
        console.error("Canvas error:", err)
        if (isMounted) setError("Failed to generate sticker outline")
      })
      .finally(() => {
        if (isMounted) setIsProcessingCanvas(false)
      })

    return () => { isMounted = false }
  }, [processedUrl, outlineWidth, shadowBlur, outlineColor, generateOutline])

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const selectedFile = acceptedFiles[0]
    if (!selectedFile) return

    setFile(selectedFile)
    const objectUrl = URL.createObjectURL(selectedFile)
    setOriginalUrl(objectUrl)
    setProcessedUrl(null)
    setElements([])
    setError(null)
    setLoading(true)

    try {
      // 1. Convert file to base64 and resize if necessary
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.readAsDataURL(selectedFile)
        reader.onload = (e) => {
          const img = new Image()
          img.onload = () => {
            const canvas = document.createElement('canvas')
            let width = img.width
            let height = img.height
            
            // Max dimensions
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
              const mimeType = selectedFile.type === 'image/png' ? 'image/png' : 'image/jpeg'
              const quality = mimeType === 'image/jpeg' ? 0.8 : undefined
              resolve(canvas.toDataURL(mimeType, quality))
            } else {
              resolve(e.target?.result as string)
            }
          }
          img.onerror = () => reject(new Error('Failed to load image'))
          img.src = e.target?.result as string
        }
        reader.onerror = error => reject(error)
      })

      // 2. Call Background Removal API
      const response = await fetch('/api/remove-bg', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl: base64 })
      })

      if (!response.ok) {
        const errData = await response.json()
        throw new Error(errData.error || 'Failed to remove background')
      }

      const resultData = await response.json()
      setProcessedUrl(resultData.url)

    } catch (err: any) {
      console.error(err)
      setError(err.message || 'An unexpected error occurred. Using original image instead.')
      setProcessedUrl(objectUrl)
    } finally {
      setLoading(false)
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop,
    accept: {
      'image/jpeg': [],
      'image/png': [],
      'image/webp': []
    },
    maxFiles: 1
  })

  const handleExport = async (dataUrl: string) => {
    downloadUrl(dataUrl, 'sticker.png')
  }

  // Better way to handle export action
  const [exportAction, setExportAction] = useState<'download' | null>(null)
  
  useEffect(() => {
    if (exportAction && (window as any).exportCanvas) {
      (window as any).exportCanvas()
    }
  }, [exportAction])

  const handleCanvasExport = (dataUrl: string) => {
    if (exportAction) {
      handleExport(dataUrl)
      setExportAction(null)
    }
  }

  const handleAddText = () => {
    if (!stickerText) return
    setElements(prev => [...prev, {
      id: `text-${Date.now()}`,
      type: 'text',
      text: stickerText,
      x: 150,
      y: 150,
      fontSize: 60,
      fontFamily,
      fill: textColor,
      stroke: textOutlineColor,
      strokeWidth: 2,
    }])
    setStickerText('')
  }

  const handleAddTextPreset = (presetFont: string, fill: string, stroke: string, strokeWidth: number = 2) => {
    setElements(prev => [...prev, {
      id: `text-${Date.now()}`,
      type: 'text',
      text: 'Sample Text',
      x: 150,
      y: 150,
      fontSize: 60,
      fontFamily: presetFont,
      fill,
      stroke,
      strokeWidth,
    }])
  }

  const handleAddTemplate = (src: string) => {
    setElements(prev => [...prev, {
      id: `template-${Date.now()}`,
      type: 'image',
      src,
      x: 150,
      y: 150,
    }])
  }

  // Pre-defined templates
  const TEMPLATE_CATEGORIES = {
    shapes: {
      name: 'Shapes',
      items: [
        ...['star', 'heart', 'ring', 'polygon', 'burst', 'circle', 'square', 'triangle'].map(seed => `https://api.dicebear.com/7.x/shapes/svg?seed=${seed}&backgroundColor=transparent`),
        ...['2b50', '2b55', '274c', '2714', '2795', '2796', '2716', '2797', '1f4a0', '1f534', '1f535', '26aa', '26ab', '1f7e0', '1f7e1', '1f7e2', '1f7e3', '1f7e4', '1f536', '1f537', '1f538', '1f539', '1f53a', '1f53b', '1f53c', '1f53d', '25aa', '25ab', '25fe', '25fd', '25fc', '25fb', '2b1b', '2b1c', '1f7e5', '1f7e7', '1f7e8', '1f7e9', '1f7ea', '1f7eb', '25b6', '25c0', '23e9', '23ea', '23eb', '23ec'].map(code => `https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/svg/${code}.svg`)
      ]
    },
    animals: {
      name: 'Animals',
      items: [
        '1f436', '1f431', '1f98a', '1f43b', '1f43c', '1f428', '1f42f', '1f981', '1f42e', '1f437', '1f438', '1f435', '1f984', '1f987', '1f989', '1f419', '1f98b', '1f41b', '1f40d', '1f422', '1f995', '1f433', '1f412', '1f98d', '1f9a7', '1f415', '1f9ae', '1f429', '1f43a', '1f99d', '1f408', '1f405', '1f406', '1f434', '1f9ac', '1f98c', '1f402', '1f403', '1f404', '1f416', '1f417', '1f43d', '1f40f', '1f411', '1f410', '1f42a', '1f42b', '1f999', '1f992', '1f418', '1f9a3', '1f98f', '1f99b', '1f401', '1f400', '1f439', '1f430', '1f407', '1f43f', '1f994', '1f9a5', '1f9a6', '1f9a8', '1f998', '1f9a1'
      ].map(code => `https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/svg/${code}.svg`)
    },
    food: {
      name: 'Food',
      items: [
        '1f34e', '1f34f', '1f350', '1f34a', '1f34b', '1f34c', '1f349', '1f347', '1f353', '1f348', '1f352', '1f351', '1f96d', '1f34d', '1f965', '1f95d', '1f345', '1f346', '1f951', '1f966', '1f96c', '1f952', '1f336', '1f954', '1f955', '1f33d', '1f360', '1f95c', '1f36f', '1f950', '1f35e', '1f956', '1f968', '1f9c0', '1f95a', '1f373', '1f953', '1f356', '1f357', '1f35f', '1f355', '1f32d', '1f354', '1f32e', '1f32f', '1f959', '1f9c6', '1f372', '1f958', '1f35c', '1f35d', '1f363', '1f371', '1f35b', '1f359', '1f35a', '1f358', '1f365', '1f361', '1f362', '1f364', '1f366', '1f367', '1f368', '1f369', '1f36a', '1f382', '1f370', '1f9c1', '1f36e', '1f36c', '1f36d', '1f36b', '1f37f'
      ].map(code => `https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/svg/${code}.svg`)
    },
    nature: {
      name: 'Nature',
      items: [
        '1f332', '1f333', '1f334', '1f335', '1f337', '1f33b', '1f339', '1f340', '1f341', '1f342', '1f343', '1f344', '2600', '1f319', '2b50', '2601', '26a1', '1f308', '2602', '2744', '1f30d', '1f30e', '1f30f', '1f311', '1f312', '1f313', '1f314', '1f315', '1f316', '1f317', '1f318', '1f31a', '1f31b', '1f31c', '1f31d', '1f31e', '1f31f', '1f320', '1f321', '26c5', '26c8', '1f324', '1f325', '1f326', '1f327', '1f328', '1f329', '1f32a', '1f32b', '1f32c', '1f300', '2614', '26f1', '2603', '26c4', '2604', '1f525', '1f4a7', '1f30a'
      ].map(code => `https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/svg/${code}.svg`)
    },
    objects: {
      name: 'Objects',
      items: [
        '1f4bb', '1f4f1', '1f4f7', '1f4fa', '1f579', '1f3ae', '1f4fb', '1f52d', '1f52c', '1f4a1', '1f4d6', '1f4b0', '1f48e', '1f381', '1f388', '1f389', '1f392', '1f45f', '1f451', '1f3a9', '231a', '1f4f2', '1f4f3', '1f4f4', '1f4f5', '1f4f6', '1f4f8', '1f4f9', '1f4fc', '1f50d', '1f50e', '1f50f', '1f510', '1f511', '1f512', '1f513', '1f514', '1f515', '1f526', '1f527', '1f528', '1f529', '1f52a', '1f52b', '1f52e', '1f52f', '1f530', '1f531', '1f532', '1f533'
      ].map(code => `https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/svg/${code}.svg`)
    },
    avatars: {
      name: 'Avatars',
      items: [
        ...Array.from({length: 15}).map((_, i) => `https://api.dicebear.com/7.x/avataaars/svg?seed=Avatar${i}&backgroundColor=transparent`),
        ...Array.from({length: 15}).map((_, i) => `https://api.dicebear.com/7.x/bottts/svg?seed=Bot${i}&backgroundColor=transparent`),
        ...Array.from({length: 15}).map((_, i) => `https://api.dicebear.com/7.x/adventurer/svg?seed=Adv${i}&backgroundColor=transparent`),
        ...Array.from({length: 15}).map((_, i) => `https://api.dicebear.com/7.x/fun-emoji/svg?seed=Fun${i}&backgroundColor=transparent`),
        ...Array.from({length: 15}).map((_, i) => `https://api.dicebear.com/7.x/micah/svg?seed=Micah${i}&backgroundColor=transparent`)
      ]
    },
    emojis: {
      name: 'Emojis',
      items: [
        '1f600', '1f601', '1f602', '1f923', '1f603', '1f604', '1f605', '1f606', '1f609', '1f60a', '1f60b', '1f60e', '1f60d', '1f618', '1f617', '1f619', '1f61a', '263a', '1f642', '1f917', '1f929', '1f914', '1f928', '1f610', '1f611', '1f636', '1f644', '1f60f', '1f623', '1f625', '1f62e', '1f910', '1f62f', '1f62a', '1f62b', '1f634', '1f60c', '1f61b', '1f61c', '1f61d', '1f924', '1f612', '1f613', '1f614', '1f615', '1f643', '1f911', '1f632', '1f637', '1f912', '1f915', '1f922', '1f92e', '1f927', '1f635', '1f92f', '1f920', '1f973', '1f608', '1f47f', '1f479', '1f47a', '1f480', '2620', '1f47b', '1f47d', '1f47e', '1f916', '1f4a9', '1f63a', '1f638', '1f639', '1f63b', '1f63c', '1f63d', '1f640', '1f63f', '1f63e', '1f648', '1f649', '1f64a'
      ].map(code => `https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/svg/${code}.svg`)
    }
  }

  return (
    <div className="flex flex-col items-center justify-start min-h-[calc(100vh-4rem)] p-8">
      <div className="w-full max-w-6xl flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Sticker Maker</h1>
          <p className="text-zinc-500">Create custom stickers with text, borders, and templates.</p>
        </div>
        {file && (
          <Button 
            variant="ghost" 
            onClick={() => {
              setFile(null)
              setOriginalUrl(null)
              setProcessedUrl(null)
              setElements([])
              setError(null)
            }}
          >
            Start Over
          </Button>
        )}
      </div>

      {error && (
        <div className="w-full max-w-6xl p-4 mb-8 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-lg">
          {error}
        </div>
      )}

      {!file && (
        <div 
          {...getRootProps()} 
          className={`w-full max-w-2xl p-12 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-colors ${
            isDragActive ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' : 'border-zinc-300 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-600'
          }`}
        >
          <input {...getInputProps()} />
          <UploadCloud className="w-12 h-12 text-zinc-400 mb-4" />
          <p className="text-lg font-medium mb-1">
            {isDragActive ? "Drop the image here" : "Drag & drop an image here"}
          </p>
          <p className="text-sm text-zinc-500">or click to select a file</p>
        </div>
      )}

      {file && (
        <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Canvas Area */}
          <div className="lg:col-span-2 flex flex-col items-center">
            <div className="w-full aspect-square bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-zinc-100 dark:bg-zinc-800 rounded-2xl overflow-hidden relative flex items-center justify-center border border-zinc-200 dark:border-zinc-700">
              {loading ? (
                <Loading text="Removing background..." />
              ) : isProcessingCanvas && elements.length === 0 ? (
                <Loading text="Generating sticker..." />
              ) : (
                <CanvasEditor 
                  elements={elements} 
                  setElements={setElements} 
                  selectedId={selectedId} 
                  setSelectedId={setSelectedId}
                  onExport={handleCanvasExport}
                  width={600}
                  height={600}
                />
              )}
            </div>
            <p className="text-sm text-zinc-500 mt-4 text-center">
              Drag, resize, and rotate elements on the canvas. Click an empty area to deselect.
            </p>
          </div>

          {/* Sidebar Area */}
          <div className="flex flex-col h-full">
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden flex-1">
              {/* Tabs Header */}
              <div className="flex border-b border-zinc-200 dark:border-zinc-800">
                <button 
                  onClick={() => setActiveTab('border')} 
                  className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 ${activeTab === 'border' ? 'border-b-2 border-indigo-500 text-indigo-600' : 'text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800/50'}`}
                >
                  <Square className="w-4 h-4" /> Border
                </button>
                <button 
                  onClick={() => setActiveTab('text')} 
                  className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 ${activeTab === 'text' ? 'border-b-2 border-indigo-500 text-indigo-600' : 'text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800/50'}`}
                >
                  <Type className="w-4 h-4" /> Text
                </button>
                <button 
                  onClick={() => setActiveTab('templates')} 
                  className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 ${activeTab === 'templates' ? 'border-b-2 border-indigo-500 text-indigo-600' : 'text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800/50'}`}
                >
                  <LayoutTemplate className="w-4 h-4" /> Templates
                </button>
              </div>

              {/* Tabs Content */}
              <div className="p-6">
                {activeTab === 'border' && (
                  <div className="space-y-6">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Border Color</label>
                      <div className="flex items-center gap-2">
                        <input 
                          type="color" 
                          value={outlineColor} 
                          onChange={(e) => setOutlineColor(e.target.value)}
                          className="w-8 h-8 rounded cursor-pointer"
                        />
                        <span className="text-sm uppercase">{outlineColor}</span>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between mb-2">
                        <label className="text-sm font-medium">Outline Width</label>
                        <span className="text-sm text-zinc-500">{outlineWidth}px</span>
                      </div>
                      <input 
                        type="range" 
                        min="0" 
                        max="50" 
                        value={outlineWidth} 
                        onChange={(e) => setOutlineWidth(Number(e.target.value))}
                        className="w-full accent-indigo-600"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between mb-2">
                        <label className="text-sm font-medium">Shadow Blur</label>
                        <span className="text-sm text-zinc-500">{shadowBlur}px</span>
                      </div>
                      <input 
                        type="range" 
                        min="0" 
                        max="50" 
                        value={shadowBlur} 
                        onChange={(e) => setShadowBlur(Number(e.target.value))}
                        className="w-full accent-indigo-600"
                      />
                    </div>
                  </div>
                )}

                {activeTab === 'text' && (
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Text Content</label>
                      <input 
                        type="text" 
                        placeholder="e.g. WOW!, OMG, LOL" 
                        value={stickerText}
                        onChange={(e) => setStickerText(e.target.value)}
                        className="w-full p-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-transparent"
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs text-zinc-500 block mb-1">Text Color</label>
                        <div className="flex items-center gap-2">
                          <input 
                            type="color" 
                            value={textColor} 
                            onChange={(e) => setTextColor(e.target.value)}
                            className="w-8 h-8 rounded cursor-pointer"
                          />
                          <span className="text-sm uppercase">{textColor}</span>
                        </div>
                      </div>
                      <div>
                        <label className="text-xs text-zinc-500 block mb-1">Outline Color</label>
                        <div className="flex items-center gap-2">
                          <input 
                            type="color" 
                            value={textOutlineColor} 
                            onChange={(e) => setTextOutlineColor(e.target.value)}
                            className="w-8 h-8 rounded cursor-pointer"
                          />
                          <span className="text-sm uppercase">{textOutlineColor}</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="text-xs text-zinc-500 block mb-1">Font Family</label>
                      <select 
                        value={fontFamily} 
                        onChange={(e) => setFontFamily(e.target.value)}
                        className="w-full p-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-transparent text-sm"
                      >
                        <option value="Impact">Impact</option>
                        <option value="Arial">Arial</option>
                        <option value="Comic Sans MS">Comic Sans MS</option>
                        <option value="Courier New">Courier New</option>
                        <option value="Georgia">Georgia</option>
                        <option value="Verdana">Verdana</option>
                      </select>
                    </div>

                    <Button onClick={handleAddText} className="w-full" disabled={!stickerText}>
                      Add Text to Canvas
                    </Button>

                    <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 mt-4">
                      <h4 className="text-sm font-medium mb-3">Quick Presets</h4>
                      <div className="grid grid-cols-2 gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleAddTextPreset('Impact', '#ffffff', '#000000', 3)}>
                          Meme Style
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleAddTextPreset('Comic Sans MS', '#ffeb3b', '#ff9800', 2)}>
                          Fun Style
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleAddTextPreset('Arial', '#ff4081', '#ffffff', 2)}>
                          Pop Style
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleAddTextPreset('Courier New', '#00e5ff', '#000000', 2)}>
                          Cyber Style
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'templates' && (
                  <div className="space-y-4">
                    <p className="text-sm text-zinc-500">Click a template to add it to your canvas.</p>
                    
                    <div className="flex flex-wrap gap-2 mb-4">
                      {(Object.keys(TEMPLATE_CATEGORIES) as Array<keyof typeof TEMPLATE_CATEGORIES>).map((category) => (
                        <Button
                          key={category}
                          variant={activeTemplateCategory === category ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setActiveTemplateCategory(category)}
                          className="text-xs"
                        >
                          {TEMPLATE_CATEGORIES[category].name}
                        </Button>
                      ))}
                    </div>

                    <div className="grid grid-cols-3 gap-3 max-h-[300px] overflow-y-auto pr-2">
                      {TEMPLATE_CATEGORIES[activeTemplateCategory].items.map((src, idx) => (
                        <div 
                          key={idx} 
                          className="aspect-square bg-zinc-50 dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 flex items-center justify-center p-2 cursor-pointer hover:border-indigo-500 transition-colors"
                          onClick={() => handleAddTemplate(src)}
                        >
                          <img src={src} alt={`Template ${idx}`} className="w-full h-full object-contain" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Selected Element Actions */}
                {selectedId && (
                  <div className="mt-6 pt-4 border-t border-zinc-200 dark:border-zinc-800">
                    <Button 
                      variant="destructive" 
                      onClick={() => {
                        setElements(prev => prev.filter(e => e.id !== selectedId))
                        setSelectedId(null)
                      }} 
                      className="w-full"
                    >
                      <Trash2 className="w-4 h-4 mr-2" /> Delete Selected Element
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Export Actions */}
            <div className="mt-6 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm p-6">
              <div className="flex flex-col gap-3">
                <Button 
                  onClick={() => setExportAction('download')} 
                  className="w-full gap-2" 
                  disabled={elements.length === 0}
                >
                  <Download className="w-4 h-4" />
                  Download Sticker
                </Button>
              </div>
              
              {error && (
                <div className="mt-4 text-red-500 text-sm text-center">
                  {error}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

