import { ToastProvider } from "@/components/ui/toast";
import { ThemeProvider } from "@/hooks/use-theme";
import type { Metadata, Viewport } from "next";
import { DM_Sans, Outfit } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://stickerstudio.app'

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0C0A09' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
}

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: 'Sticker Studio — Free AI Sticker Maker & Photo Editor',
    template: '%s | Sticker Studio',
  },
  description: 'Create custom stickers, photo strips, collages and 3D avatars with AI-powered tools. Remove backgrounds, add filters & frames, generate sticker packs from selfies. 100% free, no sign-up required.',
  keywords: [
    'sticker maker', 'AI sticker generator', 'remove background',
    'photo strip maker', 'collage maker', 'avatar creator',
    'sticker pack generator', 'free sticker maker online',
    'custom stickers', 'photobooth online', '3D avatar',
    'AI photo editor', 'background remover', 'sticker creator',
  ],
  authors: [{ name: 'Sticker Studio' }],
  creator: 'Sticker Studio',
  publisher: 'Sticker Studio',
  applicationName: 'Sticker Studio',
  category: 'Design Tools',
  classification: 'Graphics & Design',

  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: BASE_URL,
    siteName: 'Sticker Studio',
    title: 'Sticker Studio — Free AI Sticker Maker & Photo Editor',
    description: 'Create custom stickers, photo strips, collages and 3D avatars with AI-powered tools. Free, no sign-up.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Sticker Studio — AI-Powered Sticker Maker',
        type: 'image/png',
      },
    ],
  },

  twitter: {
    card: 'summary_large_image',
    title: 'Sticker Studio — Free AI Sticker Maker',
    description: 'Create custom stickers, photo strips, collages and 3D avatars. Free & instant.',
    images: ['/og-image.png'],
    creator: '@stickerstudio',
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },

  alternates: {
    canonical: BASE_URL,
  },

  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'Sticker Studio',
  url: BASE_URL,
  description: 'Free AI-powered sticker maker. Create custom stickers, photo strips, collages and 3D avatars online.',
  applicationCategory: 'DesignApplication',
  operatingSystem: 'Any',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
  },
  featureList: [
    'AI Background Removal',
    'Sticker Pack Generator',
    'Photo Strip / Photobooth',
    'Collage Maker',
    '3D Avatar Creator',
    'Image Filters & Frames',
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        {/* MindAR requires import map for CDN loading — must be static in head before any module scripts */}
        <script
          type="importmap"
          dangerouslySetInnerHTML={{ __html: JSON.stringify({
            imports: {
              'three': 'https://cdn.jsdelivr.net/npm/three@0.153.0/build/three.module.js',
              'three/addons/': 'https://cdn.jsdelivr.net/npm/three@0.153.0/examples/jsm/',
              'mindar-face-three': 'https://cdn.jsdelivr.net/npm/mind-ar@1.2.5/dist/mindar-face-three.prod.js',
            }
          })}}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body
        className={`${outfit.variable} ${dmSans.variable} font-[var(--font-body)] antialiased`}
        suppressHydrationWarning
      >
        <ThemeProvider>
          <ToastProvider>
            {children}
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
