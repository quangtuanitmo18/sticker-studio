import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Sticker Studio — AI Sticker & Avatar Maker',
    short_name: 'Sticker Studio',
    description: 'Create custom stickers, photo strips, collages and 3D avatars with AI-powered tools. Free online sticker maker.',
    start_url: '/',
    display: 'standalone',
    background_color: '#0C0A09',
    theme_color: '#FF6B4A',
    orientation: 'any',
    categories: ['design', 'graphics', 'photo', 'creativity'],
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}
