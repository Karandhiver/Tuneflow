import type { Metadata, Viewport } from 'next'
import './globals.css'
import { Sidebar } from '@/components/layout/Sidebar'
import { MiniPlayer } from '@/components/player/MiniPlayer'
import { FullscreenPlayer } from '@/components/player/FullscreenPlayer'
import { AudioEngine } from '@/components/player/AudioEngine'
import { ToastContainer } from '@/components/ui/Toast'
import { KeyboardShortcutsProvider } from '@/components/providers/KeyboardShortcutsProvider'
import { ServiceWorkerRegistration } from '@/components/providers/ServiceWorkerRegistration'
import { NetworkStatusProvider } from '@/components/providers/NetworkStatusProvider'

export const metadata: Metadata = {
  title: { default: 'Wave Music', template: '%s | Wave' },
  description: 'Your personal music & podcast streaming app powered by YouTube',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Wave',
  },
  icons: { icon: '/icon.svg', apple: '/icon.svg' },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#000000',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Wave" />
      </head>
      <body className="bg-black text-white font-sans overflow-hidden h-screen">
        {/* Client-only providers */}
        <ServiceWorkerRegistration />
        <KeyboardShortcutsProvider />
        <NetworkStatusProvider />
        <AudioEngine />
        <ToastContainer />

        <div className="flex h-full">
          {/* Sidebar (desktop) / bottom nav (mobile) */}
          <Sidebar />

          {/* Scrollable main content */}
          <main
            className="flex-1 overflow-y-auto scroll-momentum"
            style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 160px)' }}
          >
            {children}
          </main>
        </div>

        {/* Global player UI */}
        <MiniPlayer />
        <FullscreenPlayer />
      </body>
    </html>
  )
}
