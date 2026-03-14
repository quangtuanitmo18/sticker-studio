'use client'

import * as React from 'react'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs: (string | undefined | false)[]) {
  return twMerge(clsx(inputs))
}

interface OptionItem<T extends string> {
  value: T
  label: string
  icon?: React.ReactNode
  emoji?: string
}

interface OptionGridProps<T extends string> {
  value: T
  onChange: (value: T) => void
  options: OptionItem<T>[]
  label: string
  columns?: number
}

export function OptionGrid<T extends string>({ value, onChange, options, label, columns = 4 }: OptionGridProps<T>) {
  return (
    <section>
      <h3 className="text-sm font-semibold mb-3 uppercase tracking-wider text-zinc-500">{label}</h3>
      <div 
        className="grid gap-2"
        style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
      >
        {options.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={cn(
              "flex flex-col items-center gap-1.5 px-2 py-3 rounded-xl border-2 transition-all text-center",
              "hover:bg-zinc-50 dark:hover:bg-zinc-800",
              value === opt.value
                ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300 shadow-sm"
                : "border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400"
            )}
          >
            {opt.emoji && <span className="text-xl">{opt.emoji}</span>}
            {opt.icon && <span className="w-5 h-5">{opt.icon}</span>}
            <span className="text-[11px] font-medium leading-tight">{opt.label}</span>
          </button>
        ))}
      </div>
    </section>
  )
}
