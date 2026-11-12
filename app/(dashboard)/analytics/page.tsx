// app/(dashboard)/analytics/page.tsx
import type { Metadata } from 'next'
import { AnalyticsView } from '@/components/dashboard/AnalyticsView'

export const metadata: Metadata = { title: 'Analitik' }

export default function AnalyticsPage() {
  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/80 mb-6">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
          Analitik
        </h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
          Analisis mendalam pola keuanganmu
        </p>
      </div>
      <AnalyticsView />
    </div>
  )
}
