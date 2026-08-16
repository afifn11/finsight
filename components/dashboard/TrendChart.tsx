// components/dashboard/TrendChart.tsx
'use client'

import dynamic from 'next/dynamic'
import { ChartSkeleton } from './ChartSkeleton'

const TrendChartInner = dynamic(() => import('./TrendChartInner'), {
  ssr: false,
  loading: () => <ChartSkeleton height={224} titleWidth={160} />,
})

export function TrendChart() {
  return <TrendChartInner />
}