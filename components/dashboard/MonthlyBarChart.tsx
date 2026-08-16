// components/dashboard/MonthlyBarChart.tsx
'use client'

import dynamic from 'next/dynamic'
import { ChartSkeleton } from './ChartSkeleton'
import type { MonthlySummary } from '@/types'

const MonthlyBarChartInner = dynamic(() => import('./MonthlyBarChartInner'), {
  ssr: false,
  loading: () => <ChartSkeleton height={260} titleWidth={176} />,
})

export function MonthlyBarChart({ trend }: { trend: MonthlySummary[] }) {
  return <MonthlyBarChartInner trend={trend} />
}