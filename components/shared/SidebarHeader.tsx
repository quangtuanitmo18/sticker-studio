import type { ReactNode } from 'react'

interface SidebarHeaderProps {
  /** Gradient class, e.g. "from-[#10B981] to-[#3B82F6]" */
  gradient: string
  /** Icon element to render inside the gradient badge */
  icon: ReactNode
  title: string
  subtitle: string
  /** Called when the reset (trash) button is clicked. Omit to hide the button. */
  onReset?: () => void
  /** Custom right element (e.g. a close "X" button in embedded mode). Overrides onReset. */
  rightSlot?: ReactNode
  className?: string
}

/**
 * Reusable sidebar header with gradient icon badge, title, subtitle,
 * and an optional trash/reset button (or custom right element).
 *
 * Used across all studio pages: GIF Maker, Photobooth, Collage,
 * Frame Editor, and Maker.
 */
export function SidebarHeader({
  gradient,
  icon,
  title,
  subtitle,
  onReset,
  rightSlot,
  className,
}: SidebarHeaderProps) {
  const right = rightSlot ?? (
    onReset ? (
      <button
        onClick={onReset}
        title="Clear all"
        className="w-7 h-7 flex items-center justify-center rounded-lg bg-(--card-bg) hover:bg-red-500/10 hover:text-red-400 text-(--text-muted) transition-all cursor-pointer shrink-0"
      >
        {/* Trash icon via CSS mask so we don't need a lucide import here */}
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
        </svg>
      </button>
    ) : null
  )

  return (
    <div className={`flex items-center gap-3 ${className ?? ''}`}>
      <div className={`w-9 h-9 rounded-xl bg-linear-to-br ${gradient} flex items-center justify-center shrink-0`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <h2 className="text-base font-bold text-(--text-primary) leading-tight">{title}</h2>
        <p className="text-[11px] text-(--text-muted)">{subtitle}</p>
      </div>
      {right}
    </div>
  )
}
