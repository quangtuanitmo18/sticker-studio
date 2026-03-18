import type { Metadata } from 'next'
import AboutPage from './AboutClient'

export const metadata: Metadata = {
  title: 'About',
  description: 'Sticker Studio is a free AI-powered creative suite for making custom stickers, photo strips, collages and 3D avatars. Built with Next.js, powered by AI image generation.',
  alternates: { canonical: '/about' },
  openGraph: {
    title: 'About Sticker Studio — Free AI Creative Suite',
    description: 'Learn about Sticker Studio, the free AI-powered tool for creating custom stickers and 3D avatars.',
    url: '/about',
  },
}

export default function Page() {
  return <AboutPage />
}
