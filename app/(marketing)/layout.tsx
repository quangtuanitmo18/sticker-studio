'use client'

import { ArrowUpRight, List, X } from '@phosphor-icons/react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

const NAV_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/how-it-works', label: 'How it works' },
  { href: '/about', label: 'About' },
]

function Navbar() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  return (
    <>
      {/* Floating pill navbar */}
      <header className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-3xl">
        <nav className="relative flex items-center justify-between px-5 py-3 rounded-full bg-[var(--card-bg-hover)] border border-[var(--overlay-border)] backdrop-blur-2xl shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#FF6B4A] to-[#F59E0B] flex items-center justify-center text-white font-black text-[10px] shadow-lg shadow-[#FF6B4A]/20 transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-105">
              SS
            </div>
            <span className="font-[var(--font-display)] text-sm font-bold tracking-tight text-[var(--text-primary)]">
              Sticker Studio
            </span>
          </Link>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3.5 py-1.5 rounded-full text-[13px] font-medium transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${
                  pathname === link.href
                    ? 'text-white bg-[var(--card-bg-hover)]'
                    : 'text-[var(--text-tertiary)] hover:text-[var(--text-primary)]'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Desktop CTA */}
          <Link
            href="/maker"
            className="hidden md:inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--card-bg-hover)] border border-[var(--overlay-border)] text-[13px] font-semibold text-[var(--text-primary)] hover:bg-[#FF6B4A]/15 hover:text-[#FF6B4A] hover:border-[#FF6B4A]/20 transition-all duration-300 active:scale-[0.97]"
          >
            Open Studio
            <ArrowUpRight weight="bold" className="w-3.5 h-3.5" />
          </Link>

          {/* Mobile hamburger */}
          <button
            onClick={() => setOpen(!open)}
            className="md:hidden w-9 h-9 rounded-full flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--card-bg-hover)] transition-all"
            aria-label="Toggle menu"
          >
            {open ? <X weight="bold" className="w-4 h-4" /> : <List weight="bold" className="w-4 h-4" />}
          </button>
        </nav>
      </header>

      {/* Mobile menu overlay */}
      {open && (
        <div className="fixed inset-0 z-40 bg-[var(--background)]/90 backdrop-blur-3xl md:hidden flex flex-col items-center justify-center gap-6">
          {NAV_LINKS.map((link, i) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="text-2xl font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors animate-slide-up"
              style={{ animationDelay: `${i * 0.08}s` }}
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/maker"
            onClick={() => setOpen(false)}
            className="mt-4 inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-gradient-to-r from-[#FF6B4A] to-[#F59E0B] text-white font-bold animate-slide-up"
            style={{ animationDelay: '0.3s' }}
          >
            Open Studio
            <ArrowUpRight weight="bold" className="w-4 h-4" />
          </Link>
        </div>
      )}
    </>
  )
}

function Footer() {
  return (
    <footer className="border-t border-[var(--overlay-border)] bg-[var(--background)]">
      <div className="max-w-[1400px] mx-auto px-6 md:px-16 py-12 md:py-16">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#FF6B4A] to-[#F59E0B] flex items-center justify-center text-white font-black text-[10px]">
              SS
            </div>
            <span className="text-sm font-semibold text-[var(--text-secondary)]">Sticker Studio</span>
          </div>

          {/* Nav */}
          <div className="flex flex-wrap gap-6 text-[13px] text-[var(--text-muted)]">
            <Link href="/maker" className="hover:text-[var(--text-secondary)] transition-colors">Studio</Link>
            <Link href="/how-it-works" className="hover:text-[var(--text-secondary)] transition-colors">How it works</Link>
            <Link href="/about" className="hover:text-[var(--text-secondary)] transition-colors">About</Link>
            <a href="https://github.com/quangtuanitmo18" target="_blank" rel="noopener noreferrer" className="hover:text-[var(--text-secondary)] transition-colors">GitHub</a>
          </div>

          {/* Legal */}
          <p className="text-[11px] text-[var(--text-muted)] tracking-wide">
            Built with craft. Open source.
          </p>
        </div>
      </div>
    </footer>
  )
}

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[100dvh] bg-[var(--background)] text-[var(--text-primary)]">
      <Navbar />
      <main>{children}</main>
      <Footer />
    </div>
  )
}
