// components/dashboard/SummaryCards.tsx
'use client'

import { TrendingUp, TrendingDown, Wallet, PiggyBank } from 'lucide-react'
import { useDashboard } from '@/hooks'
import { formatCurrencyShort, formatPercentage, cn } from '@/lib/utils'
import { DataError } from '@/components/ui/DataError'

interface StatCardProps {
  label: string
  value: string
  subtext?: string
  icon: React.ElementType
  iconBg: string
  iconColor: string
  trend?: 'positive' | 'negative' | 'neutral'
  /** Gives the single most important KPI (Net Balance) slightly more visual
   *  weight than the other three — larger value type + a subtle accent border.
   *  Not a restructure of the grid, just a hierarchy nudge per the audit. */
  featured?: boolean
}

function StatCard({ label, value, subtext, icon: Icon, iconBg, iconColor, trend, featured }: StatCardProps) {
  return (
    <div
      className="card p-5"
      style={featured ? { borderColor: 'var(--color-primary-600)', borderWidth: 1.5 } : undefined}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p
            className="text-sm"
            style={{ color: 'var(--text-secondary)', fontWeight: featured ? 600 : 400 }}
          >
            {label}
          </p>
          <p
            className={cn(
              featured ? 'text-3xl' : 'text-2xl',
              'font-semibold tabular-nums',
              trend === 'positive' && 'text-income',
              trend === 'negative' && 'text-expense',
            )}
            style={!trend ? { color: 'var(--text-primary)' } : undefined}
          >
            {value}
          </p>
          {subtext && (
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{subtext}</p>
          )}
        </div>
        <div
          className="flex items-center justify-center w-10 h-10 rounded-lg shrink-0"
          style={{ background: iconBg }}
        >
          <Icon className="w-5 h-5" style={{ color: iconColor }} />
        </div>
      </div>
    </div>
  )
}

function SkeletonCard() {
  return (
    <div className="card p-5 animate-pulse">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="h-4 w-24 rounded" style={{ background: 'var(--bg-muted)' }} />
          <div className="h-7 w-32 rounded" style={{ background: 'var(--bg-muted)' }} />
          <div className="h-3 w-20 rounded" style={{ background: 'var(--bg-muted)' }} />
        </div>
        <div className="w-10 h-10 rounded-lg" style={{ background: 'var(--bg-muted)' }} />
      </div>
    </div>
  )
}

export function SummaryCards() {
  const { data, isLoading, error, refresh } = useDashboard()

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
      </div>
    )
  }

  if (error) {
    return (
      <div className="card p-5">
        <DataError message={error} onRetry={refresh} />
      </div>
    )
  }

  const s = data?.summary

  const cards: StatCardProps[] = [
    {
      label: 'Total Pemasukan',
      value: formatCurrencyShort(s?.totalIncome ?? 0),
      ...(s?.periodLabel ? { subtext: s.periodLabel } : {}),
      icon: TrendingUp,
      iconBg: 'var(--color-success-50)',
      iconColor: 'var(--color-success-600)',
      trend: 'positive',
    },
    {
      label: 'Total Pengeluaran',
      value: formatCurrencyShort(s?.totalExpense ?? 0),
      subtext: `${s?.transactionCount ?? 0} transaksi`,
      icon: TrendingDown,
      iconBg: 'var(--color-danger-50)',
      iconColor: 'var(--color-danger-600)',
      trend: 'negative',
    },
    {
      label: 'Saldo Bersih',
      value: formatCurrencyShort(s?.netBalance ?? 0),
      subtext: 'Bulan ini',
      icon: Wallet,
      iconBg: 'var(--color-primary-50)',
      iconColor: 'var(--color-primary-600)',
      trend: (s?.netBalance ?? 0) >= 0 ? 'positive' : 'negative',
      featured: true,
    },
    {
      label: 'Tingkat Tabungan',
      value: formatPercentage(s?.savingRate ?? 0),
      subtext: 'Dari total pemasukan',
      icon: PiggyBank,
      iconBg: 'var(--color-warning-50)',
      iconColor: 'var(--color-warning-600)',
      trend: 'neutral',
    },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <StatCard key={card.label} {...card} />
      ))}
    </div>
  )
}