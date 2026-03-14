'use client'

import * as React from 'react'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

interface SliderProps {
  value: number[]
  min: number
  max: number
  step?: number
  onValueChange: (value: number[]) => void
  className?: string
}

export function Slider({ value, min, max, step = 1, onValueChange, className }: SliderProps) {
  return (
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value[0]}
      onChange={(e) => onValueChange([parseFloat(e.target.value)])}
      className={cn(
        "w-full h-2 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500",
        className
      )}
    />
  )
}
