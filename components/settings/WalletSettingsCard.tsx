// components/settings/WalletSettingsCard.tsx
'use client'

import { useState } from 'react'
import { Wallet as WalletIcon, Settings2 } from 'lucide-react'
import { useWallets } from '@/hooks'
import { formatCurrencyShort } from '@/lib/utils'
import { WalletManagerModal } from '@/components/wallets/WalletManagerModal'

export function WalletSettingsCard() {
  const { wallets, netWorth, refresh } = useWallets()
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <>
      <div className="glass-card p-5 rounded-2xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
              <WalletIcon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                Dompet & Rekening Keuangan
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {wallets.length} akun terdaftar • Net Worth {formatCurrencyShort(netWorth)}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-xs"
          >
            <Settings2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Kelola Akun</span>
          </button>
        </div>

        {/* Quick wallet list preview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
          {wallets.slice(0, 4).map((w) => (
            <div
              key={w.id}
              className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-800/40 text-xs"
            >
              <div className="flex items-center gap-2 truncate">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: w.color || '#10b981' }}
                />
                <span className="font-medium text-slate-900 dark:text-slate-100 truncate">
                  {w.name}
                </span>
              </div>
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                {formatCurrencyShort(Number(w.balance))}
              </span>
            </div>
          ))}
        </div>
      </div>

      <WalletManagerModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        wallets={wallets}
        onSuccess={refresh}
      />
    </>
  )
}
