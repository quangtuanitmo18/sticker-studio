'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Scissors, Sparkles, User, Package, ArrowLeft } from 'lucide-react'

const NAV_ITEMS = [
  { href: '/maker', icon: Scissors, label: 'Maker' },
  { href: '/pack-gen', icon: Sparkles, label: 'AI Pack' },
  { href: '/avatar-creator', icon: User, label: 'Avatar' },
  { href: '/sticker-pack', icon: Package, label: 'Packs' },
]

export default function StudioLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="studio-layout bg-[#0C0A09] text-stone-200">
      {/* ── Desktop Sidebar ── */}
      <aside className="hidden md:flex flex-col items-center py-4 px-2 border-r border-white/[0.04] bg-[#0C0A09] sticky top-0 h-screen z-40">
        {/* Logo */}
        <Link
          href="/"
          className="mb-8 w-10 h-10 rounded-xl bg-linear-to-br from-[#FF6B4A] to-[#F59E0B] flex items-center justify-center text-white font-black text-sm shadow-lg shadow-[#FF6B4A]/20"
        >
          SS
        </Link>

        {/* Nav icons */}
        <nav className="flex flex-col gap-1.5 flex-1">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group relative w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-200 ${
                  isActive
                    ? 'bg-[#FF6B4A]/15 text-[#FF6B4A]'
                    : 'text-stone-600 hover:text-stone-300 hover:bg-white/[0.04]'
                }`}
                title={item.label}
              >
                <Icon className="w-[18px] h-[18px]" strokeWidth={isActive ? 2.5 : 1.8} />
                {/* Tooltip */}
                <span className="absolute left-full ml-3 px-2.5 py-1 rounded-lg bg-stone-800 text-xs font-medium text-stone-200 whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity shadow-xl z-50">
                  {item.label}
                </span>
                {/* Active indicator */}
                {isActive && (
                  <span className="absolute -left-2 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r-full bg-[#FF6B4A]" />
                )}
              </Link>
            )
          })}
        </nav>

        {/* Back to home */}
        <Link
          href="/"
          className="w-11 h-11 rounded-xl flex items-center justify-center text-stone-600 hover:text-stone-300 hover:bg-white/[0.04] transition-all"
          title="Home"
        >
          <ArrowLeft className="w-[18px] h-[18px]" strokeWidth={1.8} />
        </Link>
      </aside>

      {/* ── Main content ── */}
      <main className="flex-1 flex flex-col min-h-screen overflow-y-auto">
        {children}
      </main>

      {/* ── Mobile Bottom Tab Bar ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#0C0A09]/95 backdrop-blur-xl border-t border-white/[0.04] flex items-center justify-around py-2 px-4">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition-colors ${
                isActive ? 'text-[#FF6B4A]' : 'text-stone-600'
              }`}
            >
              <Icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 1.8} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
