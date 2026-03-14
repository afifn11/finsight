// app/not-found.tsx
import Link from 'next/link'
import { Home, SearchX } from 'lucide-react'

export default function NotFound() {
  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'var(--bg-page)' }}
    >
      <div className="w-full max-w-md text-center space-y-6">
        {/* Illustration */}
        <div className="flex justify-center">
          <div
            className="flex items-center justify-center w-16 h-16 rounded-2xl"
            style={{ background: '#0F4C7522' }}
          >
            <SearchX className="w-8 h-8" style={{ color: '#0F4C75' }} />
          </div>
        </div>

        {/* Number */}
        <div>
          <p
            className="text-7xl font-bold leading-none mb-2"
            style={{ color: '#0F4C75' }}
          >
            404
          </p>
          <h1
            className="text-xl font-semibold mb-2"
            style={{ color: 'var(--text-primary)' }}
          >
            Halaman tidak ditemukan
          </h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Halaman yang kamu cari tidak ada atau sudah dipindahkan.
          </p>
        </div>

        <Link
          href="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium text-white"
          style={{ background: '#0F4C75' }}
        >
          <Home className="w-4 h-4" />
          Kembali ke Dashboard
        </Link>
      </div>
    </div>
  )
}