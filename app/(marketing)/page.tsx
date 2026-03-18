import type { Metadata } from 'next'
import LandingPage from './HomeClient'

export const metadata: Metadata = {
  title: 'Free AI Sticker Maker & Photo Editor',
  description: 'Create custom stickers, photo strips, collages and 3D avatars with AI-powered tools. Remove backgrounds, add filters, generate sticker packs from selfies. Free online, no sign-up.',
  alternates: { canonical: '/' },
  openGraph: {
    title: 'Sticker Studio — Free AI Sticker Maker & Photo Editor',
    description: 'Create custom stickers, photo strips, collages and 3D avatars with AI. Free & instant.',
    url: '/',
  },
}

export default function Page() {
  return <LandingPage />
}
