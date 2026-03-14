'use client'

import { Suspense } from 'react'
import dynamic from 'next/dynamic'
import { Loading } from '@/components/ui/Loading'

const StickerPackGenerator = dynamic(
  () => import('@/components/sticker/StickerPackGenerator'),
  {
    ssr: false,
    loading: () => (
      <div className="h-screen w-full flex items-center justify-center bg-zinc-950">
        <Loading text="Loading Sticker Engine..." size="lg" />
      </div>
    ),
  },
)

export default function StickerPackPage() {
  return (
    <Suspense fallback={
      <div className="h-screen w-full flex items-center justify-center bg-zinc-950">
        <Loading text="Loading..." size="lg" />
      </div>
    }>
      <StickerPackGenerator />
    </Suspense>
  )
}
