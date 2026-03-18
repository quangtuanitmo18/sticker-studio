import type { Metadata } from 'next'
import CollagePage from './CollageClient'

export const metadata: Metadata = {
  title: 'Photo Collage Maker — Create Beautiful Collages',
  description: 'Free online collage maker: drag and drop photos into beautiful grid layouts. Choose from multiple templates, customize spacing and backgrounds. Download in high quality.',
  alternates: { canonical: '/collage' },
  openGraph: {
    title: 'Photo Collage Maker — Free Online Grid Layouts',
    description: 'Drag & drop photos into beautiful collage templates. Free, no watermarks.',
    url: '/collage',
  },
  keywords: ['collage maker', 'photo collage online', 'grid collage', 'photo grid maker', 'collage creator free'],
}

export default function Page() {
  return <CollagePage />
}
