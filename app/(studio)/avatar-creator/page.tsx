import type { Metadata } from 'next'
import AvatarCreatorPage from './AvatarCreatorClient'

export const metadata: Metadata = {
  title: '3D Avatar Creator — Design Your Virtual Character',
  description: 'Design and customize your own 3D avatar with Ready Player Me. Choose hairstyles, outfits, accessories and export for games, social media and messaging apps.',
  alternates: { canonical: '/avatar-creator' },
  openGraph: {
    title: '3D Avatar Creator — Free Online Character Designer',
    description: 'Design your 3D avatar: hairstyles, outfits, accessories. Export for games & social.',
    url: '/avatar-creator',
  },
  keywords: ['3D avatar creator', 'avatar maker', 'character creator', 'virtual avatar', 'Ready Player Me', '3D character designer'],
}

export default function Page() {
  return <AvatarCreatorPage />
}
