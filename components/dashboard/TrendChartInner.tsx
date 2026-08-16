// components/dashboard/TrendChartInner.tsx
'use client'

import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend,
} from 'recharts'
import { useDashboard } from '@/hooks'
import { formatCurrencyShort } from '@/lib/utils'
import { ChartSkeleton } from './ChartSkeleton'

interface TooltipProps {
  active?: boolean
  payload?: Array<{ name: string; value: number; color: string }>
  label?: string
}

function CustomTooltip({ active, payload, label }: TooltipProps) {
  if (!active || !payload?.length) return null
  return (
    <div
      className="rounded-lg border p-3 shadow-lg text-sm space-y-1"
      style={{ background: 'var(--bg-card)', borderColor: 'var(--border-default)' }}
    >
      <p className="font-medium mb-2" style={{ color: 'var(--text-primary)' }}>{label}</p>
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full shrink-0" style={{ background: entry.color }} />
          <span style={{ color: 'var(--text-secondary)' }}>{entry.name}:</span>
          <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
            {formatCurrencyShort(entry.value)}
          </span>
        </div>
      ))}
    </div>
  )
}

export default function TrendChartInner() {
  const { data, isLoading } = useDashboard()

  if (isLoading) return <ChartSkeleton height={224} titleWidth={160} />

  const chartData = data?.monthlyTrend ?? []

  return (
    <div className="card p-5">
      <div className="mb-5">
        <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
          Tren Keuangan
        </h3>
        <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
          Pemasukan vs pengeluaran 6 bulan terakhir
        </p>
      </div>

      <ResponsiveContainer width="100%" height={224}>
        <LineChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-default)" vertical={false} />
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
            wrapperStyle={{ fontSize: '12px', paddingTop: '12px' }}
            formatter={(value: string) => (
              <span style={{ color: 'var(--text-secondary)' }}>{value}</span>
            )}
          />
          <Line
            type="monotone"
            dataKey="income"
            name="Pemasukan"
            stroke="var(--color-success-500)"
            strokeWidth={2}
            dot={{ fill: 'var(--color-success-500)', r: 3 }}
            activeDot={{ r: 5 }}
          />
          <Line
            type="monotone"
            dataKey="expense"
            name="Pengeluaran"
            stroke="var(--color-danger-500)"
            strokeWidth={2}
            dot={{ fill: 'var(--color-danger-500)', r: 3 }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}