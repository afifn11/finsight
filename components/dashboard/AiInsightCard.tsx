// components/dashboard/AiInsightCard.tsx
'use client'

import { Sparkles, Info, AlertTriangle, Lightbulb, Trophy, RefreshCw } from 'lucide-react'
import { useAiInsight } from '@/hooks'
import type { InsightType } from '@/types'

const INSIGHT_STYLES: Record<InsightType, { icon: React.ElementType; color: string; bg: string }> = {
  info:        { icon: Info,          color: 'var(--color-primary-600)',  bg: 'var(--color-primary-50)' },
  warning:     { icon: AlertTriangle, color: 'var(--color-warning-600)',  bg: 'var(--color-warning-50)' },
  tip:         { icon: Lightbulb,     color: 'var(--color-success-600)',  bg: 'var(--color-success-50)' },
  achievement: { icon: Trophy,        color: '#7c3aed',                   bg: '#f5f3ff' },
}

export function AiInsightCard() {
  const { data, isLoading, error, refresh } = useAiInsight()

  return (
    <div className="card p-5 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div
            className="flex items-center justify-center w-7 h-7 rounded-lg"
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
          >
            <Sparkles className="w-3.5 h-3.5 text-white" />
          </div>
          <h3 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
            AI Insight
          </h3>
        </div>
        <button
          onClick={refresh}
          disabled={isLoading}
          className="p-1.5 rounded-md transition-colors hover:opacity-70 disabled:opacity-40"
          style={{ color: 'var(--text-muted)' }}
          title="Refresh insight"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 space-y-3">
        {isLoading ? (
          <div className="space-y-3 animate-pulse">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex gap-3">
                <div className="w-7 h-7 rounded-lg shrink-0" style={{ background: 'var(--bg-muted)' }} />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3.5 w-3/4 rounded" style={{ background: 'var(--bg-muted)' }} />
                  <div className="h-3 w-full rounded" style={{ background: 'var(--bg-muted)' }} />
                  <div className="h-3 w-2/3 rounded" style={{ background: 'var(--bg-muted)' }} />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Gagal memuat insight
            </p>
            <button
              onClick={refresh}
              className="mt-2 text-sm"
              style={{ color: 'var(--color-primary-600)' }}
            >
              Coba lagi
            </button>
          </div>
        ) : (
          data?.insights.map((insight, i) => {
            const style = INSIGHT_STYLES[insight.type] ?? INSIGHT_STYLES.info
            const Icon = style.icon

            return (
              <div key={i} className="flex gap-3">
                <div
                  className="flex items-center justify-center w-7 h-7 rounded-lg shrink-0 mt-0.5"
                  style={{ background: style.bg }}
                >
                  <Icon className="w-3.5 h-3.5" style={{ color: style.color }} />
                </div>
                <div>
                  <p className="text-sm font-medium leading-snug" style={{ color: 'var(--text-primary)' }}>
                    {insight.title}
                  </p>
                  <p className="text-xs mt-0.5 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                    {insight.description}
                  </p>
                </div>
              </div>
            )
          })
        )}
      </div>

      {data && (
        <p className="text-xs mt-4 pt-3 border-t" style={{
          color: 'var(--text-muted)',
          borderColor: 'var(--border-default)',
        }}>
          Diperbarui sekali per bulan · Berdasarkan data transaksimu
        </p>
      )}
    </div>
  )
}
