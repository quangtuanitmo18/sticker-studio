'use client'

import { cn } from '@/lib/utils'

interface SliderProps {
  label: string
  min: number
  max: number
  step?: number
  value: number
  onChange: (value: number) => void
  unit?: string
  className?: string
}

export function Slider({
  label,
  min,
  max,
  step = 1,
  value,
  onChange,
  unit = '',
  className,
}: SliderProps) {
  const pct = ((value - min) / (max - min)) * 100

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between">
        <label className="text-[11px] font-semibold uppercase tracking-wider text-stone-600">{label}</label>
        <span className="text-[11px] text-stone-600 font-mono tabular-nums">{value}{unit}</span>
      </div>
      <div className="relative group">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full relative z-10"
          style={{ background: `linear-gradient(to right, #FF6B4A ${pct}%, rgba(255,255,255,0.06) ${pct}%)` }}
        />
      </div>
    </div>
  )
}
