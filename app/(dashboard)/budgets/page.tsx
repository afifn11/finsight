// app/(dashboard)/budgets/page.tsx
import type { Metadata } from 'next'
import { BudgetManager } from '@/components/budgets/BudgetManager'
import { SubscriptionWidget } from '@/components/subscriptions/SubscriptionWidget'

export const metadata: Metadata = { title: 'Budget & Komitmen Rutin' }

export default function BudgetsPage() {
  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Page Header */}
      <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/80 mb-6">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
          Budget & Komitmen Rutin
        </h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
          Tetapkan batas pengeluaran per kategori dan pantau jadwal tagihan berkala
        </p>
      </div>

      {/* 2-Column Responsive Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Category Budgets Manager (Col Span 7) */}
        <div className="lg:col-span-7">
          <BudgetManager />
        </div>

        {/* Right: Subscriptions & Recurring Bills Tracker (Col Span 5) */}
        <div className="lg:col-span-5">
          <SubscriptionWidget />
        </div>
      </div>
    </div>
  )
}
