// app/(dashboard)/page.tsx
import type { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { BentoGrid, BentoCard } from '@/components/dashboard/BentoGrid'
import { DashboardHeader } from '@/components/dashboard/DashboardHeader'
import { NetWorthCard } from '@/components/dashboard/NetWorthCard'
import { SummaryCards } from '@/components/dashboard/SummaryCards'
import { TrendChart } from '@/components/dashboard/TrendChart'
import { CategoryPieChart } from '@/components/dashboard/CategoryPieChart'
import { BudgetOverview } from '@/components/dashboard/BudgetOverview'
import { RecentTransactions } from '@/components/dashboard/RecentTransactions'
import { AiInsightCard } from '@/components/dashboard/AiInsightCard'
import { SubscriptionWidget } from '@/components/subscriptions/SubscriptionWidget'
import { AiCopilotDrawer } from '@/components/ai/AiCopilotDrawer'

export const metadata: Metadata = {
  title: 'Dashboard',
}

// Force dynamic to always get fresh data
export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  const firstName = session?.user?.name?.split(' ')[0]

  return (
    <div className="max-w-7xl mx-auto space-y-4 md:space-y-6">
      <BentoGrid>
        {/* Tile 1: Top Hero Greeting & Quick Action CTA Banner (Span 4) */}
        <BentoCard colSpan={4} className="p-0 border-0 bg-transparent shadow-none">
          <DashboardHeader name={firstName} />
        </BentoCard>

        {/* Tile 2: Multi-Wallet Net Worth Tracker (Span 4) */}
        <BentoCard colSpan={4} className="p-0 border-0 bg-transparent shadow-none">
          <NetWorthCard />
        </BentoCard>

        {/* Tile 3: Summary KPI Cards with AnimatedNumber (Span 4) */}
        <BentoCard colSpan={4} className="p-0 border-0 bg-transparent shadow-none">
          <SummaryCards />
        </BentoCard>

        {/* Tile 3: Trend Chart (Span 2x2) */}
        <BentoCard colSpan={2} rowSpan={2} className="p-0 border-0 bg-transparent shadow-none">
          <TrendChart />
        </BentoCard>

        {/* Tile 4: AI Financial Insight (Span 2x2) */}
        <BentoCard colSpan={2} rowSpan={2} className="p-0 border-0 bg-transparent shadow-none">
          <AiInsightCard />
        </BentoCard>

        {/* Tile 5: Category Breakdown Pie Chart (Span 2x2) */}
        <BentoCard colSpan={2} rowSpan={2} className="p-0 border-0 bg-transparent shadow-none">
          <CategoryPieChart />
        </BentoCard>

        {/* Tile 6: Budget Status Overview (Span 2x2) */}
        <BentoCard colSpan={2} rowSpan={2} className="p-0 border-0 bg-transparent shadow-none">
          <BudgetOverview />
        </BentoCard>

        {/* Tile 7: Smart Subscription & Recurring Bills Tracker (Span 2x2) */}
        <BentoCard colSpan={2} rowSpan={2} className="p-0 border-0 bg-transparent shadow-none">
          <SubscriptionWidget />
        </BentoCard>

        {/* Tile 8: Recent Transactions Stream (Span 4) */}
        <BentoCard colSpan={4} className="p-0 border-0 bg-transparent shadow-none">
          <RecentTransactions />
        </BentoCard>
      </BentoGrid>

      {/* Interactive AI Financial Copilot Chatbot Drawer */}
      <AiCopilotDrawer />
    </div>
  )
}
