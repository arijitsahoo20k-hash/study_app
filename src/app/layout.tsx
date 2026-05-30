import type { Metadata, Viewport } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import '@/styles/globals.css'
import { Providers } from '@/components/layout/Providers'

export const metadata: Metadata = {
  title: {
    default: 'Study OS',
    template: '%s | Study OS',
  },
  description: 'Your intelligent study operating system. Track progress, manage tasks, and achieve your goals.',
  keywords: ['study', 'productivity', 'pomodoro', 'notes', 'analytics'],
  authors: [{ name: 'Study OS' }],
  creator: 'Study OS',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Study OS',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    title: 'Study OS',
    description: 'Your intelligent study operating system.',
    siteName: 'Study OS',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Study OS',
    description: 'Your intelligent study operating system.',
  },
  icons: {
    icon: [
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/icons/apple-touch-icon.png' }],
  },
}

export const viewport: Viewport = {
  themeColor: '#050816',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`} suppressHydrationWarning>
      <body className={GeistSans.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
