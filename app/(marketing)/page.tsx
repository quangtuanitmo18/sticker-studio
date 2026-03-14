import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 p-6 text-center">
      <h1 className="text-5xl font-extrabold tracking-tight mb-4">
        Sticker Studio
      </h1>
      <p className="text-xl text-zinc-600 dark:text-zinc-400 max-w-2xl mb-10">
        Create custom stickers instantly. Remove backgrounds, add outlines, or use AI to generate a full pack of emotional reactions from a single selfie.
      </p>

      {/* Featured Hero Card */}
      <div className="w-full max-w-7xl mb-12">
        <div className="relative overflow-hidden bg-indigo-600 rounded-3xl p-8 md:p-12 text-left text-white shadow-xl shadow-indigo-500/20">
          <div className="relative z-10 max-w-xl">
            <span className="inline-block px-3 py-1 rounded-full bg-indigo-500/30 text-indigo-100 text-xs font-bold uppercase tracking-wider mb-4">
              New Feature
            </span>
            <h2 className="text-3xl md:text-4xl font-bold mb-4 leading-tight">
              Design Your Own 3D Avatar
            </h2>
            <p className="text-indigo-100 mb-8 text-lg">
              Create a personalized 3D avatar with our new Meta-style creator. Customize everything from skin tone to outfits and export for your favorite platforms.
            </p>
            <Link href="/avatar-creator">
              <Button size="lg" className="bg-white text-indigo-600 hover:bg-indigo-50 border-none px-8">
                Try It Now
              </Button>
            </Link>
          </div>
          {/* Decorative element */}
          <div className="absolute top-0 right-0 -translate-y-1/4 translate-x-1/4 w-96 h-96 bg-indigo-500 rounded-full blur-3xl opacity-50" />
          <div className="absolute bottom-0 right-0 translate-y-1/4 translate-x-1/4 w-64 h-64 bg-indigo-400 rounded-full blur-3xl opacity-30" />
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full max-w-7xl">
        <div className="bg-white dark:bg-zinc-900 p-8 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 flex flex-col items-center">
          <h2 className="text-2xl font-bold mb-2">Sticker Maker</h2>
          <p className="text-zinc-500 mb-6 text-center">
            Upload an image, remove the background, and add custom outlines and shadows.
          </p>
          <Link href="/maker" className="mt-auto w-full">
            <Button size="lg" className="w-full">
              Open Maker
            </Button>
          </Link>
        </div>

        <div className="bg-white dark:bg-zinc-900 p-8 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 flex flex-col items-center">
          <h2 className="text-2xl font-bold mb-2">AI Pack Generator</h2>
          <p className="text-zinc-500 mb-6 text-center">
            Upload a selfie and let AI generate a full pack of stylized reaction stickers.
          </p>
          <Link href="/pack-gen" className="mt-auto w-full">
            <Button size="lg" variant="secondary" className="w-full">
              Open Generator
            </Button>
          </Link>
        </div>

        <div className="bg-white dark:bg-zinc-900 p-8 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 flex flex-col items-center">
          <h2 className="text-2xl font-bold mb-2">3D Avatar</h2>
          <p className="text-zinc-500 mb-6 text-center">
            Design your own 3D avatar with a Meta-like creator. Customize skin, hair, and more.
          </p>
          <Link href="/avatar-creator" className="mt-auto w-full">
            <Button size="lg" variant="outline" className="w-full">
              Create Avatar
            </Button>
          </Link>
        </div>

        <div className="bg-white dark:bg-zinc-900 p-8 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 flex flex-col items-center">
          <h2 className="text-2xl font-bold mb-2">Community</h2>
          <p className="text-zinc-500 mb-6 text-center">
            Explore and download stickers created by the community. Share your own packs.
          </p>
          <Link href="/gallery" className="mt-auto w-full">
            <Button size="lg" variant="ghost" className="w-full">
              View Gallery
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
