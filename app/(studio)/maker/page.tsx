import type { Metadata } from 'next'
import MakerPage from './MakerClient'

export const metadata: Metadata = {
  title: 'Sticker Maker — Remove Background & Customize',
  description: 'Free AI sticker maker: upload any image, instantly remove background, add filters, frames, outlines and text. Export as PNG, JPEG or WebP. No watermarks.',
  alternates: { canonical: '/maker' },
  openGraph: {
    title: 'Sticker Maker — AI Background Removal & Editor',
    description: 'Upload → Remove BG → Add filters, frames, text → Export. Free AI sticker maker.',
    url: '/maker',
  },
  keywords: ['sticker maker', 'remove background', 'background remover', 'sticker creator', 'custom sticker', 'AI sticker maker'],
}

export default function Page() {
  return <MakerPage />
}
