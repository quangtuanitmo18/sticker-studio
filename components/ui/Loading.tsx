'use client'

import { cn } from '@/lib/utils'

interface LoadingProps {
  text?: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
  overlay?: boolean
}

export function Loading({
  text = 'Loading...',
  size = 'md',
  className,
  overlay = false,
}: LoadingProps) {
  const dotSize = { sm: 'w-1.5 h-1.5', md: 'w-2 h-2', lg: 'w-2.5 h-2.5' }[size]
  
  const content = (
    <div className={cn('flex flex-col items-center gap-4', className)}>
      {/* Dot pulse pattern */}
      <div className="flex items-center gap-2">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className={cn(dotSize, 'rounded-full bg-[#FF6B4A]')}
            style={{
              animation: 'dotPulse 1.4s ease-in-out infinite',
              animationDelay: `${i * 0.16}s`,
            }}
          />
        ))}
      </div>
      {text && (
        <p className="text-xs text-stone-500 font-medium tracking-wide">{text}</p>
      )}
    </div>
  )

  if (overlay) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-20 rounded-inherit">
        {content}
      </div>
    )
  }

  return content
}
