// app/error.tsx
'use client'

import { useEffect } from 'react'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'
import Link from 'next/link'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[GlobalError]', error)
  }, [error])

  return (
    <html lang="id">
      <body>
        <div
          className="min-h-screen flex items-center justify-center p-4"
          style={{ background: 'var(--bg-page)' }}
        >
          <div className="w-full max-w-md text-center space-y-6">
            <div className="flex justify-center">
              <div
                className="flex items-center justify-center w-16 h-16 rounded-2xl"
                style={{ background: '#ef444422' }}
              >
                <AlertTriangle className="w-8 h-8" style={{ color: '#ef4444' }} />
              </div>
            </div>

            <div>
              <h1
                className="text-2xl font-semibold mb-2"
                style={{ color: 'var(--text-primary)' }}
              >
                Terjadi kesalahan
              </h1>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                Sesuatu yang tidak terduga terjadi. Tim kami sudah diberitahu.
              </p>
              {error.digest && (
                <p className="text-xs mt-2 font-mono" style={{ color: 'var(--text-muted)' }}>
                  Error ID: {error.digest}
                </p>
              )}
            </div>

            <div className="flex items-center justify-center gap-3">
              <button
                onClick={reset}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white"
                style={{ background: '#0F4C75' }}
              >
                <RefreshCw className="w-4 h-4" />
                Coba lagi
              </button>
              <Link
                href="/"
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border"
                style={{ borderColor: '#e2e8f0', color: '#64748b' }}
              >
                <Home className="w-4 h-4" />
                Ke dashboard
              </Link>
            </div>
          </div>
        </div>
      </body>
    </html>
  )
}