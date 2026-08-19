// components/transactions/TransactionFormModal.tsx
'use client'

import { useEffect, useRef, useState } from 'react'
import { X, ScanLine } from 'lucide-react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { transactionSchema, type TransactionInput } from '@/lib/validations'
import { useCategories, useBodyScrollLock, useFocusTrap } from '@/hooks'
import type { TransactionWithCategory } from '@/types'
import { ReceiptUploader } from './ReceiptUploader'
import { OcrScanner } from './OcrScanner'
import { IconButton } from '@/components/ui/IconButton'
import { Button } from '@/components/ui/Button'

interface Props {
  open: boolean
  onClose: () => void
  onSuccess: (closeModal?: boolean) => void
  editData?: TransactionWithCategory | null
}

export function TransactionFormModal({ open, onClose, onSuccess, editData }: Props) {
  const isEdit = !!editData
  const dialogRef = useRef<HTMLDivElement>(null)

  // P1.2: lock body scroll & trap keyboard focus while modal is open
  useBodyScrollLock(open)
  useFocusTrap(dialogRef, open, onClose)

  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<TransactionInput>({
    // @ts-expect-error — zodResolver v5 inference difference with exactOptionalPropertyTypes
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      type: 'EXPENSE',
      date: new Date(),
      isRecurring: false,
    },
  })

  const selectedType = watch('type')
  const isRecurring = watch('isRecurring')
  const { data: categories } = useCategories(selectedType)

  // Receipt state
  const [receiptData, setReceiptData] = useState<{ receiptName: string; receiptUrl: string } | null>(
    editData?.receiptName ? { receiptName: editData.receiptName, receiptUrl: editData.receiptUrl ?? '' } : null
  )
  // After creating new transaction, store its ID so user can upload receipt immediately
  const [newTransactionId, setNewTransactionId] = useState<string | null>(null)
  const [showOcr, setShowOcr] = useState(false)

  // Populate form when editing
  useEffect(() => {
    setReceiptData(editData?.receiptName ? { receiptName: editData.receiptName, receiptUrl: editData.receiptUrl ?? '' } : null)
    if (editData) {
      reset({
        amount: Number(editData.amount),
        type: editData.type,
        categoryId: editData.categoryId,
        description: editData.description ?? '',
        date: new Date(editData.date),
        notes: editData.notes ?? '',
        isRecurring: editData.isRecurring,
        recurringPeriod: editData.recurringPeriod ?? undefined,
      })
    } else {
      reset({ type: 'EXPENSE', date: new Date(), isRecurring: false })
    }
  }, [editData, reset, open])

  // Reset newTransactionId ONLY when modal fully closes
  useEffect(() => {
    if (!open) {
      setNewTransactionId(null)
      setShowOcr(false)
    }
  }, [open])

  async function onSubmit(data: TransactionInput) {
    try {
      const url = isEdit ? `/api/transactions/${editData.id}` : '/api/transactions'
      const method = isEdit ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!res.ok) {
        const err = await res.json() as { error?: string }
        toast.error(err.error ?? 'Gagal menyimpan')
        return
      }

      if (isEdit) {
        toast.success('Transaksi diperbarui')
        onSuccess(true)
      } else {
        // For new transactions: stay open so user can upload receipt
        const saved = await res.json() as { data: { id: string } }
        const txId = saved.data?.id ?? null
        setNewTransactionId(txId)
        toast.success('Transaksi ditambahkan — upload bukti atau lewati')
        onSuccess(false) // refresh list but keep modal open
        // Silently check budget alerts after new expense
        if (data.type === 'EXPENSE') {
          fetch('/api/budgets/check-alerts', { method: 'POST' })
            .then((r) => r.json())
            .then((alertRes) => {
              const triggered = alertRes.data ?? []
              triggered.forEach((a: { categoryName: string; percentage: number }) => {
                toast.warning(
                  `Budget ${a.categoryName} sudah ${a.percentage}% terpakai!`,
                  { duration: 6000 }
                )
              })
            })
            .catch(() => {})
        }
      }
    } catch {
      toast.error('Terjadi kesalahan. Coba lagi.')
    }
  }

  function handleOcrResult(data: {
    amount: number | null
    date: string | null
    description: string | null
    category: string | null
    type: 'INCOME' | 'EXPENSE'
    confidence: number
  }) {
    if (data.amount) setValue('amount', data.amount)
    if (data.description) setValue('description', data.description)
    if (data.date) setValue('date', new Date(data.date))
    if (data.type) setValue('type', data.type)
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.5)' }}
      role="presentation"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="transaction-modal-title"
        className="card w-full max-w-md max-h-[90vh] overflow-y-auto"
        style={{ background: 'var(--bg-card)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: 'var(--border-default)' }}>
          <h2 id="transaction-modal-title" className="font-semibold" style={{ color: 'var(--text-primary)' }}>
            {isEdit ? 'Edit Transaksi' : 'Tambah Transaksi'}
          </h2>
          <div className="flex items-center gap-2">
            {!isEdit && (
              <button
                type="button"
                onClick={() => setShowOcr(true)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors hover:opacity-80"
                style={{ borderColor: 'var(--color-primary-600)', color: 'var(--color-primary-600)' }}
                title="Scan struk otomatis"
              >
                <ScanLine className="w-3.5 h-3.5" aria-hidden="true" />
                Scan Struk
              </button>
            )}
            <IconButton aria-label="Tutup dialog" onClick={onClose}>
              <X className="w-5 h-5" aria-hidden="true" />
            </IconButton>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit as unknown as Parameters<typeof handleSubmit>[0])} className="p-5 space-y-4">
          {/* Type toggle */}
          <div>
            <label className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
              Tipe
            </label>
            <Controller
              name="type"
              control={control}
              render={({ field }) => (
                <div className="flex mt-1 rounded-lg border overflow-hidden" style={{ borderColor: 'var(--border-default)' }}>
                  {(['EXPENSE', 'INCOME'] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      aria-pressed={field.value === t}
                      onClick={() => { field.onChange(t); setValue('categoryId', '') }}
                      className="flex-1 py-2 text-sm font-medium transition-colors"
                      style={
                        field.value === t
                          ? {
                              background: t === 'INCOME' ? 'var(--color-success-500)' : 'var(--color-danger-500)',
                              color: '#fff',
                            }
                          : { background: 'var(--bg-card)', color: 'var(--text-secondary)' }
                      }
                    >
                      {t === 'INCOME' ? 'Pemasukan' : 'Pengeluaran'}
                    </button>
                  ))}
                </div>
              )}
            />
          </div>

          {/* Amount */}
          <div>
            <label htmlFor="tx-amount" className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
              Nominal (Rp)
            </label>
            <input
              id="tx-amount"
              {...register('amount', { valueAsNumber: true })}
              type="number"
              placeholder="0"
              min="1"
              aria-invalid={!!errors.amount}
              aria-describedby={errors.amount ? 'tx-amount-error' : undefined}
              className="mt-1 w-full px-3 py-2 rounded-lg border text-sm outline-none"
              style={{
                background: 'var(--bg-card)',
                borderColor: errors.amount ? 'var(--color-danger-500)' : 'var(--border-default)',
                color: 'var(--text-primary)',
              }}
            />
            {errors.amount && (
              <p id="tx-amount-error" role="alert" className="text-xs mt-1" style={{ color: 'var(--color-danger-500)' }}>
                {errors.amount.message}
              </p>
            )}
          </div>

          {/* Category */}
          <div>
            <label htmlFor="tx-category" className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
              Kategori
            </label>
            <select
              id="tx-category"
              {...register('categoryId')}
              aria-invalid={!!errors.categoryId}
              aria-describedby={errors.categoryId ? 'tx-category-error' : undefined}
              className="mt-1 w-full px-3 py-2 rounded-lg border text-sm outline-none"
              style={{
                background: 'var(--bg-card)',
                borderColor: errors.categoryId ? 'var(--color-danger-500)' : 'var(--border-default)',
                color: 'var(--text-primary)',
              }}
            >
              <option value="">Pilih kategori</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
            {errors.categoryId && (
              <p id="tx-category-error" role="alert" className="text-xs mt-1" style={{ color: 'var(--color-danger-500)' }}>
                {errors.categoryId.message}
              </p>
            )}
          </div>

          {/* Description */}
          <div>
            <label htmlFor="tx-description" className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
              Deskripsi
            </label>
            <input
              id="tx-description"
              {...register('description')}
              type="text"
              placeholder="Contoh: Makan siang di warung"
              aria-invalid={!!errors.description}
              aria-describedby={errors.description ? 'tx-description-error' : undefined}
              className="mt-1 w-full px-3 py-2 rounded-lg border text-sm outline-none"
              style={{
                background: 'var(--bg-card)',
                borderColor: errors.description ? 'var(--color-danger-500)' : 'var(--border-default)',
                color: 'var(--text-primary)',
              }}
            />
            {errors.description && (
              <p id="tx-description-error" role="alert" className="text-xs mt-1" style={{ color: 'var(--color-danger-500)' }}>
                {errors.description.message}
              </p>
            )}
          </div>

          {/* Date */}
          <div>
            <label htmlFor="tx-date" className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
              Tanggal
            </label>
            <Controller
              name="date"
              control={control}
              render={({ field }) => (
                <input
                  id="tx-date"
                  type="date"
                  value={field.value ? format(field.value, 'yyyy-MM-dd') : ''}
                  onChange={(e) => field.onChange(new Date(e.target.value))}
                  className="mt-1 w-full px-3 py-2 rounded-lg border text-sm outline-none"
                  style={{
                    background: 'var(--bg-card)',
                    borderColor: errors.date ? 'var(--color-danger-500)' : 'var(--border-default)',
                    color: 'var(--text-primary)',
                  }}
                />
              )}
            />
          </div>

          {/* Recurring toggle */}
          <div className="flex items-center justify-between py-1">
            <div>
              <p id="tx-recurring-label" className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                Transaksi berulang
              </p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Otomatis tercatat setiap periode
              </p>
            </div>
            <Controller
              name="isRecurring"
              control={control}
              render={({ field }) => (
                <button
                  type="button"
                  role="switch"
                  aria-checked={field.value}
                  aria-labelledby="tx-recurring-label"
                  onClick={() => field.onChange(!field.value)}
                  className="relative w-10 h-5 rounded-full transition-colors"
                  style={{ background: field.value ? 'var(--color-primary-600)' : 'var(--border-default)' }}
                >
                  <span
                    className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform"
                    style={{ transform: field.value ? 'translateX(20px)' : 'translateX(0)' }}
                  />
                </button>
              )}
            />
          </div>

          {/* Recurring period (conditional) */}
          {isRecurring && (
            <div>
              <label htmlFor="tx-recurring-period" className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                Periode pengulangan
              </label>
              <select
                id="tx-recurring-period"
                {...register('recurringPeriod')}
                className="mt-1 w-full px-3 py-2 rounded-lg border text-sm outline-none"
                style={{
                  background: 'var(--bg-card)',
                  borderColor: 'var(--border-default)',
                  color: 'var(--text-primary)',
                }}
              >
                <option value="DAILY">Harian</option>
                <option value="WEEKLY">Mingguan</option>
                <option value="MONTHLY">Bulanan</option>
                <option value="YEARLY">Tahunan</option>
              </select>
            </div>
          )}

          {/* Notes */}
          <div>
            <label htmlFor="tx-notes" className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
              Catatan <span style={{ color: 'var(--text-muted)' }}>(opsional)</span>
            </label>
            <textarea
              id="tx-notes"
              {...register('notes')}
              rows={2}
              placeholder="Catatan tambahan..."
              className="mt-1 w-full px-3 py-2 rounded-lg border text-sm outline-none resize-none"
              style={{
                background: 'var(--bg-card)',
                borderColor: 'var(--border-default)',
                color: 'var(--text-primary)',
              }}
            />
          </div>

          {/* Receipt uploader — show when editing OR after creating new transaction */}
          {(isEdit && editData) ? (
            <ReceiptUploader
              transactionId={editData.id}
              receiptName={receiptData?.receiptName ?? editData.receiptName ?? null}
              receiptUrl={receiptData?.receiptUrl ?? editData.receiptUrl ?? null}
              onUpdate={(data) => setReceiptData(data)}
            />
          ) : newTransactionId ? (
            <div className="space-y-2">
              <ReceiptUploader
                transactionId={newTransactionId}
                receiptName={receiptData?.receiptName ?? null}
                receiptUrl={receiptData?.receiptUrl ?? null}
                onUpdate={(data) => setReceiptData(data)}
              />
              <button
                type="button"
                onClick={onClose}
                className="w-full py-2 text-sm rounded-lg transition-colors hover:opacity-80"
                style={{ color: 'var(--text-muted)' }}
              >
                Lewati, tutup
              </button>
            </div>
          ) : null}

          {/* Actions — hide after new transaction saved (showing receipt uploader) */}
          {!newTransactionId && <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" fullWidth onClick={onClose}>
              Batal
            </Button>
            <Button
              type="submit"
              fullWidth
              loading={isSubmitting}
              style={selectedType === 'INCOME' ? { background: 'var(--color-success-500)' } : undefined}
            >
              {isEdit ? 'Simpan perubahan' : 'Tambah transaksi'}
            </Button>
          </div>}
        </form>
      </div>
      {showOcr && (
        <OcrScanner
          onResult={handleOcrResult}
          onClose={() => setShowOcr(false)}
        />
      )}
    </div>
  )
}