// app/offline/page.tsx
export default function OfflinePage() {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-6"
      style={{ background: 'var(--bg-page)' }}
    >
      <div className="text-center max-w-xs">
        <div
          className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6"
          style={{ background: 'var(--color-primary-800)' }}
        >
          <svg width="36" height="36" viewBox="0 0 20 20" fill="none">
            <rect x="3" y="2.5" width="4" height="15" rx="1.5" fill="white"/>
            <rect x="3" y="2.5" width="13" height="4" rx="1.5" fill="white"/>
            <rect x="3" y="8.5" width="10" height="4" rx="1.5" fill="white"/>
            <circle cx="17" cy="17" r="2.8" fill="#4ade80"/>
          </svg>
        </div>

        <h1 className="text-xl font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
          Tidak ada koneksi
        </h1>
        <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
          FinSight membutuhkan internet untuk memuat data keuangan terbaru.
        </p>

        <button
          onClick={() => window.location.reload()}
          className="px-5 py-2.5 rounded-xl text-sm font-medium text-white"
          style={{ background: 'var(--color-primary-800)' }}
        >
          Coba lagi
        </button>
      </div>
    </div>
  )
}