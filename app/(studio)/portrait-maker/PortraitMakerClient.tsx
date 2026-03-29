"use client";

import type { ExportFormat } from "@/components/shared/ExportFormatPanel";
import {
  ExportFormatPanel,
} from "@/components/shared/ExportFormatPanel";
import { SidebarHeader } from "@/components/shared/SidebarHeader";
import { SidebarTabStrip } from "@/components/shared/SidebarTabStrip";
import { Loading } from "@/components/ui/Loading";
import { useToast } from "@/components/ui/toast";
import { useHistory } from "@/hooks/use-history";
import { downloadUrl } from "@/lib/download";
import {
  Check,
  CropIcon,
  Download,
  Maximize2,
  Palette,
  Plus,
  Redo2,
  Undo2,
  UserSquare2,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useDropzone } from "react-dropzone";

// ─── Size presets ──────────────────────────────────────────
const SIZE_PRESETS = [
  { id: "passport", label: "Passport", w: 413, h: 531, aspect: "35×45 mm" },
  { id: "3x4", label: "3×4 cm", w: 354, h: 472, aspect: "3×4 cm" },
  { id: "4x6", label: "4×6 cm", w: 472, h: 709, aspect: "4×6 cm" },
  { id: "1x1", label: "Square", w: 600, h: 600, aspect: "1:1" },
  { id: "2x3", label: "2×3", w: 400, h: 600, aspect: "2:3" },
];

// ─── Background color presets ──────────────────────────────
const BG_COLORS = [
  { id: "blue", label: "Blue", color: "#0066CC" },
  { id: "light-blue", label: "Light Blue", color: "#4DA6FF" },
  { id: "white", label: "White", color: "#FFFFFF" },
  { id: "red", label: "Red", color: "#CC0000" },
  { id: "grey", label: "Grey", color: "#E0E0E0" },
  { id: "green", label: "Green", color: "#00994C" },
  { id: "dark-blue", label: "Navy", color: "#003366" },
  {
    id: "gradient-blue",
    label: "Gradient Blue",
    color: "linear-gradient(180deg, #4DA6FF 0%, #0052A3 100%)",
  },
];

// ─── History state ─────────────────────────────────────────
interface PortraitState {
  bgColor: string;
  sizeId: string;
  imgPos: { x: number; y: number };
  imgScale: number;
}

type SideTab = "size" | "background";

export default function PortraitMakerClient() {
  // ─── File & processing state ────────────────────────────
  const [file, setFile] = useState<File | null>(null);
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  const [processedUrl, setProcessedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState("Removing background...");
  const { toast } = useToast();

  // ─── UI state ───────────────────────────────────────────
  const [sideTab, setSideTab] = useState<SideTab>("size");
  const [selectedSize, setSelectedSize] = useState(SIZE_PRESETS[0]);
  const [bgColor, setBgColor] = useState(BG_COLORS[0].color);
  const [customColor, setCustomColor] = useState("#0066CC");
  const [exportFormat, setExportFormat] = useState<ExportFormat>("png");
  const [showExport, setShowExport] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [zoom, setZoom] = useState(1);

  // ─── Canvas state ───────────────────────────────────────
  const [imgPos, setImgPos] = useState({ x: 0, y: 0 });
  const [imgScale, setImgScale] = useState(1);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dragRef = useRef<{
    startX: number;
    startY: number;
    origX: number;
    origY: number;
  } | null>(null);
  const naturalSizeRef = useRef<{ w: number; h: number }>({ w: 0, h: 0 });
  const cachedImgRef = useRef<HTMLImageElement | null>(null);

  // ─── Undo/Redo ──────────────────────────────────────────
  const history = useHistory<PortraitState>({
    bgColor: BG_COLORS[0].color,
    sizeId: SIZE_PRESETS[0].id,
    imgPos: { x: 0, y: 0 },
    imgScale: 1,
  });

  const pushHistory = useCallback(() => {
    history.set({
      bgColor,
      sizeId: selectedSize.id,
      imgPos,
      imgScale,
    });
  }, [bgColor, selectedSize.id, imgPos, imgScale, history]);

  const handleUndo = useCallback(() => {
    history.undo();
    const s = history.state;
    setBgColor(s.bgColor);
    setSelectedSize(
      SIZE_PRESETS.find((p) => p.id === s.sizeId) || SIZE_PRESETS[0],
    );
    setImgPos(s.imgPos);
    setImgScale(s.imgScale);
  }, [history]);

  const handleRedo = useCallback(() => {
    history.redo();
    const s = history.state;
    setBgColor(s.bgColor);
    setSelectedSize(
      SIZE_PRESETS.find((p) => p.id === s.sizeId) || SIZE_PRESETS[0],
    );
    setImgPos(s.imgPos);
    setImgScale(s.imgScale);
  }, [history]);

  // ─── Background removal (multi-fallback) ────────────────
  const removeBackground = useCallback(
    async (imageFile: File): Promise<string> => {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(imageFile);
        reader.onload = (e) => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement("canvas");
            let width = img.width;
            let height = img.height;
            const MAX = 1024;
            if (width > height) {
              if (width > MAX) {
                height *= MAX / width;
                width = MAX;
              }
            } else {
              if (height > MAX) {
                width *= MAX / height;
                height = MAX;
              }
            }
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext("2d");
            if (ctx) {
              ctx.drawImage(img, 0, 0, width, height);
              const mimeType =
                imageFile.type === "image/png" ? "image/png" : "image/jpeg";
              const quality = mimeType === "image/jpeg" ? 0.8 : undefined;
              resolve(canvas.toDataURL(mimeType, quality));
            } else {
              resolve(e.target?.result as string);
            }
          };
          img.onerror = () => reject(new Error("Failed to load image"));
          img.src = e.target?.result as string;
        };
        reader.onerror = (error) => reject(error);
      });

      // Strategy 1: Client-side @imgly/background-removal
      try {
        setLoadingMsg("Removing background...");
        const { removeBackground: removeBg } =
          await import("@imgly/background-removal");
        const imgBlob = await fetch(base64).then((r) => r.blob());
        const resultBlob = await removeBg(imgBlob, {
          progress: (key: string, current: number, total: number) => {
            if (key === "compute:inference") {
              const pct = Math.round((current / total) * 100);
              setLoadingMsg(`Processing: ${pct}%`);
            }
          },
        });
        const resultUrl = await new Promise<string>((resolve) => {
          const reader2 = new FileReader();
          reader2.onload = () => resolve(reader2.result as string);
          reader2.readAsDataURL(resultBlob);
        });
        return resultUrl;
      } catch (clientErr) {
        console.warn(
          "[portrait-maker] Client-side bg removal failed, trying API fallback...",
          clientErr,
        );
      }

      // Strategy 2: Server API /api/remove-bg
      try {
        setLoadingMsg("Removing background (server)...");
        const response = await fetch("/api/remove-bg", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageUrl: base64 }),
        });
        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.error || "Failed to remove background");
        }
        const resultData = await response.json();
        return resultData.url;
      } catch (apiErr: any) {
        console.warn(
          "[portrait-maker] API fallback also failed:",
          apiErr.message,
        );
      }

      // Strategy 3: Use original image
      toast("Background removal unavailable — using original image", "info");
      return base64;
    },
    [toast],
  );

  // ─── onDrop ─────────────────────────────────────────────
  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const selectedFile = acceptedFiles[0];
      if (!selectedFile) return;
      setFile(selectedFile);
      const objectUrl = URL.createObjectURL(selectedFile);
      setOriginalUrl(objectUrl);
      setProcessedUrl(null);
      setLoading(true);
      setLoadingMsg("Removing background...");

      try {
        const resultUrl = await removeBackground(selectedFile);
        // Pre-load and cache the image for flicker-free canvas rendering
        const img = await loadImage(resultUrl);
        cachedImgRef.current = img;
        naturalSizeRef.current = { w: img.naturalWidth, h: img.naturalHeight };
        setProcessedUrl(resultUrl);
        const sW = selectedSize.w;
        const sH = selectedSize.h;
        const scale =
          Math.max(sW / img.naturalWidth, sH / img.naturalHeight) * 1.1;
        setImgScale(scale);
        const cx = (sW - img.naturalWidth * scale) / 2;
        const cy = (sH - img.naturalHeight * scale) / 2;
        setImgPos({ x: cx, y: cy });
      } catch (err: any) {
        console.error(err);
        toast("Failed to process image", "error");
        setProcessedUrl(objectUrl);
      } finally {
        setLoading(false);
      }
    },
    [removeBackground, toast, selectedSize],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/jpeg": [], "image/png": [], "image/webp": [] },
    maxFiles: 1,
  });

  // ─── Canvas render (synchronous — uses cached image) ───
  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const img = cachedImgRef.current;
    if (!canvas || !img || !processedUrl) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Avoid resetting canvas dimensions every frame (causes flicker)
    if (canvas.width !== selectedSize.w) canvas.width = selectedSize.w;
    if (canvas.height !== selectedSize.h) canvas.height = selectedSize.h;

    // Clear
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw background
    if (bgColor.startsWith("linear-gradient")) {
      const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
      const colorMatch = bgColor.match(/#[0-9a-fA-F]{6}/g);
      if (colorMatch && colorMatch.length >= 2) {
        grad.addColorStop(0, colorMatch[0]);
        grad.addColorStop(1, colorMatch[1]);
      }
      ctx.fillStyle = grad;
    } else {
      ctx.fillStyle = bgColor;
    }
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw cached image synchronously (no flicker)
    const w = img.naturalWidth * imgScale;
    const h = img.naturalHeight * imgScale;
    ctx.drawImage(img, imgPos.x, imgPos.y, w, h);
  }, [processedUrl, selectedSize, bgColor, imgPos, imgScale]);

  // Schedule render
  const rafRef = useRef<number>(0);
  const scheduleRender = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(renderCanvas);
  }, [renderCanvas]);

  // Trigger render on state changes
  useEffect(() => {
    if (processedUrl) scheduleRender();
  }, [processedUrl, selectedSize, bgColor, imgPos, imgScale, scheduleRender]);

  // ─── Drag to reposition ─────────────────────────────────
  const handleMouseDown = (e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      origX: imgPos.x,
      origY: imgPos.y,
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragRef.current) return;
    const scaleFactorX =
      selectedSize.w / (canvasRef.current?.getBoundingClientRect().width || 1);
    const scaleFactorY =
      selectedSize.h / (canvasRef.current?.getBoundingClientRect().height || 1);
    const dx = (e.clientX - dragRef.current.startX) * scaleFactorX;
    const dy = (e.clientY - dragRef.current.startY) * scaleFactorY;
    setImgPos({
      x: dragRef.current.origX + dx,
      y: dragRef.current.origY + dy,
    });
  };

  const handleMouseUp = () => {
    if (dragRef.current) {
      pushHistory();
    }
    dragRef.current = null;
  };

  // ─── Size change ────────────────────────────────────────
  const handleSizeChange = (preset: typeof SIZE_PRESETS[0]) => {
    setSelectedSize(preset)
    if (naturalSizeRef.current.w > 0) {
      const scale = Math.max(preset.w / naturalSizeRef.current.w, preset.h / naturalSizeRef.current.h) * 1.1
      setImgScale(scale)
      setImgPos({
        x: (preset.w - naturalSizeRef.current.w * scale) / 2,
        y: (preset.h - naturalSizeRef.current.h * scale) / 2,
      })
    }
    pushHistory()
  }

  // ─── Background change ──────────────────────────────────
  const handleBgChange = (color: string) => {
    setBgColor(color)
    pushHistory()
  }

  // ─── Export (direct toBlob for reliable filename) ─────
  const handleExport = useCallback(async () => {
    if (!processedUrl) return
    setIsExporting(true)

    try {
      const exportCanvas = document.createElement('canvas')
      exportCanvas.width = selectedSize.w
      exportCanvas.height = selectedSize.h
      const ctx = exportCanvas.getContext('2d')!

      // Draw background
      if (bgColor.startsWith('linear-gradient')) {
        const grad = ctx.createLinearGradient(0, 0, 0, exportCanvas.height)
        const colorMatch = bgColor.match(/#[0-9a-fA-F]{6}/g)
        if (colorMatch && colorMatch.length >= 2) {
          grad.addColorStop(0, colorMatch[0])
          grad.addColorStop(1, colorMatch[1])
        }
        ctx.fillStyle = grad
      } else {
        ctx.fillStyle = bgColor
      }
      ctx.fillRect(0, 0, exportCanvas.width, exportCanvas.height)

      // Draw portrait subject
      const img = await loadImage(processedUrl)
      const w = img.naturalWidth * imgScale
      const h = img.naturalHeight * imgScale
      ctx.drawImage(img, imgPos.x, imgPos.y, w, h)

      // MIME and quality config
      const mimeMap = { png: 'image/png', jpg: 'image/jpeg', webp: 'image/webp' } as const
      const qualityMap = { png: undefined, jpg: 0.92, webp: 0.90 } as const
      const mime = mimeMap[exportFormat]
      const quality = qualityMap[exportFormat]
      const filename = `portrait_${selectedSize.id}.${exportFormat === 'jpg' ? 'jpg' : exportFormat}`

      // For JPG: composite onto white background (no transparency)
      let finalCanvas = exportCanvas
      if (exportFormat === 'jpg') {
        const tmpCanvas = document.createElement('canvas')
        tmpCanvas.width = exportCanvas.width
        tmpCanvas.height = exportCanvas.height
        const tmpCtx = tmpCanvas.getContext('2d')!
        tmpCtx.fillStyle = '#ffffff'
        tmpCtx.fillRect(0, 0, tmpCanvas.width, tmpCanvas.height)
        tmpCtx.drawImage(exportCanvas, 0, 0)
        finalCanvas = tmpCanvas
      }

      // Try File System Access API (native save dialog with correct filename)
      if ('showSaveFilePicker' in window) {
        try {
          const extMap = { png: '.png', jpg: '.jpg', webp: '.webp' } as const
          const handle = await (window as any).showSaveFilePicker({
            suggestedName: filename,
            types: [{
              description: `${exportFormat.toUpperCase()} Image`,
              accept: { [mime]: [extMap[exportFormat]] },
            }],
          })
          const writable = await handle.createWritable()
          const blob = await new Promise<Blob>((resolve) => {
            finalCanvas.toBlob((b) => resolve(b!), mime, quality)
          })
          await writable.write(blob)
          await writable.close()
          toast('Portrait exported! 📸', 'success')
          return
        } catch (fsErr: any) {
          if (fsErr.name === 'AbortError') { setIsExporting(false); return }
          console.warn('File System API failed, falling back...', fsErr)
        }
      }

      // Fallback: blob download with proper filename
      finalCanvas.toBlob((blob) => {
        if (!blob) { toast('Export failed', 'error'); return }
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.style.display = 'none'
        a.href = url
        a.download = filename
        document.body.appendChild(a)
        a.click()
        setTimeout(() => {
          document.body.removeChild(a)
          URL.revokeObjectURL(url)
        }, 500)
        toast('Portrait exported! 📸', 'success')
      }, mime, quality)
    } catch (err) {
      console.error('Export error:', err)
      toast('Export failed. Please try again.', 'error')
    } finally {
      setIsExporting(false)
    }
  }, [processedUrl, selectedSize, bgColor, imgPos, imgScale, exportFormat, toast])

  // ─── Reset ──────────────────────────────────────────────
  const handleReset = () => {
    setFile(null);
    setOriginalUrl(null);
    setProcessedUrl(null);
    setImgPos({ x: 0, y: 0 });
    setImgScale(1);
    setSideTab("size");
    history.reset({
      bgColor: BG_COLORS[0].color,
      sizeId: SIZE_PRESETS[0].id,
      imgPos: { x: 0, y: 0 },
      imgScale: 1,
    });
  };

  // ─── Preview dimensions ─────────────────────────────────
  const previewAspect = selectedSize.w / selectedSize.h;
  const previewMaxW =
    previewAspect >= 1 ? 500 : Math.round(400 * previewAspect);
  const previewMaxH =
    previewAspect >= 1 ? Math.round(500 / previewAspect) : 400;

  const SIDE_TABS: { id: SideTab; label: string; icon: React.ReactNode }[] = [
    { id: "size", label: "Size", icon: <CropIcon className="w-3.5 h-3.5" /> },
    {
      id: "background",
      label: "Background",
      icon: <Palette className="w-3.5 h-3.5" />,
    },
  ];

  // ═══════════════════════════════════════════════════════
  // No file: full-canvas dropzone
  // ═══════════════════════════════════════════════════════
  if (!file) {
    return (
      <div className="flex-1 flex items-center justify-center p-6 md:pb-16">
        <div
          {...getRootProps()}
          className={`w-full max-w-3xl aspect-4/3 rounded-3xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all duration-300 ${
            isDragActive
              ? "border-[#FF6B4A] bg-[#FF6B4A]/5 scale-[1.01]"
              : "border-(--overlay-border) hover:border-(--overlay-border-hover) hover:bg-(--card-bg)"
          }`}
        >
          <input {...getInputProps()} />
          <div className="w-16 h-16 rounded-2xl bg-(--card-bg-hover) flex items-center justify-center mb-6">
            <UserSquare2 className="w-7 h-7 text-(--text-tertiary)" />
          </div>
          <p className="text-lg font-semibold text-(--text-secondary) mb-1">
            {isDragActive
              ? "Drop your portrait here"
              : "Drop a portrait photo to start"}
          </p>
          <p className="text-sm text-(--text-muted)">
            PNG, JPG, or WebP • Passport, ID, or profile photo
          </p>
          <button className="mt-6 px-6 py-2.5 rounded-xl bg-(--card-bg-hover) text-sm font-semibold text-(--text-secondary) hover:bg-white/10 hover:text-white transition-all cursor-pointer">
            Browse Files
          </button>
        </div>
      </div>
    );
  }

  // ─── Shared sidebar content ─────────────────────────────
  const sidebarContent = (
    <>
      {/* Header */}
      <div className="p-3 lg:p-5 pb-2 lg:pb-3">
        <div className="hidden lg:flex items-center gap-3 mb-4">
          <SidebarHeader
            gradient="from-[#0066CC] to-[#4DA6FF]"
            icon={<UserSquare2 className="w-4.5 h-4.5 text-white" />}
            title="Portrait Maker"
            subtitle="ID photo & background changer"
            onReset={handleReset}
            className="w-full"
          />
        </div>
        <SidebarTabStrip
          tabs={SIDE_TABS.map((t) => ({
            id: t.id,
            label: t.label,
            icon: t.icon,
          }))}
          active={sideTab}
          onChange={(id) => setSideTab(id as SideTab)}
          accentColor="#0066CC"
        />
      </div>

      <div className="px-4 lg:px-5 pb-5 space-y-5">
        {/* ── SIZE TAB ── */}
        {sideTab === "size" && (
          <>
            {/* Photo size */}
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider text-(--text-muted) mb-2 block">
                Photo Size
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {SIZE_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => handleSizeChange(preset)}
                    className={`relative flex flex-col items-center gap-0.5 py-2.5 rounded-lg transition-all cursor-pointer ${
                      selectedSize.id === preset.id
                        ? "bg-[#0066CC]/15 text-[#4DA6FF] border border-[#0066CC]/20"
                        : "bg-(--card-bg) text-(--text-tertiary) border border-(--overlay-border) hover:bg-(--card-bg-hover)"
                    }`}
                  >
                    {selectedSize.id === preset.id && (
                      <Check className="absolute top-1 right-1 w-3 h-3 text-[#4DA6FF]" />
                    )}
                    <Maximize2 className="w-3.5 h-3.5 opacity-60" />
                    <span className="text-[10px] font-semibold">
                      {preset.label}
                    </span>
                    <span className="text-[8px] opacity-60">
                      {preset.aspect}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Zoom/position */}
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider text-(--text-muted) mb-1 block">
                Scale: {Math.round(imgScale * 100)}%
              </label>
              <input
                type="range"
                min="0.2"
                max="5"
                step="0.05"
                value={imgScale}
                onChange={(e) => setImgScale(parseFloat(e.target.value))}
                className="w-full"
                style={{
                  background: `linear-gradient(to right, #0066CC ${((imgScale - 0.2) / 4.8) * 100}%, rgba(255,255,255,0.06) ${((imgScale - 0.2) / 4.8) * 100}%)`,
                }}
              />
              <p className="text-[10px] text-(--text-muted) mt-2 italic">
                💡 Drag on preview to reposition. Scroll to zoom.
              </p>
            </div>

            {/* Output info */}
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider text-(--text-muted) mb-1 block">
                Output Info
              </label>
              <div className="text-[11px] text-(--text-muted) space-y-0.5">
                <p>
                  Size:{" "}
                  <span className="text-(--text-secondary) font-medium">
                    {selectedSize.w}×{selectedSize.h} px
                  </span>
                </p>
                <p>
                  Preset:{" "}
                  <span className="text-(--text-secondary) font-medium">
                    {selectedSize.label} ({selectedSize.aspect})
                  </span>
                </p>
              </div>
            </div>
          </>
        )}

        {/* ── BACKGROUND TAB ── */}
        {sideTab === "background" && (
          <>
            {/* Solid colors */}
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider text-(--text-muted) mb-2 block">
                Background Color
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {BG_COLORS.map((bg) => {
                  const isActive = bgColor === bg.color;
                  const isGradient = bg.color.startsWith("linear-gradient");
                  return (
                    <button
                      key={bg.id}
                      onClick={() => handleBgChange(bg.color)}
                      title={bg.label}
                      className={`relative aspect-square rounded-lg border-2 transition-all cursor-pointer ${
                        isActive
                          ? "border-[#4DA6FF] scale-110"
                          : "border-(--overlay-border) hover:scale-105"
                      }`}
                      style={{ background: isGradient ? bg.color : bg.color }}
                    >
                      {isActive && (
                        <Check
                          className={`absolute inset-0 m-auto w-4 h-4 ${bg.id === "white" || bg.id === "grey" ? "text-stone-800" : "text-white"}`}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
              {/* Custom color */}
              <div className="flex items-center gap-2 mt-2">
                <input
                  type="color"
                  value={customColor}
                  onChange={(e) => {
                    setCustomColor(e.target.value);
                    handleBgChange(e.target.value);
                  }}
                  className="w-7 h-7 rounded cursor-pointer border border-(--overlay-border)"
                />
                <span className="text-xs text-(--text-muted) font-mono uppercase">
                  {bgColor.startsWith("linear") ? "Gradient" : bgColor}
                </span>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );

  // ═══════════════════════════════════════════════════════
  // Editor layout — matches Collage/Photobooth pattern
  // ═══════════════════════════════════════════════════════
  return (
    <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
      {/* ═══ DESKTOP SIDEBAR ═══ */}
      <div className="hidden lg:flex lg:w-[340px] shrink-0 bg-(--panel-bg) border-r border-(--overlay-border) overflow-y-auto h-screen flex-col">
        {sidebarContent}
      </div>

      {/* ═══ MAIN AREA — Preview ═══ */}
      <div
        className="flex-1 flex flex-col p-2 lg:p-8 pb-52 lg:pb-8 bg-(--canvas-bg) relative"
        onClick={() => setShowExport(false)}
      >
        {/* Export Controls — top right */}
        <div
          className="absolute top-6 right-6 z-50 flex flex-col items-end gap-2"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            title="Export"
            disabled={!processedUrl}
            onClick={() => processedUrl && setShowExport(!showExport)}
            className={`h-8 px-3 flex items-center justify-center gap-1.5 rounded-xl shadow-xl border transition-all font-semibold text-[11px] ${!processedUrl ? "opacity-40 cursor-not-allowed bg-(--panel-bg) border-(--overlay-border) text-(--text-muted)" : showExport ? "bg-[#0066CC] border-[#0066CC] text-white cursor-pointer" : "bg-(--panel-bg) border-(--overlay-border) text-(--text-secondary) hover:bg-(--card-bg-hover) cursor-pointer"}`}
          >
            <Download className="w-4 h-4" /> Export
          </button>
          {showExport && processedUrl && (
            <div className="bg-(--panel-bg) p-3 rounded-2xl shadow-xl border border-(--overlay-border) w-48 animate-in fade-in slide-in-from-top-2">
              <ExportFormatPanel
                format={exportFormat}
                onFormatChange={setExportFormat}
                onExport={handleExport}
                isExporting={isExporting}
                disabled={!processedUrl}
                exportLabel={`Export (${selectedSize.w}×${selectedSize.h})`}
              />
            </div>
          )}
        </div>

        {/* Canvas Controls — bottom right (undo/redo + zoom) */}
        <div className="absolute bottom-6 right-6 z-50 flex flex-col gap-3">
          {/* Undo/Redo */}
          <div className="flex flex-col gap-2 bg-(--panel-bg) p-2 rounded-2xl shadow-lg border border-(--overlay-border)">
            <button
              title="Undo"
              disabled={!history.canUndo}
              onClick={(e) => {
                e.stopPropagation();
                handleUndo();
              }}
              className={`w-8 h-8 flex items-center justify-center rounded-xl bg-(--card-bg) hover:bg-(--card-bg-hover) transition-all cursor-pointer ${history.canUndo ? "text-(--text-secondary)" : "text-(--text-muted) opacity-40"}`}
            >
              <Undo2 className="w-4 h-4" />
            </button>
            <button
              title="Redo"
              disabled={!history.canRedo}
              onClick={(e) => {
                e.stopPropagation();
                handleRedo();
              }}
              className={`w-8 h-8 flex items-center justify-center rounded-xl bg-(--card-bg) hover:bg-(--card-bg-hover) transition-all cursor-pointer ${history.canRedo ? "text-(--text-secondary)" : "text-(--text-muted) opacity-40"}`}
            >
              <Redo2 className="w-4 h-4" />
            </button>
          </div>

          {/* Zoom */}
          <div className="flex flex-col gap-2 bg-(--panel-bg) p-2 rounded-2xl shadow-xl border border-(--overlay-border)">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setZoom(Math.min(zoom + 0.1, 3));
              }}
              className="w-8 h-8 flex items-center justify-center rounded-xl bg-(--card-bg) hover:bg-(--card-bg-hover) text-(--text-secondary) transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
            </button>
            <div className="text-[10px] font-bold text-center text-(--text-muted) w-8">
              {Math.round(zoom * 100)}%
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setZoom(Math.max(zoom - 0.1, 0.5));
              }}
              className="w-8 h-8 flex items-center justify-center rounded-xl bg-(--card-bg) hover:bg-(--card-bg-hover) text-(--text-secondary) transition-all cursor-pointer"
            >
              <div className="w-3 h-0.5 bg-current rounded-full" />
            </button>
          </div>
        </div>

        {/* Main preview */}
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4">
            <Loading />
            <p className="text-sm text-(--text-muted) animate-pulse">
              {loadingMsg}
            </p>
          </div>
        ) : processedUrl ? (
          <div className="flex-1 overflow-auto rounded-xl">
            <div
              style={{
                width: `${Math.max(100, zoom * 100)}%`,
                height: `${Math.max(100, zoom * 100)}%`,
                display: "flex",
                minWidth: "100%",
                minHeight: "100%",
              }}
            >
              <div
                className="w-full h-full flex items-center justify-center p-4 origin-top-left transition-transform duration-200"
                style={{
                  transform: `scale(${zoom})`,
                  width: `${(1 / zoom) * 100}%`,
                  height: `${(1 / zoom) * 100}%`,
                }}
              >
                <div
                  className="relative shadow-2xl shadow-black/30 overflow-hidden shrink-0 cursor-grab active:cursor-grabbing select-none"
                  style={{
                    width: `min(80vw, ${previewMaxW}px)`,
                    height: `min(80vh, ${previewMaxH}px)`,
                    aspectRatio: `${selectedSize.w} / ${selectedSize.h}`,
                  }}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                  onWheel={(e) => {
                    e.preventDefault();
                    const delta = e.deltaY > 0 ? -0.05 : 0.05;
                    setImgScale((prev) =>
                      Math.max(0.2, Math.min(5, prev + delta)),
                    );
                  }}
                >
                  <canvas
                    ref={canvasRef}
                    width={selectedSize.w}
                    height={selectedSize.h}
                    className="w-full h-full"
                  />
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {/* ═══ MOBILE BOTTOM SHEET ═══ */}
      <PortraitMobileSheet>{sidebarContent}</PortraitMobileSheet>
    </div>
  );
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function PortraitMobileSheet({ children }: { children: React.ReactNode }) {
  const [expanded, setExpanded] = useState(false);
  const dragY = useRef(0);

  const onDragStart = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    dragY.current = e.clientY;
    const onMove = (ev: PointerEvent) => {
      const delta = dragY.current - ev.clientY;
      if (Math.abs(delta) > 30) setExpanded(delta > 0);
    };
    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  }, []);

  return (
    <div
      className="lg:hidden fixed bottom-14 md:bottom-0 left-0 right-0 z-[51] bg-(--panel-bg) border-t border-(--overlay-border) rounded-t-2xl shadow-[0_-4px_30px_rgba(0,0,0,0.3)] flex flex-col"
      style={{
        height: expanded ? "55vh" : "110px",
        transition: "height 0.3s cubic-bezier(0.32,0.72,0,1)",
      }}
    >
      <div
        className="shrink-0 flex items-center justify-center py-2.5 cursor-grab active:cursor-grabbing touch-manipulation"
        onPointerDown={onDragStart}
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="w-10 h-1 rounded-full bg-(--text-muted)/30" />
      </div>
      <div
        className={`flex-1 overflow-y-auto overscroll-contain ${expanded ? "" : "overflow-hidden"}`}
      >
        {children}
      </div>
    </div>
  );
}
