// components/transactions/TransactionFormModal.tsx
'use client'

import { useEffect } from 'react'
import { X, Loader2 } from 'lucide-react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { transactionSchema, type TransactionInput } from '@/lib/validations'
import { useCategories } from '@/hooks'
import { cn } from '@/lib/utils'
import type { TransactionWithCategory } from '@/types'

interface Props {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  editData?: TransactionWithCategory | null
}

export function TransactionFormModal({ open, onClose, onSuccess, editData }: Props) {
  const isEdit = !!editData

  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<TransactionInput>({
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

  // Populate form when editing
  useEffect(() => {
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

      toast.success(isEdit ? 'Transaksi diperbarui' : 'Transaksi ditambahkan')
      onSuccess()
    } catch {
      toast.error('Terjadi kesalahan. Coba lagi.')
    }
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.5)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="card w-full max-w-md max-h-[90vh] overflow-y-auto"
        style={{ background: 'var(--bg-card)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: 'var(--border-default)' }}>
          <h2 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
            {isEdit ? 'Edit Transaksi' : 'Tambah Transaksi'}
          </h2>
          <button onClick={onClose} style={{ color: 'var(--text-muted)' }}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-4">
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
            <label className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
              Nominal (Rp)
            </label>
            <input
              {...register('amount', { valueAsNumber: true })}
              type="number"
              placeholder="0"
              min="1"
              className="mt-1 w-full px-3 py-2 rounded-lg border text-sm outline-none"
              style={{
                background: 'var(--bg-card)',
                borderColor: errors.amount ? 'var(--color-danger-500)' : 'var(--border-default)',
                color: 'var(--text-primary)',
              }}
            />
            {errors.amount && (
              <p className="text-xs mt-1" style={{ color: 'var(--color-danger-500)' }}>
                {errors.amount.message}
              </p>
            )}
          </div>

          {/* Category */}
          <div>
            <label className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
              Kategori
            </label>
            <select
              {...register('categoryId')}
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
              <p className="text-xs mt-1" style={{ color: 'var(--color-danger-500)' }}>
                {errors.categoryId.message}
              </p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
              Deskripsi
            </label>
            <input
              {...register('description')}
              type="text"
              placeholder="Contoh: Makan siang di warung"
              className="mt-1 w-full px-3 py-2 rounded-lg border text-sm outline-none"
              style={{
                background: 'var(--bg-card)',
                borderColor: errors.description ? 'var(--color-danger-500)' : 'var(--border-default)',
                color: 'var(--text-primary)',
              }}
            />
            {errors.description && (
              <p className="text-xs mt-1" style={{ color: 'var(--color-danger-500)' }}>
                {errors.description.message}
              </p>
            )}
          </div>

          {/* Date */}
          <div>
            <label className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
              Tanggal
            </label>
            <Controller
              name="date"
              control={control}
              render={({ field }) => (
                <input
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
              <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
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
              <label className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                Periode pengulangan
              </label>
              <select
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
            <label className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
              Catatan <span style={{ color: 'var(--text-muted)' }}>(opsional)</span>
            </label>
            <textarea
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

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-lg text-sm font-medium border transition-colors"
              style={{
                borderColor: 'var(--border-default)',
                color: 'var(--text-secondary)',
                background: 'var(--bg-card)',
              }}
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium text-white transition-colors disabled:opacity-60',
                selectedType === 'INCOME'
                  ? 'bg-[var(--color-success-500)]'
                  : 'hover:opacity-90'
              )}
              style={
                selectedType !== 'INCOME'
                  ? { background: 'var(--color-primary-800)' }
                  : undefined
              }
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {isEdit ? 'Simpan perubahan' : 'Tambah transaksi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
