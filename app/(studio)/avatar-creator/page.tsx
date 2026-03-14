'use client'

import dynamic from 'next/dynamic'
import { Loading } from '@/components/ui/Loading'

const AvatarCreator = dynamic(() => import('@/components/avatar/AvatarCreator'), {
  ssr: false,
  loading: () => (
    <div className="h-screen w-full flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
      <Loading text="Loading 3D Engine..." size="lg" />
    </div>
  )
})

export default function AvatarCreatorPage() {
  return <AvatarCreator />
}
