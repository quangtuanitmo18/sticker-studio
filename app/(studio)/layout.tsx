'use client'

import { useTheme } from '@/hooks/use-theme'
import { ArrowLeft, Camera, Grid, Package, Scissors, Sparkles, User } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV_GROUPS = [
  {
    label: 'Sticker',
    items: [
      { href: '/maker', icon: Scissors, label: 'Sticker Maker' },
      { href: '/pack-gen', icon: Sparkles, label: 'AI Sticker Pack' },
      { href: '/sticker-pack', icon: Package, label: '3D Avatar Pack' },
    ],
  },
  {
    label: 'Image',
    items: [
      { href: '/avatar-creator', icon: User, label: '3D Avatar' },
      { href: '/collage', icon: Grid, label: 'Photo Collage' },
      { href: '/photobooth', icon: Camera, label: 'Photobooth' },
    ],
  },
]

// Flat list for mobile bottom bar (top 5)
const MOBILE_NAV = [
  { href: '/maker', icon: Scissors, label: 'Maker' },
  { href: '/pack-gen', icon: Sparkles, label: 'AI Pack' },
  { href: '/collage', icon: Grid, label: 'Collage' },
  { href: '/photobooth', icon: Camera, label: 'Booth' },
  { href: '/avatar-creator', icon: User, label: 'Avatar' },
]

export default function StudioLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { theme, toggle } = useTheme()

  return (
    <div className={`studio-layout ${theme === 'light' ? 'bg-[var(--background)] text-[var(--text-primary)]' : 'bg-[var(--background)] text-[var(--text-primary)]'}`}>
      {/* ── Desktop Sidebar ── */}
      <aside className={`hidden md:flex flex-col items-center py-4 px-2 border-r sticky top-0 h-screen z-40 ${
        theme === 'light'
          ? 'bg-white border-stone-200'
          : 'bg-[var(--background)] border-[var(--overlay-border)]'
      }`}>
        {/* Logo */}
        <Link
          href="/"
          className="mb-6 w-10 h-10 rounded-xl bg-linear-to-br from-[#FF6B4A] to-[#F59E0B] flex items-center justify-center text-white font-black text-sm shadow-lg shadow-[#FF6B4A]/20"
        >
          SS
        </Link>

        {/* Grouped Nav */}
        <nav className="flex flex-col gap-1 flex-1 w-full">
          {NAV_GROUPS.map((group, gi) => (
            <div key={group.label}>
              {/* Section label */}
              <span className={`block text-[9px] font-bold uppercase tracking-widest text-center mb-1 mt-2 ${
                theme === 'light' ? 'text-stone-400' : 'text-stone-700'
              }`}>
                {group.label}
              </span>
              {group.items.map((item) => {
                const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
                const Icon = item.icon
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`group relative w-11 h-11 mx-auto rounded-xl flex items-center justify-center transition-all duration-200 ${
                      isActive
                        ? 'bg-[#FF6B4A]/15 text-[#FF6B4A]'
                        : theme === 'light'
                          ? 'text-stone-400 hover:text-stone-600 hover:bg-stone-100'
                          : 'text-stone-600 hover:text-stone-300 hover:bg-[var(--card-bg-hover)]'
                    }`}
                    title={item.label}
                  >
                    <Icon className="w-[18px] h-[18px]" strokeWidth={isActive ? 2.5 : 1.8} />
                    {/* Tooltip */}
                    <span className={`absolute left-full ml-3 px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity shadow-xl z-50 ${
                      theme === 'light' ? 'bg-stone-800 text-white' : 'bg-stone-800 text-stone-200'
                    }`}>
                      {item.label}
                    </span>
                    {/* Active indicator */}
                    {isActive && (
                      <span className="absolute -left-2 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r-full bg-[#FF6B4A]" />
                    )}
                  </Link>
                )
              })}
              {/* Divider between groups */}
              {gi < NAV_GROUPS.length - 1 && (
                <div className={`w-6 mx-auto my-2 border-t ${
                  theme === 'light' ? 'border-stone-200' : 'border-[var(--overlay-border)]'
                }`} />
              )}
            </div>
          ))}
        </nav>

        {/* Theme toggle — temporarily hidden, dark mode default
        <button
          onClick={toggle}
          className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all mb-2 cursor-pointer ${
            theme === 'light'
              ? 'text-stone-500 hover:text-stone-700 hover:bg-stone-100'
              : 'text-stone-600 hover:text-stone-300 hover:bg-[var(--card-bg-hover)]'
          }`}
          title={theme === 'dark' ? 'Switch to Light mode' : 'Switch to Dark mode'}
        >
          {theme === 'dark' ? <Sun className="w-[18px] h-[18px]" strokeWidth={1.8} /> : <Moon className="w-[18px] h-[18px]" strokeWidth={1.8} />}
        </button>
        */}

        {/* Back to home */}
        <Link
          href="/"
          className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all ${
            theme === 'light'
              ? 'text-stone-500 hover:text-stone-700 hover:bg-stone-100'
              : 'text-stone-600 hover:text-stone-300 hover:bg-[var(--card-bg-hover)]'
          }`}
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
      <nav className={`md:hidden fixed bottom-0 left-0 right-0 z-50 backdrop-blur-xl flex items-center justify-around py-2 px-4 border-t ${
        theme === 'light'
          ? 'bg-white/95 border-stone-200'
          : 'bg-[#0a0a0a]/95 border-[var(--overlay-border)]'
      }`}>
        {MOBILE_NAV.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition-colors ${
                isActive ? 'text-[#FF6B4A]' : theme === 'light' ? 'text-stone-400' : 'text-stone-600'
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
