'use client'

import { ArrowRight, CubeFocus, Export, MagicWand, Scissors, SlidersHorizontal, UploadSimple } from '@phosphor-icons/react'
import { motion } from 'motion/react'
import Link from 'next/link'

const spring = { type: 'spring' as const, stiffness: 100, damping: 20 }

const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  visible: { opacity: 1, y: 0 },
}

const FLOWS = [
  {
    id: 'maker',
    title: 'Sticker Maker',
    icon: Scissors,
    accent: '#FF6B4A',
    href: '/maker',
    steps: [
      { icon: UploadSimple, title: 'Drop your image', desc: 'Drag any photo into the canvas. JPEG, PNG, and WebP are supported.' },
      { icon: SlidersHorizontal, title: 'Edit and style', desc: 'AI removes the background. Add filters, frames, text overlays, or adjust the canvas size.' },
      { icon: Export, title: 'Export', desc: 'Download optimized for Telegram, WhatsApp, Discord, iMessage, or as standard PNG and WebP.' },
    ],
  },
  {
    id: 'ai-pack',
    title: 'AI Sticker Pack',
    icon: MagicWand,
    accent: '#F59E0B',
    href: '/pack-gen',
    steps: [
      { icon: UploadSimple, title: 'Upload a selfie', desc: 'One clear front-facing photo. The AI works best with good lighting.' },
      { icon: SlidersHorizontal, title: 'Pick style and emotions', desc: 'Choose from cartoon, pixel art, anime, watercolor, and more. Select which emotions to generate.' },
      { icon: Export, title: 'Get your pack', desc: 'The AI creates six styled reaction stickers. Download individually or as a complete pack.' },
    ],
  },
  {
    id: 'avatar',
    title: '3D Avatar Pack',
    icon: CubeFocus,
    accent: '#10B981',
    href: '/sticker-pack',
    steps: [
      { icon: UploadSimple, title: 'Build your avatar', desc: 'Use the 3D editor to set skin tone, hairstyle, eyes, outfit, and accessories.' },
      { icon: SlidersHorizontal, title: 'Generate stickers', desc: 'Pick expression presets — happy, angry, surprised, cool, love. Each becomes a posed sticker.' },
      { icon: Export, title: 'Download the set', desc: 'Export as PNG stickers or a ZIP pack ready for messaging apps.' },
    ],
  },
]

export default function HowItWorksPage() {
  return (
    <div className="overflow-x-hidden">
      {/* Hero */}
      <section className="min-h-[50dvh] flex items-end pb-20 pt-40">
        <div className="max-w-[1400px] mx-auto px-6 md:px-16 w-full">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...spring, delay: 0.1 }}
          >
            <span className="inline-block px-3 py-1 rounded-full bg-[var(--card-bg-hover)] border border-[var(--overlay-border)] text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--text-tertiary)] mb-6">
              Workflow
            </span>
            <h1 className="font-[var(--font-display)] text-4xl md:text-6xl font-bold tracking-tighter text-[var(--text-primary)] leading-[0.95] max-w-2xl">
              How it works
            </h1>
            <p className="mt-6 text-base text-[var(--text-tertiary)] leading-relaxed max-w-[50ch]">
              Three tools, three workflows. Each takes under a minute from start to export.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Divider */}
      <div className="max-w-[1400px] mx-auto px-6 md:px-16">
        <div className="border-t border-[var(--overlay-border)]" />
      </div>

      {/* Flows */}
      {FLOWS.map((flow, fi) => (
        <section key={flow.id} className="py-24 md:py-32">
          <div className="max-w-[1400px] mx-auto px-6 md:px-16">
            {/* Flow header */}
            <motion.div
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-60px' }}
              transition={spring}
              className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 mb-14"
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: `${flow.accent}15` }}
              >
                <flow.icon weight="duotone" className="w-6 h-6" style={{ color: flow.accent }} />
              </div>
              <div>
                <h2 className="font-[var(--font-display)] text-2xl md:text-3xl font-bold text-[var(--text-primary)]">
                  {flow.title}
                </h2>
              </div>
            </motion.div>

            {/* Steps */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5">
              {flow.steps.map((step, si) => (
                <motion.div
                  key={step.title}
                  variants={fadeUp}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: '-40px' }}
                  transition={{ ...spring, delay: si * 0.1 }}
                >
                  {/* Double-bezel card */}
                  <div className="h-full rounded-[1.5rem] bg-[var(--card-bg)] border border-[var(--overlay-border)] p-1.5">
                    <div className="h-full rounded-[calc(1.5rem-6px)] bg-[#141414] p-7 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                      {/* Step number */}
                      <div className="flex items-center gap-3 mb-5">
                        <span
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-[13px] font-bold"
                          style={{ backgroundColor: `${flow.accent}12`, color: flow.accent }}
                        >
                          {si + 1}
                        </span>
                        <step.icon weight="duotone" className="w-4 h-4 text-[var(--text-muted)]" />
                      </div>

                      <h3 className="font-[var(--font-display)] text-base font-bold text-[var(--text-primary)] mb-2">
                        {step.title}
                      </h3>
                      <p className="text-sm text-[var(--text-tertiary)] leading-relaxed">
                        {step.desc}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Try it link */}
            <motion.div
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              transition={{ ...spring, delay: 0.35 }}
              className="mt-8"
            >
              <Link
                href={flow.href}
                className="group inline-flex items-center gap-2 text-[14px] font-semibold text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors duration-300"
              >
                Try {flow.title}
                <ArrowRight weight="bold" className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            </motion.div>
          </div>

          {/* Section divider */}
          {fi < FLOWS.length - 1 && (
            <div className="max-w-[1400px] mx-auto px-6 md:px-16 pt-24 md:pt-32">
              <div className="border-t border-[var(--overlay-border)]" />
            </div>
          )}
        </section>
      ))}

      {/* CTA */}
      <section className="pb-32 md:pb-40 px-6 md:px-16">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          transition={spring}
          className="max-w-[1400px] mx-auto text-center"
        >
          <h2 className="font-[var(--font-display)] text-2xl md:text-4xl font-bold text-[var(--text-primary)] mb-6">
            Pick a tool and start making
          </h2>
          <div className="flex flex-wrap justify-center gap-3">
            {FLOWS.map((flow) => (
              <Link
                key={flow.id}
                href={flow.href}
                className="group inline-flex items-center gap-2 px-6 py-3 rounded-full border border-[var(--overlay-border-hover)] text-[14px] font-semibold text-[var(--text-secondary)] hover:bg-[var(--card-bg-hover)] hover:text-[var(--text-primary)] hover:border-[var(--overlay-border-hover)] transition-all duration-300 active:scale-[0.97]"
              >
                <flow.icon weight="duotone" className="w-4 h-4" style={{ color: flow.accent }} />
                {flow.title}
              </Link>
            ))}
          </div>
        </motion.div>
      </section>
    </div>
  )
}
