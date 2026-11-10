// components/dashboard/TrendChartInner.tsx
'use client'

import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend,
} from 'recharts'
import { useDashboard } from '@/hooks'
import { formatCurrencyShort } from '@/lib/utils'
import { ChartSkeleton } from './ChartSkeleton'
import { DataError } from '@/components/ui/DataError'

interface TooltipProps {
  active?: boolean
  payload?: Array<{ name: string; value: number; color: string }>
  label?: string
}

function CustomTooltip({ active, payload, label }: TooltipProps) {
  if (!active || !payload?.length) return null
  return (
    <div className="glass-card px-3.5 py-2.5 text-xs shadow-xl space-y-1.5 border border-cyan-500/20">
      <p className="font-semibold text-xs border-b pb-1" style={{ color: 'var(--text-primary)', borderColor: 'var(--border-default)' }}>
        {label}
      </p>
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full shrink-0 shadow-sm" style={{ background: entry.color }} />
            <span style={{ color: 'var(--text-secondary)' }}>{entry.name}</span>
          </div>
          <span className="font-semibold tabular-nums" style={{ color: 'var(--text-primary)' }}>
            {formatCurrencyShort(entry.value)}
          </span>
        </div>
      ))}
    </div>
  )
}

export default function TrendChartInner() {
  const { data, isLoading, error, refresh } = useDashboard()

  if (isLoading) return <ChartSkeleton height={224} titleWidth={160} />

  if (error) {
    return (
      <div className="glass-card p-5 rounded-2xl">
        <DataError message={error} onRetry={refresh} />
      </div>
    )
  }

  const chartData = data?.monthlyTrend ?? []

  return (
    <div className="glass-card interactive-card p-5 rounded-2xl h-full flex flex-col justify-between">
      <div className="mb-4">
        <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
          Tren Keuangan
        </h3>
        <p className="text-xs sm:text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
          Pemasukan vs pengeluaran 6 bulan terakhir
        </p>
      </div>

      <ResponsiveContainer width="100%" height={230}>
        <LineChart data={chartData} margin={{ top: 6, right: 8, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-default)" strokeOpacity={0.6} vertical={false} />
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
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
            formatter={(value: string) => (
              <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>{value}</span>
            )}
          />
          <Line
            type="monotone"
            dataKey="income"
            name="Pemasukan"
            stroke="var(--color-success-500)"
            strokeWidth={2.5}
            dot={{ fill: 'var(--color-success-500)', r: 3.5, strokeWidth: 0 }}
            activeDot={{ r: 6, stroke: 'var(--bg-card)', strokeWidth: 2 }}
          />
          <Line
            type="monotone"
            dataKey="expense"
            name="Pengeluaran"
            stroke="var(--color-danger-500)"
            strokeWidth={2.5}
            dot={{ fill: 'var(--color-danger-500)', r: 3.5, strokeWidth: 0 }}
            activeDot={{ r: 6, stroke: 'var(--bg-card)', strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
