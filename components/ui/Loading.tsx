'use client'

import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

// ─── Types ───────────────────────────────────────────────────

interface LoadingProps {
  /** Text shown below the spinner */
  text?: string
  /** Spinner size */
  size?: 'sm' | 'md' | 'lg'
  /** Additional CSS classes */
  className?: string
  /** Overlay mode — covers parent with backdrop */
  overlay?: boolean
}

// ─── Size map ────────────────────────────────────────────────

const SIZES = {
  sm: 'w-5 h-5',
  md: 'w-8 h-8',
  lg: 'w-12 h-12',
} as const

// ─── Component ───────────────────────────────────────────────

export function Loading({
  text = 'Loading...',
  size = 'md',
  className,
  overlay = false,
}: LoadingProps) {
  const content = (
    <div className={cn('flex flex-col items-center gap-3', className)}>
      <Loader2 className={cn(SIZES[size], 'animate-spin text-indigo-500')} />
      {text && <p className="text-sm text-zinc-500 font-medium">{text}</p>}
    </div>
  )

  if (overlay) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-20">
        {content}
      </div>
    )
  }

  return content
}
