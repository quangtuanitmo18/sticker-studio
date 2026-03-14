import Link from 'next/link'

export default function StudioLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50">
      <header className="h-16 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex items-center px-6 justify-between shrink-0">
        <div className="flex items-center gap-6">
          <Link href="/" className="font-bold text-lg tracking-tight">
            Sticker Studio
          </Link>
          <nav className="flex gap-4 text-sm font-medium">
            <Link href="/maker" className="text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50 transition-colors">
              Maker
            </Link>
            <Link href="/pack-gen" className="text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50 transition-colors">
              Pack Generator
            </Link>
            <Link href="/avatar-creator" className="text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50 transition-colors">
              Avatar Creator
            </Link>
            <Link href="/sticker-pack" className="text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50 transition-colors">
              Sticker Pack
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-4">
        </div>
      </header>
      <main className="flex-1 flex flex-col">
        {children}
      </main>
    </div>
  )
}
