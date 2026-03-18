'use client'

import { ArrowRight, ArrowUpRight, CubeFocus, Layout, MagicWand, Scissors, Sparkle } from '@phosphor-icons/react'
import { motion } from 'motion/react'
import Link from 'next/link'

const FEATURES = [
  {
    title: 'Sticker Maker',
    desc: 'Upload an image, strip the background in one click, add filters, frames, and text overlays. Export in any format.',
    href: '/maker',
    icon: Scissors,
    span: 'md:col-span-2 md:row-span-2',
    accent: '#FF6B4A',
  },
  {
    title: 'AI Sticker Pack',
    desc: 'One selfie turns into six stylized reaction stickers. Pick your emotions, pick your art style.',
    href: '/pack-gen',
    icon: MagicWand,
    span: 'md:col-span-1',
    accent: '#F59E0B',
  },
  {
    title: '3D Avatar Pack',
    desc: 'Build an avatar, then generate a full sticker set with expressions and poses.',
    href: '/sticker-pack',
    icon: CubeFocus,
    span: 'md:col-span-1',
    accent: '#10B981',
  },
  {
    title: '3D Avatar Creator',
    desc: 'Meta-style 3D editor. Skin, hair, outfits, accessories. Export to PNG or GLB.',
    href: '/avatar-creator',
    icon: Sparkle,
    span: 'md:col-span-1',
    accent: '#3B82F6',
  },
  {
    title: 'Photo Collage',
    desc: 'Combine multiple shots into grid, hero, or strip layouts with custom backgrounds.',
    href: '/collage',
    icon: Layout,
    span: 'md:col-span-1',
    accent: '#EC4899',
  },
]

const STEPS = [
  {
    num: '01',
    title: 'Upload or capture',
    desc: 'Drag any image into the studio. Background removal happens automatically.',
  },
  {
    num: '02',
    title: 'Edit and style',
    desc: 'Apply filters, frames, text, and stickers. Use AI to upscale or generate variations.',
  },
  {
    num: '03',
    title: 'Export anywhere',
    desc: 'Download optimized for Telegram, WhatsApp, Discord, iMessage, or as standard PNG and WebP.',
  },
]

const spring = { type: 'spring' as const, stiffness: 100, damping: 20 }

const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  visible: { opacity: 1, y: 0 },
}

export default function LandingPage() {
  return (
    <div className="overflow-x-hidden">
      {/* ═══════════════════════════════════════════════════════
          HERO — Asymmetric split
      ═══════════════════════════════════════════════════════ */}
      <section className="relative min-h-[100dvh] flex items-center">
        {/* Background mesh */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-[15%] right-[5%] w-[600px] h-[600px] bg-[#FF6B4A]/[0.04] rounded-full blur-[180px]" />
          <div className="absolute bottom-[20%] left-[10%] w-[500px] h-[500px] bg-[#F59E0B]/[0.03] rounded-full blur-[160px]" />
          <div className="absolute top-[60%] right-[40%] w-[300px] h-[300px] bg-[#10B981]/[0.02] rounded-full blur-[120px]" />
        </div>

        <div className="relative z-10 w-full max-w-[1400px] mx-auto px-6 md:px-16 pt-32 pb-20 md:pt-40 md:pb-32">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 md:gap-20 items-center">
            {/* Left — Text */}
            <div>
              {/* Eyebrow */}
              <motion.div
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ ...spring, delay: 0.1 }}
                className="flex items-center gap-3 mb-8"
              >
                <span className="w-8 h-[2px] bg-[#FF6B4A]" />
                <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#FF6B4A]">
                  Creative studio
                </span>
              </motion.div>

              {/* Heading */}
              <motion.h1
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...spring, delay: 0.2 }}
              >
                <span className="block font-[var(--font-display)] text-5xl sm:text-6xl md:text-7xl lg:text-[88px] font-black leading-[0.92] tracking-tighter text-[var(--text-primary)]">
                  Make stickers
                </span>
                <span className="block font-[var(--font-display)] text-5xl sm:text-6xl md:text-7xl lg:text-[88px] font-black leading-[0.92] tracking-tighter text-[var(--text-tertiary)] mt-1">
                  that stick
                </span>
              </motion.h1>

              {/* Subtitle */}
              <motion.p
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...spring, delay: 0.35 }}
                className="mt-8 text-base md:text-lg text-[var(--text-tertiary)] leading-relaxed max-w-[50ch]"
              >
                Upload any photo, remove the background, add your style, and export
                for every messaging platform. Or let AI generate an entire pack
                from a single selfie.
              </motion.p>

              {/* CTAs */}
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...spring, delay: 0.5 }}
                className="mt-10 flex flex-wrap gap-4"
              >
                <Link
                  href="/maker"
                  className="group inline-flex items-center gap-3 px-7 py-3.5 rounded-full bg-gradient-to-r from-[#FF6B4A] to-[#F59E0B] text-white font-bold text-[15px] shadow-[0_8px_32px_rgba(255,107,74,0.25)] hover:shadow-[0_12px_40px_rgba(255,107,74,0.35)] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-0.5 active:scale-[0.97]"
                >
                  Start creating
                  <span className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center transition-transform duration-300 group-hover:translate-x-0.5">
                    <ArrowRight weight="bold" className="w-3.5 h-3.5" />
                  </span>
                </Link>
                <Link
                  href="/how-it-works"
                  className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full border border-[var(--overlay-border-hover)] text-[var(--text-secondary)] font-semibold text-[15px] hover:bg-[var(--card-bg-hover)] hover:text-[var(--text-primary)] hover:border-[var(--overlay-border-hover)] transition-all duration-300 active:scale-[0.97]"
                >
                  How it works
                </Link>
              </motion.div>
            </div>

            {/* Right — Floating tool previews */}
            <div className="hidden md:block relative">
              <div className="relative w-full aspect-square max-w-[480px] ml-auto">
                {/* Decorative floating cards */}
                <motion.div
                  animate={{ y: [0, -12, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                  className="absolute top-[8%] left-[5%] w-48 h-48 rounded-[2rem] bg-[var(--input-bg)] border border-[var(--overlay-border)] p-6 backdrop-blur-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
                >
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FF6B4A] to-[#FF6B4A]/60 flex items-center justify-center mb-4">
                    <Scissors weight="duotone" className="w-5 h-5 text-white" />
                  </div>
                  <p className="text-xs font-semibold text-[var(--text-secondary)]">Sticker Maker</p>
                  <p className="text-[10px] text-[var(--text-muted)] mt-1">Remove bg, add style</p>
                </motion.div>

                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
                  className="absolute top-[5%] right-[2%] w-40 h-40 rounded-[1.5rem] bg-[var(--input-bg)] border border-[var(--overlay-border)] p-5 backdrop-blur-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
                >
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#F59E0B] to-[#F59E0B]/60 flex items-center justify-center mb-3">
                    <MagicWand weight="duotone" className="w-4 h-4 text-white" />
                  </div>
                  <p className="text-[11px] font-semibold text-[var(--text-secondary)]">AI Pack</p>
                  <p className="text-[10px] text-[var(--text-muted)] mt-1">6 stickers from 1 photo</p>
                </motion.div>

                <motion.div
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
                  className="absolute bottom-[12%] left-[10%] w-44 h-36 rounded-[1.5rem] bg-[var(--input-bg)] border border-[var(--overlay-border)] p-5 backdrop-blur-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
                >
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#10B981] to-[#10B981]/60 flex items-center justify-center mb-3">
                    <CubeFocus weight="duotone" className="w-4 h-4 text-white" />
                  </div>
                  <p className="text-[11px] font-semibold text-[var(--text-secondary)]">3D Avatar</p>
                  <p className="text-[10px] text-[var(--text-muted)] mt-1">Build, customize, export</p>
                </motion.div>

                <motion.div
                  animate={{ y: [0, -14, 0] }}
                  transition={{ duration: 3.8, repeat: Infinity, ease: 'easeInOut', delay: 0.8 }}
                  className="absolute bottom-[8%] right-[8%] w-36 h-36 rounded-[1.5rem] bg-[var(--input-bg)] border border-[var(--overlay-border)] p-5 backdrop-blur-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
                >
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#EC4899] to-[#EC4899]/60 flex items-center justify-center mb-3">
                    <Layout weight="duotone" className="w-4 h-4 text-white" />
                  </div>
                  <p className="text-[11px] font-semibold text-[var(--text-secondary)]">Collage</p>
                  <p className="text-[10px] text-[var(--text-muted)] mt-1">Grid, hero, strip</p>
                </motion.div>

                {/* Central glow */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-[#FF6B4A]/[0.06] rounded-full blur-[80px]" />
              </div>
            </div>
          </div>
        </div>

        {/* Scroll hint */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.8 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-[var(--text-muted)]"
        >
          <span className="text-[9px] uppercase tracking-[0.3em] font-medium">Scroll</span>
          <div className="w-[1px] h-8 bg-gradient-to-b from-stone-700 to-transparent" />
        </motion.div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          FEATURES — Bento grid
      ═══════════════════════════════════════════════════════ */}
      <section className="py-32 md:py-40">
        <div className="max-w-[1400px] mx-auto px-6 md:px-16">
          {/* Section header — left aligned */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            transition={spring}
            className="mb-16 md:mb-20"
          >
            <span className="inline-block px-3 py-1 rounded-full bg-[var(--card-bg-hover)] border border-[var(--overlay-border)] text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--text-tertiary)] mb-4">
              Tools
            </span>
            <h2 className="font-[var(--font-display)] text-3xl md:text-5xl font-bold tracking-tight text-[var(--text-primary)] max-w-xl">
              Five tools, one studio
            </h2>
          </motion.div>

          {/* Bento grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5">
            {FEATURES.map((feat, i) => (
              <motion.div
                key={feat.title}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: '-60px' }}
                transition={{ ...spring, delay: i * 0.08 }}
                className={feat.span}
              >
                <Link href={feat.href} className="group block h-full">
                  {/* Double-bezel: outer shell */}
                  <div className="h-full rounded-[1.75rem] bg-[var(--card-bg)] border border-[var(--overlay-border)] p-1.5 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:border-[var(--overlay-border-hover)] hover:bg-[var(--input-bg)]">
                    {/* Inner core */}
                    <div className="h-full rounded-[calc(1.75rem-6px)] bg-[#141414] p-7 md:p-8 flex flex-col shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                      {/* Icon */}
                      <div
                        className="w-11 h-11 rounded-xl flex items-center justify-center mb-6"
                        style={{ backgroundColor: `${feat.accent}15` }}
                      >
                        <feat.icon weight="duotone" className="w-5 h-5" style={{ color: feat.accent }} />
                      </div>

                      {/* Content */}
                      <h3 className="font-[var(--font-display)] text-lg font-bold text-[var(--text-primary)] mb-2 group-hover:text-[var(--text-primary)] transition-colors duration-300">
                        {feat.title}
                      </h3>
                      <p className="text-sm text-[var(--text-tertiary)] leading-relaxed flex-1">
                        {feat.desc}
                      </p>

                      {/* Link */}
                      <div className="mt-6 flex items-center gap-2 text-[13px] font-semibold text-[var(--text-muted)] group-hover:text-[#FF6B4A] transition-colors duration-300">
                        Open tool
                        <ArrowUpRight weight="bold" className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          HOW IT WORKS — 3 steps, left-aligned
      ═══════════════════════════════════════════════════════ */}
      <section className="py-32 md:py-40 border-t border-[var(--overlay-border)]">
        <div className="max-w-[1400px] mx-auto px-6 md:px-16">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 md:gap-24">
            {/* Left — section header */}
            <motion.div
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-80px' }}
              transition={spring}
            >
              <span className="inline-block px-3 py-1 rounded-full bg-[var(--card-bg-hover)] border border-[var(--overlay-border)] text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--text-tertiary)] mb-4">
                Workflow
              </span>
              <h2 className="font-[var(--font-display)] text-3xl md:text-5xl font-bold tracking-tight text-[var(--text-primary)] mb-6">
                Three steps,{' '}
                <span className="text-[var(--text-tertiary)]">zero friction</span>
              </h2>
              <p className="text-base text-[var(--text-tertiary)] leading-relaxed max-w-[45ch]">
                From raw photo to platform-ready sticker in under a minute.
                No design skills required.
              </p>
            </motion.div>

            {/* Right — steps */}
            <div className="space-y-10">
              {STEPS.map((step, i) => (
                <motion.div
                  key={step.num}
                  variants={fadeUp}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: '-40px' }}
                  transition={{ ...spring, delay: i * 0.12 }}
                  className="flex gap-6"
                >
                  {/* Number */}
                  <span className="flex-shrink-0 font-[var(--font-display)] text-4xl font-black text-white/[0.06] tabular-nums leading-none pt-1">
                    {step.num}
                  </span>
                  <div>
                    <h3 className="font-[var(--font-display)] text-lg font-bold text-[var(--text-primary)] mb-2">
                      {step.title}
                    </h3>
                    <p className="text-sm text-[var(--text-tertiary)] leading-relaxed max-w-[40ch]">
                      {step.desc}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          CTA BANNER
      ═══════════════════════════════════════════════════════ */}
      <section className="pb-32 md:pb-40 px-6 md:px-16">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          transition={spring}
          className="max-w-[1400px] mx-auto"
        >
          {/* Outer shell */}
          <div className="rounded-[2rem] bg-[var(--card-bg)] border border-[var(--overlay-border)] p-1.5">
            {/* Inner core */}
            <div className="relative overflow-hidden rounded-[calc(2rem-6px)] bg-gradient-to-br from-[#FF6B4A] to-[#F59E0B] p-10 md:p-16">
              <div className="relative z-10 max-w-lg">
                <h2 className="font-[var(--font-display)] text-3xl md:text-4xl font-bold text-white leading-tight mb-6">
                  Ready to make something?
                </h2>
                <p className="text-white/70 text-base leading-relaxed mb-8 max-w-[45ch]">
                  Open the studio, drop in an image, and watch it transform.
                  Free to use, no account required.
                </p>
                <Link
                  href="/maker"
                  className="group inline-flex items-center gap-3 px-7 py-3.5 rounded-full bg-white text-[#0a0a0a] font-bold text-[15px] shadow-[0_8px_32px_rgba(0,0,0,0.15)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.2)] hover:-translate-y-0.5 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.97]"
                >
                  Open Studio
                  <span className="w-7 h-7 rounded-full bg-[var(--background)]/10 flex items-center justify-center transition-transform duration-300 group-hover:translate-x-0.5">
                    <ArrowRight weight="bold" className="w-3.5 h-3.5" />
                  </span>
                </Link>
              </div>
              {/* Decorative */}
              <div className="absolute top-0 right-0 -translate-y-1/4 translate-x-1/4 w-[400px] h-[400px] bg-white/10 rounded-full blur-3xl" />
              <div className="absolute bottom-0 left-1/3 translate-y-1/3 w-[300px] h-[300px] bg-white/10 rounded-full blur-3xl" />
            </div>
          </div>
        </motion.div>
      </section>
    </div>
  )
}
