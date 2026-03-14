// app/(dashboard)/budgets/page.tsx
import type { Metadata } from 'next'
import { BudgetManager } from '@/components/budgets/BudgetManager'

export const metadata: Metadata = { title: 'Budget' }

export default function BudgetsPage() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>
          Budget
        </h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
          Tetapkan batas pengeluaran per kategori dan pantau progresnya
        </p>
      </div>
      <BudgetManager />
    </div>
  )
}
