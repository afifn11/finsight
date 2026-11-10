// components/dashboard/CategoryPieChartInner.tsx
'use client'

import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts'
import { useDashboard } from '@/hooks'
import { formatCurrencyShort } from '@/lib/utils'
import { ChartSkeleton } from './ChartSkeleton'
import { DataError } from '@/components/ui/DataError'

export default function CategoryPieChartInner() {
  const { data, isLoading, error, refresh } = useDashboard()

  if (isLoading) return <ChartSkeleton height={224} titleWidth={144} />

  if (error) {
    return (
      <div className="glass-card p-5 rounded-2xl">
        <DataError message={error} onRetry={refresh} />
      </div>
    )
  }

  const breakdown = data?.categoryBreakdown ?? []

  if (breakdown.length === 0) {
    return (
      <div className="glass-card p-5 rounded-2xl flex flex-col items-center justify-center h-64 text-center">
        <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
          Belum ada data pengeluaran bulan ini
        </p>
      </div>
    )
  }

  return (
    <div className="glass-card interactive-card p-5 rounded-2xl h-full flex flex-col justify-between">
      <div className="mb-4">
        <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
          Pengeluaran per Kategori
        </h3>
        <p className="text-xs sm:text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
          Distribusi alokasi dana bulan ini
        </p>
      </div>

      <ResponsiveContainer width="100%" height={230}>
        <PieChart>
          <Pie
            data={breakdown}
            cx="50%"
            cy="50%"
            innerRadius={58}
            outerRadius={90}
            paddingAngle={4}
            dataKey="total"
            nameKey="categoryName"
          >
            {breakdown.map((entry) => (
              <Cell
                key={entry.categoryId}
                fill={entry.categoryColor}
                stroke="var(--bg-card)"
                strokeWidth={2}
                className="transition-transform duration-200 hover:opacity-90"
              />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: unknown) => [formatCurrencyShort(value as number), '']}
            contentStyle={{
              background: 'color-mix(in srgb, var(--bg-card) 85%, transparent)',
              backdropFilter: 'blur(10px)',
              border: '1px solid var(--border-default)',
              borderRadius: '12px',
              fontSize: '12px',
              boxShadow: '0 8px 20px -4px rgb(0 0 0 / 0.15)',
              color: 'var(--text-primary)',
            }}
          />
          <Legend
            wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }}
            formatter={(value: string) => (
              <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>{value}</span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
