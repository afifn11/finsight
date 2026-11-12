// components/wallets/WalletManagerModal.tsx
'use client'

import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Plus, Trash2, Edit2, Wallet as WalletIcon, Check, Landmark, Smartphone, Banknote, TrendingUp, HelpCircle } from 'lucide-react'
import { toast } from 'sonner'
import { formatCurrency, cn } from '@/lib/utils'
import type { Wallet, WalletType } from '@/types'

const WALLET_TYPE_OPTIONS: Array<{ type: WalletType; label: string; icon: React.ElementType }> = [
  { type: 'BANK', label: 'Rekening Bank', icon: Landmark },
  { type: 'E_WALLET', label: 'E-Wallet', icon: Smartphone },
  { type: 'CASH', label: 'Uang Tunai / Kas', icon: Banknote },
  { type: 'INVESTMENT', label: 'Investasi', icon: TrendingUp },
  { type: 'OTHER', label: 'Lainnya', icon: HelpCircle },
]

const COLOR_PRESETS = [
  '#0891b2', // Cyan
  '#10b981', // Emerald
  '#3b82f6', // Blue
  '#8b5cf6', // Violet
  '#f59e0b', // Amber
  '#ef4444', // Red
  '#ec4899', // Pink
]

interface WalletManagerModalProps {
  open: boolean
  onClose: () => void
  wallets: Wallet[]
  onSuccess: () => void
}

export function WalletManagerModal({ open, onClose, wallets, onSuccess }: WalletManagerModalProps) {
  const [editingWallet, setEditingWallet] = useState<Wallet | null>(null)
  const [isCreating, setIsCreating] = useState(false)

  // Form states
  const [name, setName] = useState('')
  const [type, setType] = useState<WalletType>('BANK')
  const [balance, setBalance] = useState('')
  const [color, setColor] = useState('#0891b2')
  const [accountNumber, setAccountNumber] = useState('')
  const [isIncludedInNetWorth, setIsIncludedInNetWorth] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  function startCreate() {
    setEditingWallet(null)
    setName('')
    setType('BANK')
    setBalance('0')
    setColor('#0891b2')
    setAccountNumber('')
    setIsIncludedInNetWorth(true)
    setIsCreating(true)
  }

  function startEdit(w: Wallet) {
    setIsCreating(false)
    setEditingWallet(w)
    setName(w.name)
    setType(w.type)
    setBalance(String(Number(w.balance)))
    setColor(w.color)
    setAccountNumber(w.accountNumber ?? '')
    setIsIncludedInNetWorth(w.isIncludedInNetWorth)
  }

  function resetForm() {
    setIsCreating(false)
    setEditingWallet(null)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) {
      toast.error('Nama dompet wajib diisi')
      return
    }

    setIsSubmitting(true)
    try {
      const payload = {
        name: name.trim(),
        type,
        balance: parseFloat(balance) || 0,
        color,
        icon: 'wallet',
        accountNumber: accountNumber.trim() || null,
        isIncludedInNetWorth,
      }

      const url = editingWallet ? `/api/wallets/${editingWallet.id}` : '/api/wallets'
      const method = editingWallet ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Gagal menyimpan dompet')

      toast.success(editingWallet ? 'Dompet berhasil diperbarui' : 'Dompet baru ditambahkan')
      resetForm()
      onSuccess()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Terjadi kesalahan')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleDelete(id: string) {
    if (wallets.length <= 1) {
      toast.error('Tidak dapat menghapus dompet terakhir.')
      return
    }

    setDeletingId(id)
    try {
      const res = await fetch(`/api/wallets/${id}`, { method: 'DELETE' })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Gagal menghapus dompet')

      toast.success('Dompet berhasil dihapus')
      if (editingWallet?.id === id) resetForm()
      onSuccess()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Terjadi kesalahan')
    } finally {
      setDeletingId(null)
    }
  }

  const showForm = isCreating || !!editingWallet

  return (
    <Modal open={open} onClose={onClose} ariaLabel="Kelola Dompet Keuangan" maxWidth="md">
      <div className="p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div
              className="flex items-center justify-center w-10 h-10 rounded-xl"
              style={{ background: 'var(--color-primary-50)' }}
            >
              <WalletIcon className="w-5 h-5" style={{ color: 'var(--color-primary-600)' }} />
            </div>
            <div>
              <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                Kelola Dompet Keuangan
              </h2>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                Atur rekening bank, e-wallet, kas tunai, dan aset investasi
              </p>
            </div>
          </div>

          {!showForm && (
            <button
              onClick={startCreate}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-white transition-opacity hover:opacity-90"
              style={{ background: 'var(--accent-solid)' }}
            >
              <Plus className="w-3.5 h-3.5" /> Tambah Dompet
            </button>
          )}
        </div>

        {showForm ? (
          <form onSubmit={handleSave} className="space-y-4 pt-1">
            <div className="flex items-center justify-between pb-2 border-b" style={{ borderColor: 'var(--border-default)' }}>
              <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                {editingWallet ? `Edit Dompet: ${editingWallet.name}` : 'Buat Dompet Baru'}
              </h3>
              <button
                type="button"
                onClick={resetForm}
                className="text-xs transition-colors hover:underline"
                style={{ color: 'var(--text-muted)' }}
              >
                Kembali ke daftar
              </button>
            </div>

            {/* Wallet Name */}
            <div>
              <label className="text-xs font-medium block mb-1" style={{ color: 'var(--text-secondary)' }}>
                Nama Dompet / Rekening
              </label>
              <input
                type="text"
                placeholder="Contoh: BCA Prioritas, GoPay, Kas Dompet"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-xl border text-sm outline-none"
                style={{
                  background: 'var(--bg-card)',
                  borderColor: 'var(--border-default)',
                  color: 'var(--text-primary)',
                }}
              />
            </div>

            {/* Wallet Type */}
            <div>
              <label className="text-xs font-medium block mb-1" style={{ color: 'var(--text-secondary)' }}>
                Tipe Dompet
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {WALLET_TYPE_OPTIONS.map((opt) => {
                  const Icon = opt.icon
                  const isSelected = type === opt.type
                  return (
                    <button
                      key={opt.type}
                      type="button"
                      onClick={() => setType(opt.type)}
                      className={cn(
                        'flex items-center gap-2 p-2 rounded-xl border text-xs font-medium transition-all text-left',
                        isSelected ? 'border-primary-500' : 'opacity-70 hover:opacity-100'
                      )}
                      style={{
                        background: isSelected ? 'var(--color-primary-50)' : 'var(--bg-card)',
                        borderColor: isSelected ? 'var(--color-primary-600)' : 'var(--border-default)',
                        color: isSelected ? 'var(--accent-solid)' : 'var(--text-primary)',
                      }}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span className="truncate">{opt.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Balance & Account Number */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium block mb-1" style={{ color: 'var(--text-secondary)' }}>
                  Saldo Saat Ini (Rp)
                </label>
                <input
                  type="number"
                  placeholder="0"
                  value={balance}
                  onChange={(e) => setBalance(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border text-sm outline-none"
                  style={{
                    background: 'var(--bg-card)',
                    borderColor: 'var(--border-default)',
                    color: 'var(--text-primary)',
                  }}
                />
              </div>

              <div>
                <label className="text-xs font-medium block mb-1" style={{ color: 'var(--text-secondary)' }}>
                  Nomor Rekening / HP (opsional)
                </label>
                <input
                  type="text"
                  placeholder="Contoh: 1234-5678-90"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border text-sm outline-none"
                  style={{
                    background: 'var(--bg-card)',
                    borderColor: 'var(--border-default)',
                    color: 'var(--text-primary)',
                  }}
                />
              </div>
            </div>

            {/* Color preset */}
            <div>
              <label className="text-xs font-medium block mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                Warna Label
              </label>
              <div className="flex items-center gap-2">
                {COLOR_PRESETS.map((hex) => (
                  <button
                    key={hex}
                    type="button"
                    onClick={() => setColor(hex)}
                    className="w-6 h-6 rounded-full flex items-center justify-center transition-transform hover:scale-110"
                    style={{ background: hex }}
                  >
                    {color === hex && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Net Worth Toggle */}
            <div className="flex items-center justify-between p-3 rounded-xl border" style={{ borderColor: 'var(--border-default)', background: 'var(--bg-muted)' }}>
              <div>
                <p className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
                  Sertakan dalam Total Kekayaan (Net Worth)
                </p>
                <p className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>
                  Hitung saldo dompet ini ke dalam ringkasan kekayaan bersih
                </p>
              </div>
              <input
                type="checkbox"
                checked={isIncludedInNetWorth}
                onChange={(e) => setIsIncludedInNetWorth(e.target.checked)}
                className="w-4 h-4 accent-lime-600 rounded cursor-pointer"
              />
            </div>

            <div className="flex gap-2.5 pt-2">
              <Button type="button" variant="secondary" fullWidth onClick={resetForm} disabled={isSubmitting}>
                Batal
              </Button>
              <Button type="submit" fullWidth loading={isSubmitting}>
                {editingWallet ? 'Simpan Perubahan' : 'Buat Dompet'}
              </Button>
            </div>
          </form>
        ) : (
          <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1 custom-scrollbar">
            {wallets.map((w) => {
              const bal = Number(w.balance)
              const typeLabel = WALLET_TYPE_OPTIONS.find((t) => t.type === w.type)?.label ?? w.type

              return (
                <div
                  key={w.id}
                  className="flex items-center justify-between p-3.5 rounded-xl border transition-all hover:bg-black/5 dark:hover:bg-white/5"
                  style={{
                    background: 'var(--bg-card)',
                    borderColor: 'var(--border-default)',
                  }}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-3.5 h-3.5 rounded-full shrink-0"
                      style={{ background: w.color }}
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                          {w.name}
                        </p>
                        <span
                          className="text-[10px] px-1.5 py-0.5 rounded-md font-medium shrink-0"
                          style={{
                            background: w.color + '18',
                            color: w.color,
                          }}
                        >
                          {typeLabel}
                        </span>
                      </div>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                        {formatCurrency(bal)}
                        {w.accountNumber && ` · ${w.accountNumber}`}
                        {!w.isIncludedInNetWorth && (
                          <span className="text-[10px] ml-1.5 opacity-60">(Di luar Net Worth)</span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0 ml-2">
                    <button
                      onClick={() => startEdit(w)}
                      className="p-1.5 rounded-lg transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                      style={{ color: 'var(--text-secondary)' }}
                      title="Edit dompet"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(w.id)}
                      disabled={deletingId === w.id || wallets.length <= 1}
                      className="p-1.5 rounded-lg transition-colors hover:bg-red-500/10 text-red-500 disabled:opacity-40"
                      title="Hapus dompet"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </Modal>
  )
}
