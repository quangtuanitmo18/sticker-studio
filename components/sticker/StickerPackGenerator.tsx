'use client'

import {
    ArrowLeft,
    Download,
    Edit3,
    MessageCircle,
    Package,
    Plus,
    Send,
    Sparkles,
    X
} from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import * as React from 'react'

import '@/components/avatar/rpm-creator.css'
import { Loading } from '@/components/ui/Loading'
import { downloadBlob } from '@/lib/download'
import type { BodyPose } from '@/lib/sticker-body-poses'
import { BODY_POSES } from '@/lib/sticker-body-poses'
import type { StickerOverlay } from '@/lib/sticker-overlays'
import { OVERLAY_PRESETS } from '@/lib/sticker-overlays'
import type { ExpressionPreset } from '@/lib/sticker-presets'
import { EXPRESSION_PRESETS, STICKER_PACK_PRESETS, TEXT_PRESETS } from '@/lib/sticker-presets'
import {
    downloadStickerZip,
    renderStickerPack,
    type StickerConfig,
    type StickerOutput,
} from '@/lib/sticker-renderer'

// ─── Blendshape groups for editor ────────────────────────────

const BLENDSHAPE_GROUPS: Record<string, string[]> = {
  Eyes: [
    'eyeBlinkLeft', 'eyeBlinkRight', 'eyeWideLeft', 'eyeWideRight',
    'eyeSquintLeft', 'eyeSquintRight', 'eyeLookUpLeft', 'eyeLookUpRight',
    'eyeLookDownLeft', 'eyeLookDownRight', 'eyeLookInLeft', 'eyeLookInRight',
    'eyeLookOutLeft', 'eyeLookOutRight',
  ],
  Brows: [
    'browInnerUp', 'browDownLeft', 'browDownRight',
    'browOuterUpLeft', 'browOuterUpRight',
  ],
  Mouth: [
    'jawOpen', 'jawForward', 'jawLeft', 'jawRight',
    'mouthSmileLeft', 'mouthSmileRight', 'mouthFrownLeft', 'mouthFrownRight',
    'mouthLeft', 'mouthRight', 'mouthPucker', 'mouthFunnel',
    'mouthPressLeft', 'mouthPressRight',
    'mouthUpperUpLeft', 'mouthUpperUpRight',
    'mouthLowerDownLeft', 'mouthLowerDownRight',
    'mouthStretchLeft', 'mouthStretchRight',
    'mouthShrugUpper', 'mouthShrugLower',
    'mouthRollUpper', 'mouthRollLower',
    'mouthClose',
  ],
  Cheeks: [
    'cheekSquintLeft', 'cheekSquintRight', 'cheekPuff',
  ],
  Nose: [
    'noseSneerLeft', 'noseSneerRight',
  ],
  Tongue: [
    'tongueOut',
  ],
}

// ─── Sticker edit state ──────────────────────────────────────

interface StickerEditState {
  expression: ExpressionPreset
  pose: BodyPose
  overlay: StickerOverlay
  text: string
  customBlendshapes: Record<string, number>
}

// ─── Component ───────────────────────────────────────────────

export default function StickerPackGenerator() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const avatarUrl = searchParams.get('avatar')

  // Pack state
  const [stickers, setStickers] = React.useState<StickerOutput[]>([])
  const [stickerConfigs, setStickerConfigs] = React.useState<StickerConfig[]>([])
  const [isRendering, setIsRendering] = React.useState(false)
  const [progress, setProgress] = React.useState({ current: 0, total: 0 })
  const [error, setError] = React.useState<string | null>(null)

  // Editor state
  const [editingIndex, setEditingIndex] = React.useState<number | null>(null)
  const [editState, setEditState] = React.useState<StickerEditState | null>(null)
  const [activeEditorTab, setActiveEditorTab] = React.useState<'expression' | 'pose' | 'overlay' | 'text' | 'blendshapes'>('expression')
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null)
  const [isPreviewing, setIsPreviewing] = React.useState(false)

  // ─── Build initial configs from curated presets ──
  const buildDefaultConfigs = React.useCallback((): StickerConfig[] => {
    return STICKER_PACK_PRESETS.map((preset) => {
      // Resolve pose ID to actual BodyPose object
      const pose = BODY_POSES.find((p) => p.id === preset.poseId) ?? BODY_POSES[0]
      // Resolve overlay ID to actual StickerOverlay object
      const overlay = OVERLAY_PRESETS.find((o) => o.id === preset.overlayId) ?? OVERLAY_PRESETS[0]

      return {
        expression: preset.expression,
        pose,
        text: preset.text,
        overlay,
        customBlendshapes: preset.fineTune ?? {},
      }
    })
  }, [])

  // ─── Render sticker pack ──
  const renderPack = React.useCallback(async (configs: StickerConfig[]) => {
    if (!avatarUrl) return

    setIsRendering(true)
    setError(null)

    try {
      const result = await renderStickerPack(
        avatarUrl,
        configs,
        { width: 512, height: 512, transparent: true },
        (current, total) => setProgress({ current, total }),
      )
      setStickers(result)
    } catch (err: any) {
      setError(err.message || 'Failed to render stickers')
    } finally {
      setIsRendering(false)
    }
  }, [avatarUrl])

  // Initial render
  React.useEffect(() => {
    if (!avatarUrl) return
    const configs = buildDefaultConfigs()
    setStickerConfigs(configs)
    renderPack(configs)
  }, [avatarUrl, buildDefaultConfigs, renderPack])

  // ─── Editor handlers ──

  const openEditor = (index: number) => {
    const config = stickerConfigs[index]
    setEditState({
      expression: config.expression,
      pose: config.pose ?? BODY_POSES[0],
      overlay: config.overlay ?? OVERLAY_PRESETS[0],
      text: config.text ?? '',
      customBlendshapes: { ...config.expression.blendshapes, ...(config.customBlendshapes ?? {}) },
    })
    setEditingIndex(index)
    setActiveEditorTab('expression')
    // Show current sticker as initial preview
    setPreviewUrl(stickers[index]?.dataUrl ?? null)
  }

  const closeEditor = () => {
    setEditingIndex(null)
    setEditState(null)
    setPreviewUrl(null)
  }

  // ─── Auto-preview: debounced re-render on any edit state change ──
  React.useEffect(() => {
    if (!editState || !avatarUrl) return

    const timer = setTimeout(async () => {
      setIsPreviewing(true)
      try {
        const previewConfig: StickerConfig = {
          expression: editState.expression,
          pose: editState.pose,
          text: editState.text,
          overlay: editState.overlay,
          customBlendshapes: editState.customBlendshapes,
        }
        const result = await renderStickerPack(
          avatarUrl,
          [previewConfig],
          { width: 512, height: 512, transparent: true },
        )
        setPreviewUrl(result[0].dataUrl)
      } catch {
        // preview failed silently
      } finally {
        setIsPreviewing(false)
      }
    }, 300) // 300ms debounce

    return () => clearTimeout(timer)
  }, [editState, avatarUrl])

  const applyEdit = async () => {
    if (editingIndex === null || !editState || !avatarUrl) return

    const newConfig: StickerConfig = {
      expression: editState.expression,
      pose: editState.pose,
      text: editState.text,
      overlay: editState.overlay,
      customBlendshapes: editState.customBlendshapes,
    }

    // Update config
    const newConfigs = [...stickerConfigs]
    newConfigs[editingIndex] = newConfig
    setStickerConfigs(newConfigs)

    // Re-render just this one
    setIsRendering(true)
    try {
      const result = await renderStickerPack(
        avatarUrl,
        [newConfig],
        { width: 512, height: 512, transparent: true },
      )
      const newStickers = [...stickers]
      newStickers[editingIndex] = result[0]
      setStickers(newStickers)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsRendering(false)
      closeEditor()
    }
  }

  const handleRegenAll = () => {
    renderPack(stickerConfigs)
  }

  // ─── Download handlers ──

  const handleDownload = (sticker: StickerOutput) => {
    downloadBlob(sticker.blob, `sticker_${sticker.id}.png`)
  }

  const handleDownloadAll = async () => {
    await downloadStickerZip(stickers)
  }

  // ─── Platform export (Telegram/WhatsApp format) ──
  const handlePlatformExport = async (platform: 'telegram' | 'whatsapp') => {
    if (stickers.length === 0) return

    const size = 512 // Both platforms use 512px
    const format = 'webp' // Both use WebP
    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext('2d')!

    const blobs: { blob: Blob; name: string }[] = []

    for (const sticker of stickers) {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve()
        img.onerror = reject
        img.src = sticker.dataUrl
      })

      ctx.clearRect(0, 0, size, size)
      // Draw centered, maintaining aspect ratio
      const scale = Math.min(size / img.width, size / img.height)
      const w = img.width * scale
      const h = img.height * scale
      ctx.drawImage(img, (size - w) / 2, (size - h) / 2, w, h)

      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((b) => resolve(b!), `image/${format}`, 0.9)
      })
      blobs.push({ blob, name: `sticker_${sticker.id}.${format}` })
    }

    // Download as ZIP
    const { default: JSZip } = await import('jszip')
    const zip = new JSZip()
    for (const { blob, name } of blobs) {
      zip.file(name, blob)
    }
    const zipBlob = await zip.generateAsync({ type: 'blob' })
    downloadBlob(zipBlob, `sticker_pack_${platform}.zip`)
  }

  // ─── Add custom sticker ──
  const addCustomSticker = () => {
    // Create a blank sticker with neutral defaults
    const newConfig: StickerConfig = {
      expression: EXPRESSION_PRESETS[0], // first expression
      pose: BODY_POSES[0], // neutral
      text: '',
      overlay: OVERLAY_PRESETS[0], // none
      customBlendshapes: {},
    }
    const newConfigs = [...stickerConfigs, newConfig]
    setStickerConfigs(newConfigs)

    // Open editor immediately for the new sticker
    const newIndex = newConfigs.length - 1
    setEditState({
      expression: newConfig.expression,
      pose: BODY_POSES[0],
      overlay: OVERLAY_PRESETS[0],
      text: '',
      customBlendshapes: { ...newConfig.expression.blendshapes },
    })
    setEditingIndex(newIndex)
    setActiveEditorTab('expression')

    // Render a placeholder for the new sticker
    if (avatarUrl) {
      renderStickerPack(
        avatarUrl,
        [newConfig],
        { width: 512, height: 512, transparent: true },
      ).then((result) => {
        setStickers((prev) => [...prev, result[0]])
      })
    }
  }

  // ─── No avatar URL ──
  if (!avatarUrl) {
    return (
      <div className="rpm-preview-page">
        <div className="rpm-viewport" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
          <Sparkles size={48} style={{ color: '#7c3aed' }} />
          <h2 style={{ color: '#e4e4e7', fontSize: '20px', fontWeight: 600 }}>No Avatar Found</h2>
          <p style={{ color: '#71717a', fontSize: '14px' }}>Create an avatar first to generate a sticker pack.</p>
          <button className="rpm-btn rpm-btn-primary" onClick={() => router.push('/avatar-creator')}>
            <ArrowLeft size={16} />
            Go to Avatar Creator
          </button>
        </div>
      </div>
    )
  }

  // ─── Render ──
  return (
    <div className="rpm-preview-page">
      {/* Header */}
      <header className="rpm-header">
        <div className="rpm-header-left">
          <h1 className="rpm-title">
            <Sparkles size={20} style={{ color: '#7c3aed' }} />
            Sticker Pack
          </h1>
          <p className="rpm-subtitle">
            {isRendering
              ? `Rendering ${progress.current}/${progress.total}...`
              : `${stickers.length} stickers · Click ✏️ to customize`}
          </p>
        </div>
        <div className="rpm-header-actions">
          <button className="rpm-btn rpm-btn-primary rpm-btn-sm" onClick={addCustomSticker} title="Add custom sticker" disabled={isRendering}>
            <Plus size={16} /> Add
          </button>
          {stickers.length > 0 && (
            <button className="rpm-btn rpm-btn-primary" onClick={handleDownloadAll} disabled={isRendering}>
              <Download size={16} /> Download All
            </button>
          )}
          <button className="rpm-btn rpm-btn-outline" onClick={() => router.push('/avatar-creator')}>
            <ArrowLeft size={16} /> Back
          </button>
        </div>
      </header>

      {/* Main content */}
      <div className="sticker-grid-container">
        {isRendering && stickers.length === 0 ? (
          <div className="sticker-loading">
            <Loading text={`Rendering sticker ${progress.current + 1} of ${progress.total}...`} size="lg" />
            <div className="sticker-progress-bar">
              <div className="sticker-progress-fill" style={{ width: `${progress.total > 0 ? (progress.current / progress.total) * 100 : 0}%` }} />
            </div>
          </div>
        ) : error ? (
          <div className="sticker-error">
            <p>{error}</p>
            <button className="rpm-btn rpm-btn-primary" onClick={handleRegenAll}>Retry</button>
          </div>
        ) : (
          <div className="sticker-grid">
            {stickers.map((sticker, index) => (
              <div key={`${sticker.id}-${index}`} className="sticker-card">
                <div className="sticker-image-wrap">
                  <img src={sticker.dataUrl} alt={sticker.label} className="sticker-image" />
                  {isRendering && editingIndex === index && (
                    <div className="sticker-rendering-overlay">
                      <Loading size="sm" />
                    </div>
                  )}
                </div>
                <div className="sticker-label">
                  <span>{sticker.emoji}</span>
                  <span>{sticker.label}</span>
                </div>
                <div className="sticker-actions">
                  <button className="rpm-btn rpm-btn-outline rpm-btn-sm" onClick={() => openEditor(index)} title="Customize">
                    <Edit3 size={14} />
                  </button>
                  <button className="rpm-btn rpm-btn-primary rpm-btn-sm" onClick={() => handleDownload(sticker)} title="Download">
                    <Download size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Export bar */}
      {stickers.length > 0 && !isRendering && (
        <div className="rpm-export-bar">
          <button className="rpm-btn rpm-btn-primary" onClick={handleDownloadAll}>
            <Package size={16} /> Download All (ZIP)
          </button>
          <button className="rpm-btn rpm-btn-outline" onClick={() => handlePlatformExport('telegram')} title="Export for Telegram (512px WebP)">
            <Send size={16} /> Telegram
          </button>
          <button className="rpm-btn rpm-btn-outline" onClick={() => handlePlatformExport('whatsapp')} title="Export for WhatsApp (512px WebP)">
            <MessageCircle size={16} /> WhatsApp
          </button>
        </div>
      )}

      {/* ─── Editor Modal ─── */}
      {editingIndex !== null && editState && (
        <div className="editor-overlay" onClick={closeEditor}>
          <div className="editor-panel" onClick={(e) => e.stopPropagation()}>
            {/* Editor header */}
            <div className="editor-header">
              <h3>Customize: {editState.expression.emoji} {editState.expression.label}</h3>
              <button className="rpm-btn rpm-btn-outline rpm-btn-sm" onClick={closeEditor}>
                <X size={14} />
              </button>
            </div>

            {/* Editor body: left preview + right settings */}
            <div className="editor-body">
              {/* Left: Preview */}
              <div className="editor-preview">
                <div className="editor-preview-image-wrap">
                  {previewUrl ? (
                    <img src={previewUrl} alt="Preview" className="editor-preview-image" />
                  ) : (
                    <div className="editor-preview-placeholder">
                      <Sparkles size={32} style={{ color: '#52525b' }} />
                      <span>Loading preview...</span>
                    </div>
                  )}
                  {isPreviewing && (
                    <div className="sticker-rendering-overlay">
                      <Loading size="sm" />
                    </div>
                  )}
                </div>
              </div>

              {/* Right: Settings */}
              <div className="editor-settings">
                {/* Editor tabs */}
                <div className="editor-tabs">
                  {([
                    { key: 'expression', label: '😀 Expression', icon: null },
                    { key: 'pose', label: '🤸 Pose', icon: null },
                    { key: 'overlay', label: '✨ Effects', icon: null },
                    { key: 'text', label: '💬 Text', icon: null },
                    { key: 'blendshapes', label: '🏛️ Fine Tune', icon: null },
                  ] as const).map((tab) => (
                    <button
                      key={tab.key}
                      className={`editor-tab ${activeEditorTab === tab.key ? 'active' : ''}`}
                      onClick={() => setActiveEditorTab(tab.key)}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Tab content */}
                <div className="editor-content">
                  {/* Expression tab */}
                  {activeEditorTab === 'expression' && (
                    <div className="editor-grid">
                      {EXPRESSION_PRESETS.map((expr) => (
                        <button
                          key={expr.id}
                          className={`editor-chip ${editState.expression.id === expr.id ? 'active' : ''}`}
                          onClick={() => setEditState((s) => s ? ({
                            ...s,
                            expression: expr,
                            customBlendshapes: { ...expr.blendshapes },
                          }) : s)}
                        >
                          <span className="editor-chip-emoji">{expr.emoji}</span>
                          <span>{expr.label}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Pose tab */}
                  {activeEditorTab === 'pose' && (
                    <div className="editor-grid">
                      {BODY_POSES.map((pose) => (
                        <button
                          key={pose.id}
                          className={`editor-chip ${editState.pose.id === pose.id ? 'active' : ''}`}
                          onClick={() => setEditState((s) => s ? ({ ...s, pose }) : s)}
                        >
                          <span className="editor-chip-emoji">{pose.emoji}</span>
                          <span>{pose.label}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Overlay tab */}
                  {activeEditorTab === 'overlay' && (
                    <div className="editor-grid">
                      {OVERLAY_PRESETS.map((ov) => (
                        <button
                          key={ov.id}
                          className={`editor-chip ${editState.overlay.id === ov.id ? 'active' : ''}`}
                          onClick={() => setEditState((s) => s ? ({ ...s, overlay: ov }) : s)}
                        >
                          <span className="editor-chip-emoji">{ov.emoji}</span>
                          <span>{ov.label}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Text tab */}
                  {activeEditorTab === 'text' && (
                    <div className="editor-text-section">
                      <div className="editor-text-input-wrap">
                        <input
                          type="text"
                          value={editState.text}
                          onChange={(e) => setEditState((s) => s ? ({ ...s, text: e.target.value }) : s)}
                          placeholder="Type custom text..."
                          className="editor-text-input"
                          maxLength={20}
                        />
                        {editState.text && (
                          <button
                            className="editor-text-clear"
                            onClick={() => setEditState((s) => s ? ({ ...s, text: '' }) : s)}
                          >
                            <X size={14} />
                          </button>
                        )}
                      </div>
                      <p className="editor-hint">Or pick a preset:</p>
                      <div className="editor-text-presets">
                        {TEXT_PRESETS.map((text) => (
                          <button
                            key={text}
                            className={`sticker-text-chip ${editState.text === text ? 'active' : ''}`}
                            onClick={() => setEditState((s) => s ? ({ ...s, text: editState.text === text ? '' : text }) : s)}
                          >
                            {text}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Blendshapes tab */}
                  {activeEditorTab === 'blendshapes' && (
                    <div className="editor-blendshapes">
                      {Object.entries(BLENDSHAPE_GROUPS).map(([group, names]) => (
                        <details key={group} className="editor-bs-group" open={group === 'Mouth' || group === 'Eyes'}>
                          <summary className="editor-bs-group-title">{group}</summary>
                          <div className="editor-bs-sliders">
                            {names.map((name) => (
                              <div key={name} className="editor-bs-slider">
                                <label title={name}>{name.replace(/([A-Z])/g, ' $1').trim()}</label>
                                <input
                                  type="range"
                                  min="0"
                                  max="1"
                                  step="0.05"
                                  value={editState.customBlendshapes[name] ?? 0}
                                  onChange={(e) => {
                                    const val = parseFloat(e.target.value)
                                    setEditState((s) => {
                                      if (!s) return s
                                      const next = { ...s.customBlendshapes }
                                      if (val === 0) delete next[name]
                                      else next[name] = val
                                      return { ...s, customBlendshapes: next }
                                    })
                                  }}
                                />
                                <span className="editor-bs-value">
                                  {(editState.customBlendshapes[name] ?? 0).toFixed(2)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </details>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Apply button */}
            <div className="editor-footer">
              <button className="rpm-btn rpm-btn-outline" onClick={closeEditor}>Cancel</button>
              <button className="rpm-btn rpm-btn-primary" onClick={applyEdit} disabled={isRendering}>
                {isRendering ? 'Rendering...' : 'Apply Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
