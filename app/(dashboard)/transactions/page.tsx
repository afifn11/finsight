// app/(dashboard)/transactions/page.tsx
import type { Metadata } from 'next'
import { TransactionsList } from '@/components/transactions/TransactionsList'
import { ExportButton } from '@/components/shared/ExportButton'

export const metadata: Metadata = { title: 'Transaksi' }

export default function TransactionsPage() {
  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>
            Transaksi
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
            Catat dan kelola semua pemasukan dan pengeluaranmu
          </p>
        </div>
        <ExportButton />
      </div>
      <TransactionsList />
    </div>
  )
}
