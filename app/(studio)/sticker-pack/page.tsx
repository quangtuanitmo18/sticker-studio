'use client'

import { Loading } from '@/components/ui/Loading'
import dynamic from 'next/dynamic'

const StickerPackGenerator = dynamic(
  () => import('@/components/sticker/StickerPackGenerator'),
  {
    ssr: false,
    loading: () => (
      <div className="flex-1 flex items-center justify-center bg-[var(--background)]">
        <Loading text="Loading Sticker Pack..." />
      </div>
    ),
  }
)

export default function StickerPackPage() {
  return (
    <div className="flex-1 flex flex-col">
      <StickerPackGenerator />
    </div>
  )
}
