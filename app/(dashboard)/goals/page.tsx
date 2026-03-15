// app/(dashboard)/goals/page.tsx
import type { Metadata } from 'next'
import { GoalsManager } from '@/components/goals/GoalsManager'

export const metadata: Metadata = { title: 'Financial Goals' }

export default function GoalsPage() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>
          Financial Goals
        </h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
          Tetapkan target keuangan dan pantau progress tabunganmu
        </p>
      </div>
      <GoalsManager />
    </div>
  )
}