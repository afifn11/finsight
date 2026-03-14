// components/dashboard/AnalyticsView.tsx
'use client'

import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, Cell,
} from 'recharts'
import { useDashboard } from '@/hooks'
import { formatCurrencyShort, formatCurrency, formatPercentage } from '@/lib/utils'

function BarChartSkeleton() {
  return (
    <div className="card p-5 animate-pulse">
      <div className="h-5 w-44 rounded mb-4" style={{ background: 'var(--bg-muted)' }} />
      <div className="h-64 rounded" style={{ background: 'var(--bg-muted)' }} />
    </div>
  )
}

export function AnalyticsView() {
  const { data, isLoading } = useDashboard()

  if (isLoading) {
    return (
      <div className="space-y-6">
        <BarChartSkeleton />
        <BarChartSkeleton />
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
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={trend} margin={{ top: 4, right: 4, left: 0, bottom: 0 }} barGap={4}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="var(--border-default)"
              vertical={false}
            />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 12, fill: 'var(--text-muted)' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tickFormatter={(v: number) => formatCurrencyShort(v)}
              tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
              axisLine={false}
              tickLine={false}
              width={70}
            />
            <Tooltip
              formatter={(v: number, name: string) => [formatCurrencyShort(v), name]}
              contentStyle={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-default)',
                borderRadius: '8px',
                fontSize: '12px',
              }}
            />
            <Legend
              wrapperStyle={{ fontSize: '12px', paddingTop: '12px' }}
              formatter={(v: string) => (
                <span style={{ color: 'var(--text-secondary)' }}>{v}</span>
              )}
            />
            <Bar dataKey="income" name="Pemasukan" fill="var(--color-success-500)" radius={[4, 4, 0, 0]} />
            <Bar dataKey="expense" name="Pengeluaran" fill="var(--color-danger-500)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Category breakdown table */}
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

            {/* Total row */}
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
