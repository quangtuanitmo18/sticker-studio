'use client'

import * as React from 'react'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs: (string | undefined | false)[]) {
  return twMerge(clsx(inputs))
}

interface ColorPickerProps {
  value: string
  onChange: (color: string) => void
  presets: string[]
  label: string
  showHexInput?: boolean
}

export function ColorPicker({ value, onChange, presets, label, showHexInput = false }: ColorPickerProps) {
  return (
    <section>
      <h3 className="text-sm font-semibold mb-3 uppercase tracking-wider text-zinc-500">{label}</h3>
      <div className="flex flex-wrap gap-2">
        {presets.map((color) => (
          <button
            key={color}
            onClick={() => onChange(color)}
            className={cn(
              "w-9 h-9 rounded-full border-2 transition-all hover:scale-110 shadow-sm",
              value === color ? "border-indigo-500 ring-2 ring-indigo-500/30 scale-110" : "border-zinc-200 dark:border-zinc-700"
            )}
            style={{ backgroundColor: color }}
            title={color}
          />
        ))}
      </div>
      {showHexInput && (
        <div className="mt-3 flex items-center gap-2">
          <div 
            className="w-8 h-8 rounded-lg border border-zinc-300 dark:border-zinc-600 shadow-inner" 
            style={{ backgroundColor: value }} 
          />
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-8 h-8 rounded cursor-pointer border-0 bg-transparent"
          />
          <input
            type="text"
            value={value}
            onChange={(e) => {
              if (/^#[0-9a-fA-F]{0,6}$/.test(e.target.value)) {
                onChange(e.target.value)
              }
            }}
            className="flex-1 px-3 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm font-mono"
            placeholder="#000000"
          />
        </div>
      )}
    </section>
  )
}
