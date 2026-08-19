// components/ui/DataError.tsx
// Shared inline error state for data-fetch failures. Distinct from loading
// (skeleton) and empty (no data yet) states — surfaces an actual failure with
// a retry action, instead of silently falling through to an empty-state message
// that would misleadingly tell the user "you have no data" when the real
// problem is the request failed.
import { AlertCircle, RefreshCw } from 'lucide-react'

export function DataError({ message, onRetry }: { message?: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
      <AlertCircle className="w-5 h-5" style={{ color: 'var(--color-danger-text)' }} aria-hidden="true" />
      <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
        {message ?? 'Gagal memuat data'}
      </p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="flex items-center gap-1.5 text-xs font-medium mt-1"
          style={{ color: 'var(--color-primary-600)' }}
        >
          <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
          Coba lagi
        </button>
      )}
    </div>
  )
}
