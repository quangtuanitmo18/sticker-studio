import type { Metadata } from 'next'
import GifMakerClient from './GifMakerClient'

export const metadata: Metadata = {
  title: 'GIF Maker — Sticker Studio',
  description:
    'Convert videos to animated GIFs. Trim, add text animations, apply filters, and export for Telegram, Discord & WhatsApp.',
}

export default function GifMakerPage() {
  return <GifMakerClient />
}
