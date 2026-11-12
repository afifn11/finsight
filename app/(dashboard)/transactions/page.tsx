// app/(dashboard)/transactions/page.tsx
'use client'

import { useState } from 'react'
import { Plus, Camera, FileSpreadsheet } from 'lucide-react'
import { TransactionsList } from '@/components/transactions/TransactionsList'
import { ExportButton } from '@/components/shared/ExportButton'
import { useQuickAdd } from '@/components/transactions/QuickAddProvider'
import { BankStatementModal } from '@/components/bank-statement/BankStatementModal'

export default function TransactionsPage() {
  const { openAdd, openScan } = useQuickAdd()
  const [isStatementModalOpen, setIsStatementModalOpen] = useState(false)

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/80 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            Transaksi
          </h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
            Pencatatan, filter, dan riwayat arus kas masuk & keluar
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <ExportButton />

          <button
            type="button"
            onClick={() => setIsStatementModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-medium border border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 transition-all hover:bg-zinc-50 dark:hover:bg-zinc-800 active:scale-[0.98]"
          >
            <FileSpreadsheet className="w-4 h-4 text-lime-600 dark:text-lime-400" />
            <span>Import Mutasi</span>
          </button>

          <button
            type="button"
            onClick={openScan}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-medium border border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 transition-all hover:bg-zinc-50 dark:hover:bg-zinc-800 active:scale-[0.98]"
          >
            <Camera className="w-4 h-4 text-lime-600 dark:text-lime-400" />
            <span>Scan Struk</span>
          </button>

          <button
            type="button"
            onClick={openAdd}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium text-white dark:text-zinc-950 transition-all hover:bg-lime-700 dark:hover:bg-lime-300 active:scale-[0.98] bg-lime-600 dark:bg-lime-400"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah</span>
          </button>
        </div>
      </div>

      {/* Main Transactions Stream */}
      <TransactionsList />

      {/* Bank Statement Auto-Parser Modal */}
      <BankStatementModal
        open={isStatementModalOpen}
        onClose={() => setIsStatementModalOpen(false)}
      />
    </div>
  )
}
