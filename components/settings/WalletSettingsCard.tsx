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
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/80 p-5 rounded-2xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-lime-50 dark:bg-lime-950/40 text-lime-600 dark:text-lime-400 border border-lime-200 dark:border-lime-800">
              <WalletIcon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-base text-zinc-900 dark:text-zinc-100">
                Dompet & Rekening Keuangan
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {wallets.length} akun terdaftar • Net Worth {formatCurrencyShort(netWorth)}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
          >
            <Settings2 className="w-3.5 h-3.5 text-lime-600 dark:text-lime-400" />
            <span>Kelola Akun</span>
          </button>
        </div>

        {/* Quick wallet list preview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
          {wallets.slice(0, 4).map((w) => (
            <div
              key={w.id}
              className="flex items-center justify-between p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 text-xs"
            >
              <div className="flex items-center gap-2 truncate">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: w.color || '#10b981' }}
                />
                <span className="font-medium text-zinc-900 dark:text-zinc-100 truncate">
                  {w.name}
                </span>
              </div>
              <span className="font-semibold text-zinc-700 dark:text-zinc-300">
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
