// components/dashboard/RecentTransactions.tsx
'use client'

import Link from 'next/link'
import { ChevronRight, ArrowUpRight, ArrowDownLeft } from 'lucide-react'
import { useTransactions } from '@/hooks'
import { formatCurrency, formatDateShort, cn } from '@/lib/utils'

export function RecentTransactions() {
  const { data, isLoading } = useTransactions({ limit: 8 })

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
            Transaksi Terbaru
          </h3>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
            8 transaksi terakhir
          </p>
        </div>
        <Link
          href="/transactions"
          className="flex items-center gap-1 text-sm"
          style={{ color: 'var(--color-primary-600)' }}
        >
          Lihat semua <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-3 animate-pulse">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg shrink-0" style={{ background: 'var(--bg-muted)' }} />
              <div className="flex-1 space-y-1.5">
                <div className="h-4 w-40 rounded" style={{ background: 'var(--bg-muted)' }} />
                <div className="h-3 w-24 rounded" style={{ background: 'var(--bg-muted)' }} />
              </div>
              <div className="h-4 w-20 rounded" style={{ background: 'var(--bg-muted)' }} />
            </div>
          ))}
        </div>
      ) : !data?.data.length ? (
        <div className="flex flex-col items-center justify-center py-10">
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Belum ada transaksi</p>
          <Link
            href="/transactions"
            className="mt-2 text-sm font-medium"
            style={{ color: 'var(--color-primary-600)' }}
          >
            Tambah transaksi pertama
          </Link>
        </div>
      ) : (
        <div className="space-y-1">
          {data.data.map((tx) => {
            const isIncome = tx.type === 'INCOME'
            return (
              <div
                key={tx.id}
                className="flex items-center gap-3 px-2 py-2.5 rounded-lg transition-colors hover:opacity-80"
                style={{ cursor: 'default' }}
              >
                {/* Category icon placeholder */}
                <div
                  className="flex items-center justify-center w-9 h-9 rounded-lg shrink-0"
                  style={{ background: tx.category.color + '22' }}
                >
                  {isIncome
                    ? <ArrowUpRight className="w-4 h-4" style={{ color: 'var(--color-success-600)' }} />
                    : <ArrowDownLeft className="w-4 h-4" style={{ color: 'var(--color-danger-600)' }} />
                  }
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
                  className={cn('text-sm font-semibold shrink-0', isIncome ? 'text-income' : 'text-expense')}
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
