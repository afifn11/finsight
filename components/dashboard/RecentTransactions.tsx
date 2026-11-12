// components/dashboard/RecentTransactions.tsx
'use client'

import Link from 'next/link'
import { ChevronRight, ArrowUpRight, ArrowDownLeft, ReceiptText } from 'lucide-react'
import { useTransactions } from '@/hooks'
import { formatCurrency, formatDateShort, cn } from '@/lib/utils'

export function RecentTransactions() {
  const { data, isLoading } = useTransactions({ limit: 6 })

  return (
    <div className="glass-card interactive-card p-5 md:p-6 rounded-2xl h-full flex flex-col justify-between">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
            Transaksi Terbaru
          </h3>
          <p className="text-xs sm:text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
            Aktivitas transaksi terkini kamu
          </p>
        </div>
        <Link
          href="/transactions"
          className="flex items-center gap-1 text-xs sm:text-sm font-medium transition-colors hover:opacity-80"
          style={{ color: 'var(--color-primary-600)' }}
        >
          Lihat semua <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-3 animate-pulse">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl shrink-0" style={{ background: 'var(--bg-muted)' }} />
              <div className="flex-1 space-y-1.5">
                <div className="h-4 w-40 rounded" style={{ background: 'var(--bg-muted)' }} />
                <div className="h-3 w-24 rounded" style={{ background: 'var(--bg-muted)' }} />
              </div>
              <div className="h-4 w-20 rounded" style={{ background: 'var(--bg-muted)' }} />
            </div>
          ))}
        </div>
      ) : !data?.data.length ? (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3" style={{ background: 'var(--bg-muted)' }}>
            <ReceiptText className="w-6 h-6" style={{ color: 'var(--text-muted)' }} />
          </div>
          <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
            Belum ada transaksi tercatat
          </p>
          <Link
            href="/transactions"
            className="mt-2 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors hover:opacity-80"
            style={{
              borderColor: 'var(--border-default)',
              color: 'var(--color-primary-600)',
            }}
          >
            Mulai catat transaksi
          </Link>
        </div>
      ) : (
        <div className="space-y-1.5 divide-y divide-black/5 dark:divide-white/5">
          {data.data.map((tx) => {
            const isIncome = tx.type === 'INCOME'
            return (
              <div
                key={tx.id}
                className="flex items-center gap-3 px-2 py-2 rounded-xl transition-all duration-150 hover:bg-black/5 dark:hover:bg-white/5 cursor-default"
              >
                {/* Category icon indicator */}
                <div
                  className="flex items-center justify-center w-9 h-9 rounded-xl shrink-0"
                  style={{ background: tx.category.color + '20' }}
                >
                  {isIncome ? (
                    <ArrowUpRight className="w-4 h-4" style={{ color: 'var(--color-success-600)' }} />
                  ) : (
                    <ArrowDownLeft className="w-4 h-4" style={{ color: 'var(--color-danger-600)' }} />
                  )}
                </div>

                {/* Description + category */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                    {tx.description}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {tx.category.name} · {formatDateShort(tx.date)}
                  </p>
                </div>

                {/* Amount */}
                <span
                  className={cn('text-sm font-semibold tabular-nums shrink-0', isIncome ? 'text-income' : 'text-expense')}
                >
                  {isIncome ? '+' : '-'}{formatCurrency(Number(tx.amount))}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
