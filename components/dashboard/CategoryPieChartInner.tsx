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
      <div className="card p-5">
        <DataError message={error} onRetry={refresh} />
      </div>
    )
  }

  const breakdown = data?.categoryBreakdown ?? []

  if (breakdown.length === 0) {
    return (
      <div className="card p-5 flex flex-col items-center justify-center h-64">
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          Belum ada data pengeluaran bulan ini
        </p>
      </div>
    )
  }

  return (
    <div className="card p-5">
      <div className="mb-5">
        <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
          Pengeluaran per Kategori
        </h3>
        <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
          Distribusi bulan ini
        </p>
      </div>

      <ResponsiveContainer width="100%" height={224}>
        <PieChart>
          <Pie
            data={breakdown}
            cx="50%"
            cy="50%"
            innerRadius={56}
            outerRadius={88}
            paddingAngle={3}
            dataKey="total"
            nameKey="categoryName"
          >
            {breakdown.map((entry) => (
              <Cell key={entry.categoryId} fill={entry.categoryColor} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: unknown) => [formatCurrencyShort(value as number), '']}
            contentStyle={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-default)',
              borderRadius: '8px',
              fontSize: '12px',
            }}
          />
          <Legend
            formatter={(value: string) => (
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{value}</span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}