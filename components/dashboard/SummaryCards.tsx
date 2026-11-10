// components/dashboard/SummaryCards.tsx
'use client'

import { TrendingUp, TrendingDown, Wallet, PiggyBank } from 'lucide-react'
import { useDashboard } from '@/hooks'
import { formatCurrencyShort, formatPercentage, cn } from '@/lib/utils'
import { DataError } from '@/components/ui/DataError'
import { AnimatedNumber } from '@/components/ui/AnimatedNumber'

interface StatCardProps {
  label: string
  numericValue: number
  formatFn: (val: number) => string
  subtext?: string
  icon: React.ElementType
  iconBg: string
  iconColor: string
  trend?: 'positive' | 'negative' | 'neutral'
  featured?: boolean
}

function StatCard({
  label,
  numericValue,
  formatFn,
  subtext,
  icon: Icon,
  iconBg,
  iconColor,
  trend,
  featured,
}: StatCardProps) {
  return (
    <div
      className={cn(
        'p-5 min-h-[120px] rounded-2xl glass-card interactive-card flex flex-col justify-between',
        featured && 'glow-accent'
      )}
      style={featured ? { borderColor: 'var(--color-primary-600)', borderWidth: 1.5 } : undefined}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p
            className="text-sm font-medium"
            style={{ color: 'var(--text-secondary)' }}
          >
            {label}
          </p>
          <div
            className={cn(
              featured ? 'text-3xl' : 'text-2xl',
              'font-semibold tabular-nums tracking-tight',
              trend === 'positive' && 'text-income',
              trend === 'negative' && 'text-expense'
            )}
            style={!trend ? { color: 'var(--text-primary)' } : undefined}
          >
            <AnimatedNumber value={numericValue} format={formatFn} />
          </div>
          {subtext && (
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {subtext}
            </p>
          )}
        </div>
        <div
          className="flex items-center justify-center w-10 h-10 rounded-xl shrink-0 shadow-sm transition-transform duration-200 group-hover:scale-105"
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
    <div className="glass-card p-5 min-h-[120px] rounded-2xl animate-pulse flex flex-col justify-between">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="h-4 w-24 rounded-md" style={{ background: 'var(--bg-muted)' }} />
          <div className="h-7 w-32 rounded-md" style={{ background: 'var(--bg-muted)' }} />
          <div className="h-3 w-20 rounded-md" style={{ background: 'var(--bg-muted)' }} />
        </div>
        <div className="w-10 h-10 rounded-xl" style={{ background: 'var(--bg-muted)' }} />
      </div>
    </div>
  )
}

export function SummaryCards() {
  const { data, isLoading, error, refresh } = useDashboard()

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="card p-5 rounded-2xl">
        <DataError message={error} onRetry={refresh} />
      </div>
    )
  }

  const s = data?.summary

  const cards: StatCardProps[] = [
    {
      label: 'Saldo Bersih',
      numericValue: s?.netBalance ?? 0,
      formatFn: formatCurrencyShort,
      subtext: 'Bulan ini',
      icon: Wallet,
      iconBg: 'var(--color-primary-50)',
      iconColor: 'var(--color-primary-600)',
      trend: (s?.netBalance ?? 0) >= 0 ? 'positive' : 'negative',
      featured: true,
    },
    {
      label: 'Total Pemasukan',
      numericValue: s?.totalIncome ?? 0,
      formatFn: formatCurrencyShort,
      ...(s?.periodLabel ? { subtext: s.periodLabel } : {}),
      icon: TrendingUp,
      iconBg: 'var(--color-success-50)',
      iconColor: 'var(--color-success-600)',
      trend: 'positive',
    },
    {
      label: 'Total Pengeluaran',
      numericValue: s?.totalExpense ?? 0,
      formatFn: formatCurrencyShort,
      subtext: `${s?.transactionCount ?? 0} transaksi`,
      icon: TrendingDown,
      iconBg: 'var(--color-danger-50)',
      iconColor: 'var(--color-danger-600)',
      trend: 'negative',
    },
    {
      label: 'Tingkat Tabungan',
      numericValue: s?.savingRate ?? 0,
      formatFn: formatPercentage,
      subtext: 'Dari total pemasukan',
      icon: PiggyBank,
      iconBg: 'var(--color-warning-50)',
      iconColor: 'var(--color-warning-600)',
      trend: 'neutral',
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
      {cards.map((card) => (
        <StatCard key={card.label} {...card} />
      ))}
    </div>
  )
}
