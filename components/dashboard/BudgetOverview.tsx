// components/dashboard/BudgetOverview.tsx
'use client'

import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { useBudgets } from '@/hooks'
import { formatCurrencyShort, getBudgetStatus, getBudgetStatusColor } from '@/lib/utils'

export function BudgetOverview() {
  const { data: budgets, isLoading } = useBudgets()

  if (isLoading) {
    return (
      <div className="card p-5 animate-pulse space-y-3">
        <div className="h-5 w-32 rounded" style={{ background: 'var(--bg-muted)' }} />
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="h-4 w-full rounded" style={{ background: 'var(--bg-muted)' }} />
            <div className="h-2 w-full rounded-full" style={{ background: 'var(--bg-muted)' }} />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
            Status Budget
          </h3>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
            Bulan ini
          </p>
        </div>
        <Link
          href="/budgets"
          className="flex items-center gap-1 text-sm"
          style={{ color: 'var(--color-primary-600)' }}
        >
          Lihat semua <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {budgets.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8">
          <p className="text-sm mb-3" style={{ color: 'var(--text-muted)' }}>
            Belum ada budget yang dibuat
          </p>
          <Link
            href="/budgets"
            className="text-sm font-medium"
            style={{ color: 'var(--color-primary-600)' }}
          >
            Buat budget pertama
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {budgets.slice(0, 5).map((budget) => {
            const status = getBudgetStatus(budget.percentage)
            const color = getBudgetStatusColor(status)
            const capped = Math.min(budget.percentage, 100)

            return (
              <div key={budget.id} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                    {budget.category.name}
                  </span>
                  <span style={{ color: 'var(--text-secondary)', whiteSpace: 'nowrap', marginLeft: '8px' }}>
                    {formatCurrencyShort(budget.spent)} / {formatCurrencyShort(Number(budget.amount))}
                  </span>
                </div>

                {/* Progress bar */}
                <div
                  className="w-full h-2 rounded-full overflow-hidden"
                  style={{ background: 'var(--bg-muted)' }}
                >
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${capped}%`, background: color }}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {budget.percentage}% terpakai
                  </span>
                  {status === 'danger' || status === 'exceeded' ? (
                    <span className="text-xs font-medium" style={{ color }}>
                      {status === 'exceeded' ? 'Melewati limit!' : 'Mendekati limit'}
                    </span>
                  ) : null}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
