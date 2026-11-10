// components/dashboard/NetWorthCard.tsx
'use client'

import { useState } from 'react'
import { Wallet as WalletIcon, ArrowRightLeft, Settings2, Landmark, Smartphone, Banknote, TrendingUp } from 'lucide-react'
import { useWallets } from '@/hooks'
import { formatCurrencyShort } from '@/lib/utils'
import { AnimatedNumber } from '@/components/ui/AnimatedNumber'
import { TransferModal } from '@/components/wallets/TransferModal'
import { WalletManagerModal } from '@/components/wallets/WalletManagerModal'

export function NetWorthCard() {
  const { wallets, netWorth, breakdownByType, refresh } = useWallets()
  const [showTransfer, setShowTransfer] = useState(false)
  const [showManager, setShowManager] = useState(false)

  const activeWallets = wallets.slice(0, 4)

  const bankTotal = breakdownByType.BANK ?? 0
  const ewalletTotal = breakdownByType.E_WALLET ?? 0
  const cashTotal = breakdownByType.CASH ?? 0
  const investmentTotal = breakdownByType.INVESTMENT ?? 0

  return (
    <>
      <div className="glass-card interactive-card glow-accent p-5 md:p-6 rounded-2xl h-full flex flex-col justify-between">
        {/* Header & Net Worth Value */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div
                className="flex items-center justify-center w-8 h-8 rounded-xl shadow-xs"
                style={{ background: 'var(--color-primary-50)' }}
              >
                <WalletIcon className="w-4 h-4" style={{ color: 'var(--color-primary-600)' }} />
              </div>
              <h3 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                Total Net Worth
              </h3>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setShowTransfer(true)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-medium transition-all hover:bg-black/5 dark:hover:bg-white/5 active:scale-95"
                style={{
                  borderColor: 'var(--border-default)',
                  color: 'var(--text-primary)',
                  background: 'var(--bg-card)',
                }}
                title="Transfer Antar Dompet"
              >
                <ArrowRightLeft className="w-3.5 h-3.5 text-cyan-600" />
                <span className="hidden sm:inline">Transfer</span>
              </button>

              <button
                type="button"
                onClick={() => setShowManager(true)}
                className="p-1.5 rounded-xl border transition-all hover:bg-black/5 dark:hover:bg-white/5 active:scale-95"
                style={{
                  borderColor: 'var(--border-default)',
                  color: 'var(--text-secondary)',
                  background: 'var(--bg-card)',
                }}
                title="Kelola Dompet"
              >
                <Settings2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="mt-1">
            <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
              Total Akumulasi Aset Bersih
            </p>
            <div className="text-3xl font-bold tabular-nums tracking-tight mt-0.5" style={{ color: 'var(--text-primary)' }}>
              <AnimatedNumber value={netWorth} format={formatCurrencyShort} />
            </div>
          </div>

          {/* Wallet Type Distribution Pills */}
          <div className="flex flex-wrap items-center gap-2 mt-4">
            {bankTotal > 0 && (
              <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg border font-medium" style={{ background: 'var(--bg-muted)', borderColor: 'var(--border-default)' }}>
                <Landmark className="w-3 h-3 text-blue-500" />
                <span>Bank: {formatCurrencyShort(bankTotal)}</span>
              </span>
            )}
            {ewalletTotal > 0 && (
              <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg border font-medium" style={{ background: 'var(--bg-muted)', borderColor: 'var(--border-default)' }}>
                <Smartphone className="w-3 h-3 text-cyan-500" />
                <span>E-Wallet: {formatCurrencyShort(ewalletTotal)}</span>
              </span>
            )}
            {cashTotal > 0 && (
              <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg border font-medium" style={{ background: 'var(--bg-muted)', borderColor: 'var(--border-default)' }}>
                <Banknote className="w-3 h-3 text-emerald-500" />
                <span>Tunai: {formatCurrencyShort(cashTotal)}</span>
              </span>
            )}
            {investmentTotal > 0 && (
              <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg border font-medium" style={{ background: 'var(--bg-muted)', borderColor: 'var(--border-default)' }}>
                <TrendingUp className="w-3 h-3 text-purple-500" />
                <span>Investasi: {formatCurrencyShort(investmentTotal)}</span>
              </span>
            )}
          </div>
        </div>

        {/* Active Wallets Quick Summary */}
        <div className="mt-4 pt-3 border-t space-y-1.5" style={{ borderColor: 'var(--border-default)' }}>
          <div className="flex items-center justify-between text-xs mb-1" style={{ color: 'var(--text-muted)' }}>
            <span>Dompet Aktif ({wallets.length})</span>
            <button
              onClick={() => setShowManager(true)}
              className="text-xs hover:underline text-cyan-600 font-medium"
            >
              Lihat semua
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {activeWallets.map((w) => (
              <div
                key={w.id}
                className="flex items-center justify-between p-2 rounded-xl border text-xs"
                style={{ background: 'var(--bg-card)', borderColor: 'var(--border-default)' }}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: w.color }} />
                  <span className="font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                    {w.name}
                  </span>
                </div>
                <span className="font-semibold tabular-nums ml-2" style={{ color: 'var(--text-secondary)' }}>
                  {formatCurrencyShort(Number(w.balance))}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <TransferModal
        open={showTransfer}
        onClose={() => setShowTransfer(false)}
        wallets={wallets}
        onSuccess={refresh}
      />

      <WalletManagerModal
        open={showManager}
        onClose={() => setShowManager(false)}
        wallets={wallets}
        onSuccess={refresh}
      />
    </>
  )
}
