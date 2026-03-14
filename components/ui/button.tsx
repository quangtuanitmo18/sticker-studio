import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
  size?: "default" | "sm" | "lg" | "xl" | "icon"
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"

    const variants: Record<string, string> = {
      default: "bg-linear-to-r from-[#FF6B4A] to-[#F59E0B] text-white hover:brightness-110 shadow-md shadow-[#FF6B4A]/15 hover:shadow-lg hover:shadow-[#FF6B4A]/25 hover:-translate-y-px",
      destructive: "bg-red-600 text-white hover:bg-red-700 shadow-sm shadow-red-600/20",
      outline: "border border-white/[0.08] bg-transparent text-stone-400 hover:bg-white/[0.04] hover:border-white/[0.12] hover:text-white",
      secondary: "bg-white/[0.04] text-stone-300 border border-white/[0.06] hover:bg-white/[0.08] hover:text-white",
      ghost: "text-stone-500 hover:bg-white/[0.04] hover:text-white",
      link: "text-[#FF6B4A] underline-offset-4 hover:underline",
    }

    const sizes: Record<string, string> = {
      default: "h-10 px-5 py-2 text-sm",
      sm: "h-8 px-3 text-xs rounded-lg",
      lg: "h-12 px-7 text-sm rounded-2xl",
      xl: "h-14 px-10 text-base rounded-2xl font-bold",
      icon: "h-10 w-10",
    }

    return (
      <Comp
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap rounded-xl font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B4A]/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0C0A09] disabled:pointer-events-none disabled:opacity-30 cursor-pointer gap-2",
          variants[variant],
          sizes[size],
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }
