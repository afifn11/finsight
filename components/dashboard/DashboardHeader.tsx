// components/dashboard/DashboardHeader.tsx
'use client'

import { useState } from 'react'
import { Plus, Camera, FileSpreadsheet } from 'lucide-react'
import { UserGreeting } from './UserGreeting'
import { useQuickAdd } from '@/components/transactions/QuickAddProvider'
import { BankStatementModal } from '@/components/bank-statement/BankStatementModal'

interface DashboardHeaderProps {
  name?: string | null | undefined
}

export function DashboardHeader({ name }: DashboardHeaderProps) {
  const { openAdd, openScan } = useQuickAdd()
  const [isStatementModalOpen, setIsStatementModalOpen] = useState(false)

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-5 md:p-6 rounded-2xl glass-card interactive-card">
        <div>
          <UserGreeting name={name} />
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
            Ringkasan kondisi finansial dan pola pengeluaran kamu
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          <button
            type="button"
            onClick={() => setIsStatementModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium border border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 transition-all duration-150 hover:bg-zinc-50 dark:hover:bg-zinc-800 active:scale-[0.98]"
          >
            <FileSpreadsheet className="w-4 h-4 text-lime-600 dark:text-lime-400" />
            <span>Import Mutasi</span>
          </button>

          <button
            type="button"
            onClick={openScan}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium border border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 transition-all duration-150 hover:bg-zinc-50 dark:hover:bg-zinc-800 active:scale-[0.98]"
          >
            <Camera className="w-4 h-4 text-lime-600 dark:text-lime-400" />
            <span>Scan Struk</span>
          </button>

          <button
            type="button"
            onClick={openAdd}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-medium text-white dark:text-zinc-950 transition-all duration-150 hover:bg-lime-700 dark:hover:bg-lime-300 active:scale-[0.98] bg-lime-600 dark:bg-lime-400"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah</span>
          </button>
        </div>
      </div>

      {/* Bank Statement Auto-Parser Modal */}
      <BankStatementModal
        open={isStatementModalOpen}
        onClose={() => setIsStatementModalOpen(false)}
      />
    </>
  )
}
