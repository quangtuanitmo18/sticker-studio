import type { ReactNode } from 'react'

interface PanelSectionProps {
  title: string
  children: ReactNode
  /** Extra className for the wrapper div */
  className?: string
}

/**
 * Reusable sidebar section with small uppercase label + bottom separator.
 * Used across Maker, Photobooth, Collage, GIF Maker panels.
 */
export function PanelSection({ title, children, className }: PanelSectionProps) {
  return (
    <div className={`border-b border-(--overlay-border) pb-4 mb-4 last:border-0 last:mb-0 last:pb-0 space-y-2 ${className ?? ''}`}>
      <label className="text-[11px] font-semibold uppercase tracking-wider text-(--text-muted) block">
        {title}
      </label>
      {children}
    </div>
  )
}
