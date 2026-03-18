'use client'

import { ArrowUpRight, Brain, Code, Cube, GithubLogo, Palette } from '@phosphor-icons/react'
import { motion } from 'motion/react'

const spring = { type: 'spring' as const, stiffness: 100, damping: 20 }

const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  visible: { opacity: 1, y: 0 },
}

const TECH_STACK = [
  { icon: Code, label: 'Next.js 15', desc: 'React framework with server components' },
  { icon: Palette, label: 'Tailwind CSS v4', desc: 'Utility-first styling' },
  { icon: Cube, label: 'Three.js + R3F', desc: '3D avatar rendering' },
  { icon: Brain, label: 'Google Gemini', desc: 'AI sticker generation' },
]

export default function AboutPage() {
  return (
    <div className="overflow-x-hidden">
      {/* Hero */}
      <section className="min-h-[60dvh] flex items-end pb-20 pt-40">
        <div className="max-w-[1400px] mx-auto px-6 md:px-16 w-full">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 md:gap-24 items-end">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...spring, delay: 0.1 }}
            >
              <span className="inline-block px-3 py-1 rounded-full bg-[var(--card-bg-hover)] border border-[var(--overlay-border)] text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--text-tertiary)] mb-6">
                About
              </span>
              <h1 className="font-[var(--font-display)] text-4xl md:text-6xl font-bold tracking-tighter text-[var(--text-primary)] leading-[0.95]">
                Built for creators<span className="text-[var(--text-muted)]">,</span>{' '}
                <span className="text-[var(--text-tertiary)]">by a creator</span>
              </h1>
            </motion.div>

            <motion.p
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...spring, delay: 0.3 }}
              className="text-base text-[var(--text-tertiary)] leading-relaxed max-w-[50ch] md:pb-2"
            >
              Sticker Studio is a free, open-source creative toolkit for making custom stickers,
              AI-generated packs, 3D avatars, and photo collages. No sign-up, no watermarks,
              no restrictions.
            </motion.p>
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="max-w-[1400px] mx-auto px-6 md:px-16">
        <div className="border-t border-[var(--overlay-border)]" />
      </div>

      {/* Story */}
      <section className="py-32 md:py-40">
        <div className="max-w-[1400px] mx-auto px-6 md:px-16">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-16 md:gap-12">
            {/* Left label */}
            <motion.div
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              transition={spring}
              className="md:col-span-2"
            >
              <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">
                The project
              </span>
            </motion.div>

            {/* Right content */}
            <motion.div
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              transition={{ ...spring, delay: 0.1 }}
              className="md:col-span-3 space-y-6"
            >
              <p className="text-lg text-[var(--text-secondary)] leading-relaxed max-w-[55ch]">
                Sticker Studio started as a side project to solve a simple problem: making
                custom stickers should not require Photoshop, paid subscriptions, or design skills.
              </p>
              <p className="text-base text-[var(--text-tertiary)] leading-relaxed max-w-[55ch]">
                The app combines browser-based image editing with AI capabilities. Background
                removal runs directly in your browser for free. AI features use Google Gemini
                to generate styled sticker packs from a single photo.
              </p>
              <p className="text-base text-[var(--text-tertiary)] leading-relaxed max-w-[55ch]">
                Everything runs client-side where possible. Your images stay on your device.
                The source code is open for anyone to review, fork, or contribute.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Tech stack */}
      <section className="pb-32 md:pb-40">
        <div className="max-w-[1400px] mx-auto px-6 md:px-16">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            transition={spring}
            className="mb-12"
          >
            <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">
              Built with
            </span>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {TECH_STACK.map((item, i) => (
              <motion.div
                key={item.label}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                transition={{ ...spring, delay: i * 0.08 }}
                className="group rounded-2xl bg-[var(--card-bg)] border border-[var(--overlay-border)] p-6 hover:border-[var(--overlay-border-hover)] hover:bg-[var(--input-bg)] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]"
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-[var(--card-bg-hover)] flex items-center justify-center flex-shrink-0">
                    <item.icon weight="duotone" className="w-5 h-5 text-[var(--text-secondary)] group-hover:text-[#FF6B4A] transition-colors duration-300" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[var(--text-primary)]">{item.label}</p>
                    <p className="text-[13px] text-[var(--text-tertiary)] mt-0.5">{item.desc}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Creator + GitHub */}
      <section className="pb-32 md:pb-40">
        <div className="max-w-[1400px] mx-auto px-6 md:px-16">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-16 md:gap-12">
            <motion.div
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              transition={spring}
              className="md:col-span-2"
            >
              <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">
                Creator
              </span>
            </motion.div>

            <motion.div
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              transition={{ ...spring, delay: 0.1 }}
              className="md:col-span-3"
            >
              <h3 className="font-[var(--font-display)] text-2xl font-bold text-[var(--text-primary)] mb-3">
                Quang Tuan
              </h3>
              <p className="text-base text-[var(--text-tertiary)] leading-relaxed max-w-[50ch] mb-8">
                A developer from Vietnam who enjoys building useful tools and exploring
                the intersection of AI and creative workflows.
              </p>
              <a
                href="https://github.com/quangtuanitmo18"
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-3 px-6 py-3 rounded-full border border-[var(--overlay-border-hover)] text-[var(--text-secondary)] font-semibold text-[14px] hover:bg-[var(--card-bg-hover)] hover:text-[var(--text-primary)] hover:border-[var(--overlay-border-hover)] transition-all duration-300 active:scale-[0.97]"
              >
                <GithubLogo weight="fill" className="w-5 h-5" />
                View on GitHub
                <ArrowUpRight weight="bold" className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </a>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  )
}
