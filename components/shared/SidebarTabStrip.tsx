import type { ReactNode } from 'react'

export interface TabItem<T extends string = string> {
  id: T
  label: string
  icon?: ReactNode
  badge?: ReactNode
}

interface SidebarTabStripProps<T extends string> {
  tabs: TabItem<T>[]
  active: T
  onChange: (id: T) => void
  /** Tailwind color string for the active state, e.g. "#FF6B4A" or "#10B981" */
  accentColor?: string
  className?: string
}

/**
 * Pill-style horizontal tab strip used in all studio sidebars.
 * The active tab gets a tinted background using the accentColor.
 *
 * Used by: GIF Maker, Photobooth, Collage, and Maker.
 */
export function SidebarTabStrip<T extends string>({
  tabs,
  active,
  onChange,
  accentColor = '#FF6B4A',
  className,
}: SidebarTabStripProps<T>) {
  return (
    <div className={`flex gap-1 bg-(--card-bg) rounded-xl p-1 overflow-x-auto ${className ?? ''}`}>
      {tabs.map(tab => {
        const isActive = tab.id === active
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`relative flex-1 flex items-center justify-center gap-1.5 py-2 px-3 whitespace-nowrap shrink-0 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
              isActive
                ? 'text-[var(--accent)]'
                : 'text-(--text-muted) hover:text-(--text-secondary)'
            }`}
            style={isActive ? {
              backgroundColor: `${accentColor}26`, // ~15% opacity
              color: accentColor,
            } : undefined}
          >
            {tab.icon}
            <span>{tab.label}</span>
            {tab.badge && (
              <div className="absolute -top-1 -right-1 z-10 pointer-events-none">
                {tab.badge}
              </div>
            )}
          </button>
        )
      })}
    </div>
  )
}
