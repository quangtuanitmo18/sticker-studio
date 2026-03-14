'use client'

import { cn } from '@/lib/utils'

interface ToggleGroupProps {
  label: string
  options: { value: string; label: string; emoji?: string }[]
  value: string
  onChange: (value: string) => void
  className?: string
}

export function ToggleGroup({ label, options, value, onChange, className }: ToggleGroupProps) {
  return (
    <div className={cn('space-y-2.5', className)}>
      <label className="text-[11px] font-semibold uppercase tracking-wider text-stone-600 block">{label}</label>
      <div className="flex rounded-xl bg-white/[0.03] border border-white/[0.04] p-1 gap-0.5">
        {options.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={cn(
              'flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer',
              value === opt.value
                ? 'bg-[#FF6B4A] text-white shadow-md shadow-[#FF6B4A]/20'
                : 'text-stone-600 hover:text-stone-300 hover:bg-white/[0.03]'
            )}
          >
            {opt.emoji && <span className="text-sm">{opt.emoji}</span>}
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  )
}
