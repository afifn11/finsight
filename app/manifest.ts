// app/manifest.ts
import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    scope: '/',
    name: 'FinSight - Personal Finance',
    short_name: 'FinSight',
    description: 'Kelola keuangan pribadi dengan AI-powered insights',
    start_url: '/',
    display: 'standalone',
    orientation: 'portrait-primary',
    categories: ['finance', 'productivity'],
    background_color: '#0F4C75',
    theme_color: '#0F4C75',
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
    ],
  }
}