// app/(dashboard)/analytics/page.tsx
import type { Metadata } from 'next'
import { AnalyticsView } from '@/components/dashboard/AnalyticsView'

export const metadata: Metadata = { title: 'Analitik' }

export default function AnalyticsPage() {
  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>
          Analitik
        </h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
          Analisis mendalam pola keuanganmu
        </p>
      </div>
      <AnalyticsView />
    </div>
  )
}
