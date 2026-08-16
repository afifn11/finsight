// components/dashboard/CategoryPieChart.tsx
'use client'

import dynamic from 'next/dynamic'
import { ChartSkeleton } from './ChartSkeleton'

// P2: recharts di-load hanya saat komponen ini benar-benar dirender di
// client (ssr: false) — mengeluarkan ~100-150KB recharts dari initial
// bundle, dan menghindari hydration mismatch karena ResponsiveContainer
// butuh ukuran DOM asli yang tidak tersedia saat SSR.
const CategoryPieChartInner = dynamic(() => import('./CategoryPieChartInner'), {
  ssr: false,
  loading: () => <ChartSkeleton height={224} titleWidth={144} />,
})

export function CategoryPieChart() {
  return <CategoryPieChartInner />
}