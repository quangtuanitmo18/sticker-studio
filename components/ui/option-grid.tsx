'use client'

import { cn } from '@/lib/utils';

interface OptionGridProps<T extends string> {
  label: string
  options: { value: T; label: string; emoji?: string; icon?: React.ReactNode }[]
  value: T
  onChange: (value: T) => void
  columns?: number
  className?: string
}

export function OptionGrid<T extends string>({
  label,
  options,
  value,
  onChange,
  columns = 3,
  className,
}: OptionGridProps<T>) {
  return (
    <div className={cn('space-y-2.5', className)}>
      <label className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)] block">{label}</label>
      <div
        className="grid gap-2"
        style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
      >
        {options.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={cn(
              'flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border transition-all duration-200 cursor-pointer text-center',
              value === opt.value
                ? 'bg-[#FF6B4A]/10  border-[#FF6B4A]/30 text-[#FF6B4A]'
                : 'bg-[var(--card-bg)] border-[var(--overlay-border)] text-[var(--text-tertiary)] hover:border-[var(--overlay-border-hover)] hover:bg-[var(--card-bg-hover)] hover:text-[var(--text-secondary)]'
            )}
          >
            {opt.emoji && <span className="text-lg">{opt.emoji}</span>}
            {opt.icon && <span className="text-sm">{opt.icon}</span>}
            <span className="text-[11px] font-semibold leading-tight">{opt.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
