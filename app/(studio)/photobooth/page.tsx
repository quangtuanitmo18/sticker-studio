import type { Metadata } from 'next'
import PhotoboothPage from './PhotoboothClient'

export const metadata: Metadata = {
  title: 'Photo Booth — Create Photo Strips & Frames Online',
  description: 'Free online photo booth: take photos with your webcam, apply filters, choose strip templates, add stickers and text overlays. Download or share instantly.',
  alternates: { canonical: '/photobooth' },
  openGraph: {
    title: 'Online Photo Booth — Photo Strips & Frames',
    description: 'Take photos, choose templates, add stickers. Free online photo booth with filters.',
    url: '/photobooth',
  },
  keywords: ['photo booth online', 'photo strip maker', 'webcam photo booth', 'photo frame maker', 'online photobooth'],
}

export default function Page() {
  return <PhotoboothPage />
}
