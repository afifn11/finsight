// components/dashboard/DashboardHeader.tsx
'use client'

import { Plus, Camera } from 'lucide-react'
import { UserGreeting } from './UserGreeting'
import { useQuickAdd } from '@/components/transactions/QuickAddProvider'

interface DashboardHeaderProps {
  name?: string | null | undefined
}

export function DashboardHeader({ name }: DashboardHeaderProps) {
  const { openAdd, openScan } = useQuickAdd()

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-5 md:p-6 rounded-2xl glass-card interactive-card glow-accent">
      <div>
        <UserGreeting name={name} />
        <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
          Ringkasan kondisi finansial dan pola pengeluaran kamu
        </p>
      </div>

      <div className="flex items-center gap-2.5 shrink-0">
        <button
          type="button"
          onClick={openScan}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium border transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
          style={{
            background: 'var(--bg-card)',
            borderColor: 'var(--border-default)',
            color: 'var(--text-primary)',
          }}
        >
          <Camera className="w-4 h-4 text-cyan-500" />
          <span>Scan Struk</span>
        </button>

        <button
          type="button"
          onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white transition-all duration-200 shadow-sm hover:scale-[1.02] active:scale-[0.98] hover:opacity-95"
          style={{ background: 'var(--color-primary-800)' }}
        >
          <Plus className="w-4 h-4" />
          <span>Tambah</span>
        </button>
      </div>
    </div>
  )
}
