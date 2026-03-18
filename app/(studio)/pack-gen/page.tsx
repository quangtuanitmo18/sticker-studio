import type { Metadata } from 'next'
import PackGenPage from './PackGenClient'

export const metadata: Metadata = {
  title: 'AI Sticker Pack Generator — One Selfie, Six Reactions',
  description: 'Upload a selfie and AI creates 6 expressive reaction stickers in any style: 3D Pixar, Anime, Chibi, Watercolor and more. Free AI sticker pack generator.',
  alternates: { canonical: '/pack-gen' },
  openGraph: {
    title: 'AI Sticker Pack — Generate From One Selfie',
    description: 'One selfie → 6 reaction stickers. Choose Anime, Pixar, Chibi & more styles. Free AI generator.',
    url: '/pack-gen',
  },
  keywords: ['AI sticker pack', 'sticker pack generator', 'AI sticker maker', 'reaction stickers', 'selfie sticker generator'],
}

export default function Page() {
  return <PackGenPage />
}
