'use client'

import * as React from 'react'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs: (string | undefined | false)[]) {
  return twMerge(clsx(inputs))
}

interface ToggleOption {
  label: string
  value: boolean
  onChange: (value: boolean) => void
  emoji?: string
}

interface ToggleGroupProps {
  label: string
  options: ToggleOption[]
}

export function ToggleGroup({ label, options }: ToggleGroupProps) {
  return (
    <section>
      <h3 className="text-sm font-semibold mb-3 uppercase tracking-wider text-zinc-500">{label}</h3>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <button
            key={opt.label}
            onClick={() => opt.onChange(!opt.value)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-full border-2 transition-all text-sm font-medium",
              opt.value
                ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300"
                : "border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:border-zinc-300 dark:hover:border-zinc-600"
            )}
          >
            {opt.emoji && <span>{opt.emoji}</span>}
            {opt.label}
          </button>
        ))}
      </div>
    </section>
  )
}
