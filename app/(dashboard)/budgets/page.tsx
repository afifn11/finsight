// app/(dashboard)/budgets/page.tsx
import type { Metadata } from 'next'
import { BudgetManager } from '@/components/budgets/BudgetManager'
import { SubscriptionWidget } from '@/components/subscriptions/SubscriptionWidget'

export const metadata: Metadata = { title: 'Budget & Komitmen Rutin' }

export default function BudgetsPage() {
  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Page Header */}
      <div className="p-5 md:p-6 rounded-2xl glass-card">
        <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-slate-100">
          Budget & Komitmen Rutin
        </h1>
        <p className="text-xs sm:text-sm mt-0.5 text-slate-500 dark:text-slate-400">
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
