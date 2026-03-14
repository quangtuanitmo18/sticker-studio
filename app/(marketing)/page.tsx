import Link from 'next/link'
import { Scissors, Sparkles, User, Users, ArrowRight, ChevronRight } from 'lucide-react'

const FEATURES = [
  {
    title: 'Sticker Maker',
    desc: 'Upload any image, instantly remove the background, then add borders, shadows, and custom text to create the perfect sticker.',
    href: '/maker',
    icon: Scissors,
    gradient: 'from-[#FF6B4A] to-[#DC2626]',
  },
  {
    title: 'AI Pack Generator',
    desc: 'Upload one selfie and AI generates a full pack of 6 stylized reaction stickers with different emotions.',
    href: '/pack-gen',
    icon: Sparkles,
    gradient: 'from-[#F59E0B] to-[#D97706]',
  },
  {
    title: '3D Avatar Creator',
    desc: 'Build your personalized 3D avatar in a Meta-style editor. Customize everything and export to PNG, JPEG, or GLB.',
    href: '/avatar-creator',
    icon: User,
    gradient: 'from-[#10B981] to-[#059669]',
  },
  {
    title: 'Community Gallery',
    desc: 'Explore sticker packs created by other users. Download, remix, and share your own creations with the world.',
    href: '/gallery',
    icon: Users,
    gradient: 'from-[#3B82F6] to-[#2563EB]',
  },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0C0A09] text-stone-100 overflow-x-hidden">
      {/* ═══ HERO ═══ Full viewport, left-aligned, massive typography */}
      <section className="min-h-screen flex flex-col justify-center px-6 md:px-16 lg:px-24 relative">
        {/* Background accents */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-[20%] right-[10%] w-[500px] h-[500px] bg-[#FF6B4A]/[0.04] rounded-full blur-[150px]" />
          <div className="absolute bottom-[10%] left-[5%] w-[400px] h-[400px] bg-[#F59E0B]/[0.03] rounded-full blur-[120px]" />
        </div>

        <div className="relative z-10 max-w-5xl">
          {/* Eyebrow */}
          <div className="flex items-center gap-3 mb-8 animate-fade-in">
            <span className="w-8 h-[2px] bg-[#FF6B4A]" />
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[#FF6B4A]">
              Creative Studio
            </span>
          </div>

          {/* Title — dramatic scale */}
          <h1 className="animate-slide-up">
            <span className="block font-(--font-display) text-6xl sm:text-7xl md:text-8xl lg:text-[120px] font-black leading-[0.9] tracking-tighter text-stone-100">
              Sticker
            </span>
            <span className="block font-(--font-display) text-6xl sm:text-7xl md:text-8xl lg:text-[120px] font-black leading-[0.9] tracking-tighter bg-linear-to-r from-[#FF6B4A] to-[#F59E0B] bg-clip-text text-transparent">
              Studio
            </span>
          </h1>

          {/* Subtitle */}
          <p className="mt-8 text-lg md:text-xl text-stone-500 max-w-lg leading-relaxed animate-fade-in" style={{ animationDelay: '0.2s' }}>
            Create custom stickers from any image. Remove backgrounds, add outlines, or let AI generate an entire reaction pack from a single selfie.
          </p>

          {/* CTAs */}
          <div className="mt-10 flex flex-wrap gap-4 animate-fade-in" style={{ animationDelay: '0.35s' }}>
            <Link
              href="/maker"
              className="group inline-flex items-center gap-3 px-8 py-4 rounded-2xl bg-linear-to-r from-[#FF6B4A] to-[#F59E0B] text-white font-bold text-base shadow-xl shadow-[#FF6B4A]/20 hover:shadow-2xl hover:shadow-[#FF6B4A]/30 transition-all duration-300 hover:-translate-y-0.5"
            >
              Start Creating
              <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              href="/avatar-creator"
              className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl border border-white/[0.08] text-stone-400 font-semibold text-base hover:bg-white/[0.04] hover:text-white hover:border-white/[0.12] transition-all duration-300"
            >
              Try 3D Avatar
            </Link>
          </div>
        </div>

        {/* Scroll hint */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-stone-600 animate-fade-in" style={{ animationDelay: '0.5s' }}>
          <span className="text-[10px] uppercase tracking-[0.3em] font-medium">Explore</span>
          <div className="w-[1px] h-8 bg-linear-to-b from-stone-600 to-transparent" />
        </div>
      </section>

      {/* ═══ FEATURES ═══ Horizontal snap-scroll cards */}
      <section className="py-24 px-6 md:px-16 lg:px-24">
        <div className="flex items-end justify-between mb-12">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#FF6B4A] mb-3">Tools</p>
            <h2 className="font-(--font-display) text-4xl md:text-5xl font-bold tracking-tight text-stone-100">
              Everything you need
            </h2>
          </div>
          <Link
            href="/maker"
            className="hidden md:inline-flex items-center gap-2 text-sm text-stone-500 hover:text-stone-300 transition-colors"
          >
            View all tools <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Scroll container */}
        <div className="flex gap-5 overflow-x-auto snap-x-mandatory pb-4 -mx-2 px-2">
          {FEATURES.map((feat, i) => (
            <Link
              key={feat.title}
              href={feat.href}
              className="group flex-shrink-0 w-[85vw] sm:w-[60vw] md:w-[40vw] lg:w-[calc(25%-15px)] snap-center animate-slide-up"
              style={{ animationDelay: `${0.1 * i}s` }}
            >
              <div className="h-full rounded-3xl border border-white/[0.04] bg-white/[0.02] p-8 flex flex-col transition-all duration-300 hover:border-white/[0.08] hover:bg-white/[0.04] hover:-translate-y-1">
                {/* Icon */}
                <div className={`w-12 h-12 rounded-2xl bg-linear-to-br ${feat.gradient} flex items-center justify-center mb-6 shadow-lg`}>
                  <feat.icon className="w-5 h-5 text-white" strokeWidth={2} />
                </div>

                {/* Content */}
                <h3 className="font-(--font-display) text-xl font-bold mb-3 text-stone-100 group-hover:text-white transition-colors">
                  {feat.title}
                </h3>
                <p className="text-sm text-stone-500 leading-relaxed flex-1">
                  {feat.desc}
                </p>

                {/* Link arrow */}
                <div className="mt-6 flex items-center gap-2 text-sm font-semibold text-stone-600 group-hover:text-[#FF6B4A] transition-colors">
                  Open
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ═══ HIGHLIGHT ═══ Featured tool — large format */}
      <section className="px-6 md:px-16 lg:px-24 pb-32">
        <div className="relative overflow-hidden rounded-[28px] bg-linear-to-br from-[#FF6B4A] to-[#F59E0B] p-10 md:p-16">
          <div className="relative z-10 max-w-lg">
            <span className="inline-block px-3 py-1 mb-5 rounded-full bg-white/20 text-white/90 text-xs font-bold uppercase tracking-wider backdrop-blur-sm">
              New Feature
            </span>
            <h2 className="font-(--font-display) text-3xl md:text-5xl font-bold text-white leading-tight mb-6">
              Design Your Own<br />3D Avatar
            </h2>
            <p className="text-white/75 text-lg leading-relaxed mb-8">
              Create a personalized avatar with our Meta-style creator. Customize skin tone, hairstyle, outfits, and export for your favorite platforms.
            </p>
            <Link
              href="/avatar-creator"
              className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl bg-white text-[#0C0A09] font-bold shadow-xl hover:shadow-2xl hover:-translate-y-0.5 transition-all duration-300"
            >
              Try It Now
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
          {/* Decorative blobs */}
          <div className="absolute top-0 right-0 -translate-y-1/3 translate-x-1/3 w-[400px] h-[400px] bg-white/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-1/2 translate-y-1/3 w-[300px] h-[300px] bg-white/10 rounded-full blur-3xl" />
        </div>
      </section>
    </div>
  )
}
