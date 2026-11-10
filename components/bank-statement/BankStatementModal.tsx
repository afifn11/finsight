// components/bank-statement/BankStatementModal.tsx
'use client'

import { useState, useRef, useTransition } from 'react'
import {
  X,
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  Building2,
  ArrowDownLeft,
  ArrowUpRight,
  Sparkles,
  Trash2,
} from 'lucide-react'
import { toast } from 'sonner'
import { useWallets, useCategories } from '@/hooks'
import { notifyTransactionsChanged } from '@/components/transactions/QuickAddProvider'
import type { ParsedStatementTransaction } from '@/types'

interface Props {
  open: boolean
  onClose: () => void
  onSuccess?: () => void
}

function formatRupiah(num: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(num)
}

export function BankStatementModal({ open, onClose, onSuccess }: Props) {
  const { wallets } = useWallets()
  const { data: allCategories } = useCategories()

  const [file, setFile] = useState<File | null>(null)
  const [selectedWalletId, setSelectedWalletId] = useState<string>('')
  const [isParsing, setIsParsing] = useState(false)
  const [isImporting, startImportTransition] = useTransition()
  const [detectedBank, setDetectedBank] = useState<string | null>(null)
  const [transactions, setTransactions] = useState<ParsedStatementTransaction[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  if (!open) return null

  const handleReset = () => {
    setFile(null)
    setTransactions([])
    setDetectedBank(null)
    setIsParsing(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0]
    if (selected) {
      if (selected.size > 4.5 * 1024 * 1024) {
        toast.error('Ukuran file maksimal 4.5MB')
        return
      }
      setFile(selected)
    }
  }

  const handleParse = async () => {
    if (!file) {
      toast.error('Pilih file mutasi rekening terlebih dahulu')
      return
    }

    setIsParsing(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      if (selectedWalletId) formData.append('walletId', selectedWalletId)

      const res = await fetch('/api/bank-statement/parse', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(err.error ?? 'Gagal memproses file mutasi')
      }

      const data = (await res.json()) as {
        transactions: ParsedStatementTransaction[]
        count: number
        detectedBank?: string
      }

      if (data.transactions.length === 0) {
        toast.warning('Tidak ada baris transaksi yang berhasil diekstrak.')
      } else {
        toast.success(`Berhasil mengekstrak ${data.transactions.length} baris transaksi!`)
        setTransactions(data.transactions)
        setDetectedBank(data.detectedBank ?? 'Bank Statement')
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Terjadi kesalahan')
    } finally {
      setIsParsing(false)
    }
  }

  const toggleSelectAll = (checked: boolean) => {
    setTransactions((prev) => prev.map((t) => ({ ...t, selected: checked })))
  }

  const toggleSelectRow = (id: string) => {
    setTransactions((prev) =>
      prev.map((t) => (t.id === id ? { ...t, selected: !t.selected } : t))
    )
  }

  const updateRow = (
    id: string,
    field: keyof ParsedStatementTransaction,
    value: string | number
  ) => {
    setTransactions((prev) =>
      prev.map((t) => (t.id === id ? { ...t, [field]: value } : t))
    )
  }

  const deleteRow = (id: string) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id))
  }

  const selectedCount = transactions.filter((t) => t.selected).length
  const totalSelectedExpense = transactions
    .filter((t) => t.selected && t.type === 'EXPENSE')
    .reduce((sum, t) => sum + Number(t.amount), 0)
  const totalSelectedIncome = transactions
    .filter((t) => t.selected && t.type === 'INCOME')
    .reduce((sum, t) => sum + Number(t.amount), 0)

  const handleImportApproved = () => {
    const approved = transactions.filter((t) => t.selected)
    if (approved.length === 0) {
      toast.error('Pilih minimal satu transaksi untuk diimpor')
      return
    }

    startImportTransition(async () => {
      try {
        const res = await fetch('/api/bank-statement/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            walletId: selectedWalletId || undefined,
            transactions: approved.map((t) => ({
              date: t.date,
              description: t.description,
              amount: Number(t.amount),
              type: t.type,
              categoryId: t.categoryId,
            })),
          }),
        })

        if (!res.ok) {
          const err = (await res.json().catch(() => ({}))) as { error?: string }
          throw new Error(err.error ?? 'Gagal mengimpor transaksi')
        }

        toast.success(`Sukses! ${approved.length} transaksi mutasi bank berhasil disimpan.`)
        notifyTransactionsChanged()
        onSuccess?.()
        handleReset()
        onClose()
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Terjadi kegagalan saat menyimpan transaksi')
      }
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div
        className="w-full max-w-4xl max-h-[90vh] rounded-2xl flex flex-col shadow-2xl overflow-hidden"
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
        }}
      >
        {/* Header */}
        <div
          className="px-6 py-4 border-b flex items-center justify-between shrink-0"
          style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-elevated)' }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-sm"
              style={{ background: 'linear-gradient(135deg, #0ea5e9, #6366f1)' }}
            >
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>
                  Auto-Parser Mutasi Rekening Bank
                </h3>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20">
                  <Sparkles className="w-3 h-3" />
                  Gemini AI Vision
                </span>
              </div>
              <p className="text-xs text-[var(--text-secondary)]">
                Unggah dokumen e-statement (BCA, Mandiri, BRI, BNI, Jago, dll) format PDF atau CSV
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--border-subtle)] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {transactions.length === 0 ? (
            /* Upload Step */
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">
                    Hubungkan ke Dompet / Akun (Opsional)
                  </label>
                  <div className="relative">
                    <select
                      value={selectedWalletId}
                      onChange={(e) => setSelectedWalletId(e.target.value)}
                      className="w-full bg-[var(--bg-elevated)] text-[var(--text-primary)] text-sm px-3.5 py-2.5 rounded-xl border border-[var(--border-subtle)] focus:border-sky-500 focus:outline-hidden"
                    >
                      <option value="">-- Tanpa Dompet (Hanya Catat Transaksi) --</option>
                      {wallets.map((w) => (
                        <option key={w.id} value={w.id}>
                          {w.name} ({w.type}) — Saldo {formatRupiah(Number(w.balance))}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">
                    Tipe File yang Didukung
                  </label>
                  <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                    Dokumen mutasi rekening resmi berformat <strong>.PDF</strong> atau{' '}
                    <strong>.CSV</strong> maksimal 4.5MB. Seluruh nomor rekening dan data rahasia
                    diproses aman.
                  </p>
                </div>
              </div>

              {/* Dropzone */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 ${
                  file
                    ? 'border-sky-500/60 bg-sky-500/5'
                    : 'border-[var(--border-subtle)] hover:border-sky-500/50 hover:bg-[var(--bg-elevated)]/50'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.csv,.txt"
                  onChange={handleFileChange}
                  className="hidden"
                />

                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3 shadow-sm text-sky-500 bg-sky-500/10"
                >
                  <UploadCloud className="w-7 h-7" />
                </div>

                {file ? (
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-[var(--text-primary)]">{file.name}</p>
                    <p className="text-xs text-[var(--text-secondary)]">
                      {(file.size / 1024).toFixed(1)} KB • Klik untuk mengganti file
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-[var(--text-primary)]">
                      Pilih atau tarik file mutasi bank ke sini
                    </p>
                    <p className="text-xs text-[var(--text-muted)]">
                      PDF e-statement rekening koran atau CSV mutasi
                    </p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] transition-colors"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={!file || isParsing}
                  onClick={handleParse}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-white shadow-md transition-all duration-200 disabled:opacity-50"
                  style={{ background: 'linear-gradient(135deg, #0ea5e9, #4f46e5)' }}
                >
                  {isParsing ? (
                    <>
                      <Sparkles className="w-4 h-4 animate-spin" />
                      <span>Gemini AI Sedang Mengekstrak...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Mulai Ekstraksi Mutasi</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            /* Review & Bulk Approve Grid Step */
            <div className="space-y-4">
              {/* Summary Bar */}
              <div
                className="p-4 rounded-xl border flex flex-wrap items-center justify-between gap-3 text-xs"
                style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-elevated)' }}
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 font-bold text-[var(--text-primary)]">
                    <Building2 className="w-4 h-4 text-sky-500" />
                    <span>{detectedBank ?? 'Bank Statement'}</span>
                  </div>
                  <span className="text-[var(--text-muted)]">•</span>
                  <span>{transactions.length} baris terdeteksi</span>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold">
                    <ArrowDownLeft className="w-3.5 h-3.5" />
                    <span>Pemasukan: {formatRupiah(totalSelectedIncome)}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400 font-semibold">
                    <ArrowUpRight className="w-3.5 h-3.5" />
                    <span>Pengeluaran: {formatRupiah(totalSelectedExpense)}</span>
                  </div>
                </div>
              </div>

              {/* Transactions Table */}
              <div className="border border-[var(--border-subtle)] rounded-xl overflow-hidden max-h-[420px] overflow-y-auto">
                <table className="w-full text-xs text-left">
                  <thead
                    className="sticky top-0 z-10 border-b border-[var(--border-subtle)] font-semibold text-[var(--text-secondary)]"
                    style={{ background: 'var(--bg-elevated)' }}
                  >
                    <tr>
                      <th className="p-3 w-10 text-center">
                        <input
                          type="checkbox"
                          checked={selectedCount === transactions.length && transactions.length > 0}
                          onChange={(e) => toggleSelectAll(e.target.checked)}
                          className="rounded border-[var(--border-subtle)] text-sky-600 focus:ring-0 cursor-pointer"
                        />
                      </th>
                      <th className="p-3 w-28">Tanggal</th>
                      <th className="p-3">Deskripsi Transaksi</th>
                      <th className="p-3 w-24">Tipe</th>
                      <th className="p-3 w-32">Nominal (Rp)</th>
                      <th className="p-3 w-40">Kategori</th>
                      <th className="p-3 w-10 text-center">Hapus</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-subtle)]">
                    {transactions.map((t) => (
                      <tr
                        key={t.id}
                        className={`transition-colors ${
                          t.selected ? 'bg-sky-500/5' : 'hover:bg-[var(--bg-elevated)]/40 opacity-70'
                        }`}
                      >
                        <td className="p-3 text-center">
                          <input
                            type="checkbox"
                            checked={t.selected ?? false}
                            onChange={() => toggleSelectRow(t.id)}
                            className="rounded border-[var(--border-subtle)] text-sky-600 focus:ring-0 cursor-pointer"
                          />
                        </td>
                        <td className="p-3">
                          <input
                            type="date"
                            value={t.date}
                            onChange={(e) => updateRow(t.id, 'date', e.target.value)}
                            className="w-full bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-md px-2 py-1 text-xs focus:outline-hidden"
                          />
                        </td>
                        <td className="p-3">
                          <input
                            type="text"
                            value={t.description}
                            onChange={(e) => updateRow(t.id, 'description', e.target.value)}
                            className="w-full bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-md px-2 py-1 text-xs focus:outline-hidden"
                          />
                        </td>
                        <td className="p-3">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                              t.type === 'INCOME'
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                                : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                            }`}
                          >
                            {t.type === 'INCOME' ? 'Masuk' : 'Keluar'}
                          </span>
                        </td>
                        <td className="p-3">
                          <input
                            type="number"
                            value={t.amount}
                            onChange={(e) => updateRow(t.id, 'amount', parseFloat(e.target.value) || 0)}
                            className="w-full bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-md px-2 py-1 text-xs font-semibold focus:outline-hidden"
                          />
                        </td>
                        <td className="p-3">
                          <select
                            value={t.categoryId ?? ''}
                            onChange={(e) => updateRow(t.id, 'categoryId', e.target.value)}
                            className="w-full bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-md px-2 py-1 text-xs focus:outline-hidden"
                          >
                            {allCategories.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.name}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="p-3 text-center">
                          <button
                            type="button"
                            onClick={() => deleteRow(t.id)}
                            className="p-1 rounded text-[var(--text-muted)] hover:text-rose-500"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Approval Footer */}
              <div className="flex items-center justify-between pt-3 border-t border-[var(--border-subtle)]">
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]"
                >
                  Unggah File Lain
                </button>

                <div className="flex items-center gap-3">
                  <span className="text-xs text-[var(--text-secondary)]">
                    <strong>{selectedCount}</strong> transaksi dipilih
                  </span>
                  <button
                    type="button"
                    disabled={selectedCount === 0 || isImporting}
                    onClick={handleImportApproved}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold text-white shadow-md disabled:opacity-50 transition-all"
                    style={{ background: 'linear-gradient(135deg, #0ea5e9, #4f46e5)' }}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>
                      {isImporting
                        ? 'Menyimpan ke Database...'
                        : `Import ${selectedCount} Transaksi`}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
