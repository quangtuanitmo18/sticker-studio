import type { Metadata } from 'next'
import HowItWorksPage from './HowItWorksClient'

export const metadata: Metadata = {
  title: 'How It Works',
  description: 'Learn how to create custom stickers in 3 easy steps: upload your photo, AI removes the background, then customize with filters, frames and text. Export anywhere.',
  alternates: { canonical: '/how-it-works' },
  openGraph: {
    title: 'How It Works — Create Stickers in 3 Steps',
    description: 'Upload → AI removes background → Customize & export. Create pro stickers in seconds.',
    url: '/how-it-works',
  },
}

export default function Page() {
  return <HowItWorksPage />
}
