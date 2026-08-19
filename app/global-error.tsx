// app/global-error.tsx
// Fallback ONLY for when the root layout itself (app/layout.tsx) throws — e.g. a
// provider crashing during render. This is the one place `<html>`/`<body>` belongs,
// since it replaces the entire root layout output. Route-level errors are handled
// by app/error.tsx instead, which renders inside the normal layout.
// Deliberately not styled with design tokens: if the root layout crashed, the CSS
// variables it defines may not be available either — this stays plain and simple.
'use client'

import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[GlobalError — root layout crashed]', error)
  }, [error])

  return (
    <html lang="id">
      <body style={{ fontFamily: 'system-ui, sans-serif', background: '#f8fafc' }}>
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem',
        }}>
          <div style={{ textAlign: 'center', maxWidth: '28rem' }}>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '0.5rem', color: '#0f172a' }}>
              FinSight tidak bisa dimuat
            </h1>
            <p style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '1.5rem' }}>
              Terjadi kesalahan serius saat memuat aplikasi. Coba muat ulang halaman.
            </p>
            {error.digest && (
              <p style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: '#94a3b8', marginBottom: '1.5rem' }}>
                Error ID: {error.digest}
              </p>
            )}
            <button
              onClick={reset}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: 500,
                color: '#fff',
                background: '#155e75',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Muat ulang
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}
