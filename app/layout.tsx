// app/layout.tsx
import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import Script from 'next/script'
import './globals.css'
import { Providers } from '@/components/shared/Providers'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: {
    default: 'FinSight — Personal Finance Dashboard',
    template: '%s | FinSight',
  },
  description:
    'Kelola keuangan pribadi dengan dashboard analytics, budget management, dan AI-powered spending insights.',
  keywords: ['finance', 'dashboard', 'budget', 'analytics', 'keuangan pribadi'],
  authors: [{ name: 'Muhammad Afif Naufal' }],
  creator: 'Muhammad Afif Naufal',
  openGraph: {
    type: 'website',
    locale: 'id_ID',
    url: 'https://finsight.vercel.app',
    title: 'FinSight — Personal Finance Dashboard',
    description: 'Kelola keuangan pribadi dengan AI-powered insights',
    siteName: 'FinSight',
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0f172a' },
  ],
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>{children}</Providers>
        <Script
          id="sw-register"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').catch(function() {});
                });
              }
            `,
          }}
        />
      </body>
    </html>
  )
}