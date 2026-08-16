// components/dashboard/MonthlyBarChartInner.tsx
'use client'

import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend,
} from 'recharts'
import { formatCurrencyShort } from '@/lib/utils'
import type { MonthlySummary } from '@/types'

export default function MonthlyBarChartInner({ trend }: { trend: MonthlySummary[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={trend} margin={{ top: 4, right: 4, left: 0, bottom: 0 }} barGap={4}>
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
        <Tooltip
          formatter={(v: unknown, name: unknown) => [formatCurrencyShort(v as number), String(name)]}
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
  )
}