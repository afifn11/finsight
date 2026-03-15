import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Next.js 16: typedRoutes is now stable (no longer experimental)
  // React Compiler is stable in Next.js 16
  reactCompiler: false, // Enable when ready: set to true for auto-memoization

  async headers() {
    return [
      {
        source: '/site.webmanifest',
        headers: [
          { key: 'Content-Type', value: 'application/manifest+json' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
        ],
      },
      {
        source: '/sw.js',
        headers: [
          { key: 'Content-Type', value: 'application/javascript' },
          { key: 'Service-Worker-Allowed', value: '/' },
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