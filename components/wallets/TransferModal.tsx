// components/wallets/TransferModal.tsx
'use client'

import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { ArrowRightLeft, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { formatCurrency } from '@/lib/utils'
import { notifyTransactionsChanged } from '@/components/transactions/QuickAddProvider'
import type { Wallet } from '@/types'

interface TransferModalProps {
  open: boolean
  onClose: () => void
  wallets: Wallet[]
  onSuccess: () => void
}

export function TransferModal({ open, onClose, wallets, onSuccess }: TransferModalProps) {
  const [fromWalletId, setFromWalletId] = useState<string>(wallets[0]?.id ?? '')
  const [toWalletId, setToWalletId] = useState<string>(wallets[1]?.id ?? '')
  const [amount, setAmount] = useState<string>('')
  const [fee, setFee] = useState<string>('0')
  const [notes, setNotes] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const sourceWallet = wallets.find((w) => w.id === fromWalletId)

  const numAmount = parseFloat(amount) || 0
  const numFee = parseFloat(fee) || 0
  const totalDeduction = numAmount + numFee
  const sourceBalance = sourceWallet ? Number(sourceWallet.balance) : 0
  const isInsufficient = totalDeduction > sourceBalance

  async function handleTransfer(e: React.FormEvent) {
    e.preventDefault()
    setErrorMsg(null)

    if (!fromWalletId || !toWalletId) {
      setErrorMsg('Pilih dompet asal dan dompet tujuan')
      return
    }

    if (fromWalletId === toWalletId) {
      setErrorMsg('Dompet tujuan harus berbeda dengan dompet asal')
      return
    }

    if (numAmount <= 0) {
      setErrorMsg('Nominal transfer harus lebih dari 0')
      return
    }

    if (isInsufficient) {
      setErrorMsg(
        `Saldo ${sourceWallet?.name} tidak mencukupi (Tersedia: ${formatCurrency(
          sourceBalance
        )}, Dibutuhkan: ${formatCurrency(totalDeduction)})`
      )
      return
    }

    setIsSubmitting(true)

    try {
      const res = await fetch('/api/wallets/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromWalletId,
          toWalletId,
          amount: numAmount,
          fee: numFee,
          notes: notes.trim() || null,
        }),
      })

      const json = await res.json()

      if (!res.ok) {
        throw new Error(json.error ?? 'Gagal melakukan transfer')
      }

      toast.success('Transfer antar dompet berhasil!')
      notifyTransactionsChanged()
      onSuccess()
      onClose()
      setAmount('')
      setFee('0')
      setNotes('')
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Terjadi kesalahan')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} ariaLabel="Transfer Antar Dompet">
      <div className="p-6">
        <div className="flex items-center gap-3 mb-5">
          <div
            className="flex items-center justify-center w-10 h-10 rounded-xl"
            style={{ background: 'var(--color-primary-50)' }}
          >
            <ArrowRightLeft className="w-5 h-5" style={{ color: 'var(--color-primary-600)' }} />
          </div>
          <div>
            <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
              Transfer Antar Dompet
            </h2>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              Pindahkan dana antar rekening, e-wallet, atau kas
            </p>
          </div>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl flex items-start gap-2.5 text-xs bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <p>{errorMsg}</p>
          </div>
        )}

        <form onSubmit={handleTransfer} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Source Wallet */}
            <div>
              <label className="text-xs font-medium block mb-1" style={{ color: 'var(--text-secondary)' }}>
                Dari Dompet
              </label>
              <select
                value={fromWalletId}
                onChange={(e) => setFromWalletId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border text-sm outline-none"
                style={{
                  background: 'var(--bg-card)',
                  borderColor: 'var(--border-default)',
                  color: 'var(--text-primary)',
                }}
              >
                {wallets.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name} ({formatCurrency(Number(w.balance))})
                  </option>
                ))}
              </select>
            </div>

            {/* Destination Wallet */}
            <div>
              <label className="text-xs font-medium block mb-1" style={{ color: 'var(--text-secondary)' }}>
                Ke Dompet
              </label>
              <select
                value={toWalletId}
                onChange={(e) => setToWalletId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border text-sm outline-none"
                style={{
                  background: 'var(--bg-card)',
                  borderColor: 'var(--border-default)',
                  color: 'var(--text-primary)',
                }}
              >
                {wallets.map((w) => (
                  <option key={w.id} value={w.id} disabled={w.id === fromWalletId}>
                    {w.name} ({formatCurrency(Number(w.balance))})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Amount */}
          <div>
            <label className="text-xs font-medium block mb-1" style={{ color: 'var(--text-secondary)' }}>
              Nominal Transfer (Rp)
            </label>
            <input
              type="number"
              placeholder="0"
              min="1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-xl border text-sm outline-none font-medium"
              style={{
                background: 'var(--bg-card)',
                borderColor: 'var(--border-default)',
                color: 'var(--text-primary)',
              }}
            />
          </div>

          {/* Admin Fee */}
          <div>
            <label className="text-xs font-medium block mb-1" style={{ color: 'var(--text-secondary)' }}>
              Biaya Admin / Transfer (Rp)
            </label>
            <input
              type="number"
              placeholder="0"
              min="0"
              value={fee}
              onChange={(e) => setFee(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border text-sm outline-none"
              style={{
                background: 'var(--bg-card)',
                borderColor: 'var(--border-default)',
                color: 'var(--text-primary)',
              }}
            />
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs font-medium block mb-1" style={{ color: 'var(--text-secondary)' }}>
              Catatan (opsional)
            </label>
            <input
              type="text"
              placeholder="Contoh: Top up GoPay dari BCA"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border text-sm outline-none"
              style={{
                background: 'var(--bg-card)',
                borderColor: 'var(--border-default)',
                color: 'var(--text-primary)',
              }}
            />
          </div>

          {/* Total summary */}
          {numAmount > 0 && (
            <div
              className="p-3 rounded-xl border text-xs space-y-1"
              style={{ background: 'var(--bg-muted)', borderColor: 'var(--border-default)' }}
            >
              <div className="flex justify-between" style={{ color: 'var(--text-secondary)' }}>
                <span>Transfer</span>
                <span>{formatCurrency(numAmount)}</span>
              </div>
              {numFee > 0 && (
                <div className="flex justify-between" style={{ color: 'var(--text-secondary)' }}>
                  <span>Biaya Admin</span>
                  <span>{formatCurrency(numFee)}</span>
                </div>
              )}
              <div
                className="flex justify-between font-semibold pt-1 border-t"
                style={{ color: 'var(--text-primary)', borderColor: 'var(--border-default)' }}
              >
                <span>Total Pemotongan</span>
                <span className={isInsufficient ? 'text-red-500' : ''}>
                  {formatCurrency(totalDeduction)}
                </span>
              </div>
            </div>
          )}

          <div className="flex gap-2.5 pt-2">
            <Button type="button" variant="secondary" fullWidth onClick={onClose} disabled={isSubmitting}>
              Batal
            </Button>
            <Button
              type="submit"
              fullWidth
              loading={isSubmitting}
              disabled={isSubmitting || numAmount <= 0 || isInsufficient}
            >
              Kirim Transfer
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  )
}
