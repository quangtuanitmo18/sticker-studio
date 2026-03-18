import type { Metadata } from 'next'
import StickerPackPage from './StickerPackClient'

export const metadata: Metadata = {
  title: '3D Avatar Sticker Pack — Animated 3D Characters',
  description: 'Create 3D avatar sticker packs with customizable characters. Choose poses, expressions and styles to generate unique animated stickers.',
  alternates: { canonical: '/sticker-pack' },
  openGraph: {
    title: '3D Avatar Sticker Pack Generator',
    description: 'Create animated 3D avatar stickers with custom poses and expressions.',
    url: '/sticker-pack',
  },
  keywords: ['3D avatar stickers', '3D sticker pack', 'avatar sticker maker', 'animated stickers', '3D character stickers'],
}

export default function Page() {
  return <StickerPackPage />
}
