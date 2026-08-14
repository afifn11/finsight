import type { NextConfig } from 'next'

// P0.2: Sebelumnya tidak ada header keamanan sama sekali (CSP, HSTS,
// X-Frame-Options, dll). CSP di bawah masih pakai 'unsafe-inline' untuk
// script/style karena next/script strategy="afterInteractive" & CSS-in-JS
// Tailwind belum pakai nonce dynamic — itu next step (butuh middleware
// yang inject header x-nonce per-request + baca lewat headers() di layout).
const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https://lh3.googleusercontent.com https://*.supabase.co",
      "font-src 'self' data:",
      "connect-src 'self' https://generativelanguage.googleapis.com https://*.supabase.co",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "object-src 'none'",
    ].join('; '),
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=()',
  },
]

const nextConfig: NextConfig = {
  // Next.js 16: typedRoutes sudah stable (tidak lagi experimental)
  // React Compiler sudah stable di Next.js 16
  reactCompiler: false, // Enable when ready: set to true untuk auto-memoization

  async headers() {
    return [
      {
        // Berlaku untuk semua route
        source: '/:path*',
        headers: securityHeaders,
      },
      {
        source: '/sw.js',
        headers: [
          { key: 'Content-Type', value: 'application/javascript' },
          { key: 'Service-Worker-Allowed', value: '/' },
          { key: 'Cache-Control', value: 'no-cache' },
        ],
      },
    ]
  },

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com', // Google OAuth avatars
      },
      {
        protocol: 'https',
        hostname: '*.supabase.co', // Supabase storage
      },
    ],
  },
}

export default nextConfig