<div align="center">
<img width="1200" height="475" alt="Sticker Studio Banner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# 🎨 Sticker Studio

> A premium AI-powered sticker and creative media studio built with **Next.js 15**, **React**, **Konva**, and **Tailwind CSS v4**.

---

## ✨ Features

### 🖼️ Sticker Maker
- Upload an image and remove background automatically (Remove.bg API)
- Add custom text overlays with font, size, color, and stroke controls
- Add emoji/asset overlays (Twemoji + DiceBear, 6-column grid)
- Apply frames and shape masks (30+ shapes)
- Apply image filters (Vivid, Matte, Noir, Warm, Cool, etc.)
- Gradient & solid outline borders
- Animated GIF export
- Export to PNG, WebP, AVIF, JPEG + platform presets (WhatsApp, Telegram, iMessage, LINE)
- AI Upscale (2×) via Replicate API
- Full undo/redo history
- Sticker pack generation (multiple stickers → ZIP)

### 🎞️ GIF Maker
- Upload video and convert clips to animated GIF
- AI highlight detection (best moments)
- Manual trim with frame-accurate scrubbing
- Text and sticker overlays on video frames
- Speed control + resolution settings
- Export GIF with floating controls (zoom/pan, undo/redo)

### 📸 Photobooth
- Live camera capture (multi-shot photo strips)
- Text and emoji overlays with full editing controls
- Filter effects on captured photos
- Premium photo strip layouts (2×4, 3×3, etc.)
- Export as PNG/JPEG

### 🖼️ Collage Maker
- Drag & drop multiple images into grid layouts
- 10+ layout templates
- Custom background colors and gradients
- Text and emoji overlay support with full editing
- Output size control (Instagram, Stories, etc.)
- Full undo/redo

### 🖼️ Frame Editor
- Design custom photobooth frame templates (PNG with transparency)
- Drag-and-drop photo slot placement on canvas
- Auto slot detection from transparent regions
- Snap-to-grid controls
- Save/load frame templates to LocalStorage
- Embed mode for use inside Photobooth

### 👤 Avatar Creator
- Generate AI avatars via Fal.ai API
- Multiple style presets

---

## 🏗️ Architecture

```
app/
├── (studio)/
│   ├── maker/          # Sticker Maker (Konva canvas)
│   ├── gif-maker/      # GIF Maker (video → GIF)
│   ├── photobooth/     # Photobooth (camera + strips)
│   ├── collage/        # Collage Maker
│   ├── frame-editor/   # Frame Template Editor
│   ├── avatar-creator/ # AI Avatar Generator
│   └── sticker-pack/   # Sticker Pack Generator
├── api/
│   ├── remove-bg/      # Remove.bg proxy
│   ├── generate-avatar/# Fal.ai proxy
│   └── upscale/        # Replicate proxy
components/
└── shared/
    ├── SidebarHeader.tsx    # Shared sidebar header (icon, title, reset)
    ├── SidebarTabStrip.tsx  # Shared pill tab strip
    ├── PanelSection.tsx     # Shared panel section with label
    ├── TextPanel.tsx        # Shared text overlay controls
    ├── AssetPanel.tsx       # Shared emoji/asset picker (6-col grid)
    ├── OverlayCanvas.tsx    # Shared Konva canvas (text + emoji overlays)
    ├── OverlayList.tsx      # Shared overlay item list
    └── ExportFormatPanel.tsx# Shared export format selector
```

---

## 🚀 Run Locally

**Prerequisites:** Node.js 18+

1. Install dependencies:
   ```bash
   npm install
   ```

2. Copy environment variables:
   ```bash
   cp .env.example .env.local
   ```

3. Set your API keys in `.env.local`:
   ```env
   REMOVE_BG_API_KEY=your_key_here
   FAL_API_KEY=your_key_here
   REPLICATE_API_TOKEN=your_key_here
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| UI | React 19, Tailwind CSS v4 |
| Canvas | Konva.js (Sticker Maker), HTML5 Canvas |
| AI APIs | Remove.bg, Fal.ai, Replicate |
| State | React hooks + useHistory (undo/redo) |
| Export | canvas-to-blob, gif-encoder, JSZip |
| Icons | Lucide React |
| Fonts | Google Fonts (Inter, system) |
