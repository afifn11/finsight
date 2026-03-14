// components/shared/ErrorBoundary.tsx
'use client'

import { Component, type ReactNode } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  override componentDidCatch(error: Error, info: { componentStack: string }) {
    console.error('[ErrorBoundary]', error, info.componentStack)
  }

  override render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback

      return (
        <div
          className="flex flex-col items-center justify-center py-16 px-4 text-center rounded-xl border"
          style={{ background: 'var(--bg-card)', borderColor: 'var(--border-default)' }}
        >
          <div
            className="flex items-center justify-center w-12 h-12 rounded-full mb-4"
            style={{ background: 'var(--color-danger-500)' + '22' }}
          >
            <AlertTriangle className="w-6 h-6" style={{ color: 'var(--color-danger-500)' }} />
          </div>
          <p className="font-semibold text-base mb-1" style={{ color: 'var(--text-primary)' }}>
            Terjadi kesalahan
          </p>
          <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
            Komponen ini gagal dimuat. Coba muat ulang halaman.
          </p>
          <button
            onClick={() => this.setState({ hasError: false })}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white"
            style={{ background: 'var(--color-primary-800)' }}
          >
            <RefreshCw className="w-4 h-4" />
            Coba lagi
          </button>
        </div>
      )
    }

    return this.props.children
  }
}