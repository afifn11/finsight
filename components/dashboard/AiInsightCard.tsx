// components/dashboard/AiInsightCard.tsx
'use client'

import { Sparkles, Info, AlertTriangle, Lightbulb, Trophy, RefreshCw } from 'lucide-react'
import { useAiInsight } from '@/hooks'
import { IconButton } from '@/components/ui/IconButton'
import type { InsightType } from '@/types'

const INSIGHT_STYLES: Record<InsightType, { icon: React.ElementType; color: string; bg: string; badge: string }> = {
  info:        { icon: Info,          color: 'var(--color-primary-600)',  bg: 'var(--color-primary-50)', badge: 'Info' },
  warning:     { icon: AlertTriangle, color: 'var(--color-warning-600)',  bg: 'var(--color-warning-50)', badge: 'Perhatian' },
  tip:         { icon: Lightbulb,     color: 'var(--color-success-600)',  bg: 'var(--color-success-50)', badge: 'Tips' },
  achievement: { icon: Trophy,        color: 'var(--color-ai-accent-600)', bg: 'var(--color-ai-accent-50)', badge: 'Prestasi' },
}

export function AiInsightCard() {
  const { data, isLoading, error, refresh } = useAiInsight()

  return (
    <div className="glass-card interactive-card glow-accent p-5 rounded-2xl h-full flex flex-col justify-between">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div
              className="flex items-center justify-center w-7 h-7 rounded-xl shadow-sm"
              style={{ background: 'linear-gradient(135deg, var(--color-ai-accent-start), var(--color-ai-accent-end))' }}
            >
              <Sparkles className="w-3.5 h-3.5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                AI Financial Insight
              </h3>
            </div>
          </div>
          <IconButton
            onClick={refresh}
            disabled={isLoading}
            aria-label="Refresh insight"
            title="Refresh insight"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} aria-hidden="true" />
          </IconButton>
        </div>

        {/* Content */}
        <div className="space-y-3">
          {isLoading ? (
            <div className="space-y-3 animate-pulse">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex gap-3">
                  <div className="w-8 h-8 rounded-xl shrink-0" style={{ background: 'var(--bg-muted)' }} />
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
                className="mt-2 text-sm font-medium hover:underline"
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
                <div
                  key={i}
                  className="flex gap-3 p-2.5 rounded-xl transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                >
                  <div
                    className="flex items-center justify-center w-8 h-8 rounded-xl shrink-0 mt-0.5 shadow-xs"
                    style={{ background: style.bg }}
                  >
                    <Icon className="w-4 h-4" style={{ color: style.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-sm font-semibold leading-snug truncate" style={{ color: 'var(--text-primary)' }}>
                        {insight.title}
                      </p>
                      <span
                        className="text-[10px] font-medium px-1.5 py-0.5 rounded-md"
                        style={{ background: style.bg, color: style.color }}
                      >
                        {style.badge}
                      </span>
                    </div>
                    <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                      {insight.description}
                    </p>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      {data && (
        <p className="text-[11px] mt-4 pt-3 border-t" style={{
          color: 'var(--text-muted)',
          borderColor: 'var(--border-default)',
        }}>
          Diperbarui bulanan oleh AI · Berdasarkan data transaksi
        </p>
      )}
    </div>
  )
}
