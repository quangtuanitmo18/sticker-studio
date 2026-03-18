'use client'

import dynamic from 'next/dynamic'
import { Loading } from '@/components/ui/Loading'

const AvatarCreator = dynamic(
  () => import('@/components/avatar/AvatarCreator'),
  {
    ssr: false,
    loading: () => (
      <div className="flex-1 flex items-center justify-center bg-[var(--background)]">
        <Loading text="Loading Avatar Creator..." />
      </div>
    ),
  }
)

export default function AvatarCreatorPage() {
  return (
    <div className="flex-1 flex flex-col">
      <AvatarCreator />
    </div>
  )
}
