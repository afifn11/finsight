// components/dashboard/AnalyticsView.tsx
'use client'

import { useDashboard } from '@/hooks'
import { formatCurrencyShort, formatCurrency, formatPercentage } from '@/lib/utils'
import { MonthlyBarChart } from './MonthlyBarChart'
import { ChartSkeleton } from './ChartSkeleton'

export function AnalyticsView() {
  const { data, isLoading } = useDashboard()

  if (isLoading) {
    return (
      <div className="space-y-6">
        <ChartSkeleton height={260} titleWidth={176} />
        <ChartSkeleton height={260} titleWidth={176} />
      </div>
    )
  }

  const trend = data?.monthlyTrend ?? []
  const breakdown = data?.categoryBreakdown ?? []

  return (
    <div className="space-y-6">
      {/* Bar chart — monthly comparison */}
      <div className="card p-5">
        <div className="mb-5">
          <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
            Perbandingan Bulanan
          </h3>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
            Income vs Pengeluaran 6 bulan terakhir
          </p>
        </div>
        <MonthlyBarChart trend={trend} />
      </div>

      {/* Category breakdown table — tidak pakai recharts, tetap SSR langsung */}
      <div className="card p-5">
        <div className="mb-5">
          <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
            Breakdown Pengeluaran Bulan Ini
          </h3>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
            Per kategori dengan persentase dari total
          </p>
        </div>

        {breakdown.length === 0 ? (
          <p className="text-sm text-center py-8" style={{ color: 'var(--text-muted)' }}>
            Belum ada data pengeluaran bulan ini
          </p>
        ) : (
          <div className="space-y-3">
            {breakdown.map((cat) => (
              <div key={cat.categoryId}>
                <div className="flex items-center justify-between text-sm mb-1.5">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ background: cat.categoryColor }}
                    />
                    <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
                      {cat.categoryName}
                    </span>
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      ({cat.transactionCount}x)
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span style={{ color: 'var(--text-secondary)' }}>
                      {formatCurrencyShort(cat.total)}
                    </span>
                    <span
                      className="text-xs font-medium w-10 text-right"
                      style={{ color: cat.categoryColor }}
                    >
                      {formatPercentage(cat.percentage)}
                    </span>
                  </div>
                </div>
                <div
                  className="w-full h-1.5 rounded-full overflow-hidden"
                  style={{ background: 'var(--bg-muted)' }}
                >
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${cat.percentage}%`, background: cat.categoryColor }}
                  />
                </div>
              </div>
            ))}

            <div
              className="flex items-center justify-between pt-3 mt-1 border-t text-sm font-semibold"
              style={{ borderColor: 'var(--border-default)', color: 'var(--text-primary)' }}
            >
              <span>Total Pengeluaran</span>
              <span style={{ color: 'var(--color-danger-500)' }}>
                {formatCurrency(breakdown.reduce((s, c) => s + c.total, 0))}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}