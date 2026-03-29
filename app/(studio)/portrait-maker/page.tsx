import type { Metadata } from 'next'
import PortraitMakerClient from './PortraitMakerClient'

export const metadata: Metadata = {
  title: 'Portrait Maker — ID Photo & Background Changer',
  description: 'Create professional ID photos, passport photos, and portrait images. Remove background automatically, choose custom colors (blue, white, red), and export in standard sizes (3x4, 4x6, passport).',
  alternates: { canonical: '/portrait-maker' },
  openGraph: {
    title: 'Portrait Maker — Professional ID Photo Creator',
    description: 'Remove background, change colors, and create passport-ready portrait photos. Free, no sign-up.',
    url: '/portrait-maker',
  },
  keywords: ['portrait maker', 'id photo maker', 'passport photo', 'background changer', 'photo background color', 'change photo background'],
}

export default function Page() {
  return <PortraitMakerClient />
}
