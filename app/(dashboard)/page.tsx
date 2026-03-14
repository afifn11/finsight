// app/(dashboard)/page.tsx
import type { Metadata } from 'next'
import { SummaryCards } from '@/components/dashboard/SummaryCards'
import { TrendChart } from '@/components/dashboard/TrendChart'
import { CategoryPieChart } from '@/components/dashboard/CategoryPieChart'
import { BudgetOverview } from '@/components/dashboard/BudgetOverview'
import { RecentTransactions } from '@/components/dashboard/RecentTransactions'
import { AiInsightCard } from '@/components/dashboard/AiInsightCard'

export const metadata: Metadata = {
  title: 'Dashboard',
}

// Force dynamic to always get fresh data
export const dynamic = 'force-dynamic'

export default function DashboardPage() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page title */}
      <div>
        <h1 className="text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>
          Dashboard
        </h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
          Ringkasan keuangan kamu bulan ini
        </p>
      </div>

      {/* Row 1: Summary cards */}
      <SummaryCards />

      {/* Row 2: Trend chart + AI Insight */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <TrendChart />
        </div>
        <div className="lg:col-span-1">
          <AiInsightCard />
        </div>
      </div>

      {/* Row 3: Category pie + Budget overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CategoryPieChart />
        <BudgetOverview />
      </div>

      {/* Row 4: Recent transactions */}
      <RecentTransactions />
    </div>
  )
}
