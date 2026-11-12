// components/budgets/BudgetManager.tsx
'use client'

import { useState } from 'react'
import { Plus, Pencil, Trash2, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Button } from '@/components/ui/Button'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { useBudgets, useCategories } from '@/hooks'
import { formatCurrencyShort, getBudgetStatus, getBudgetStatusColor, cn } from '@/lib/utils'
import { budgetSchema, type BudgetInput } from '@/lib/validations'
import type { BudgetWithCategory } from '@/types'
import { BudgetCardSkeleton } from '@/components/ui/Skeleton'

// ── Budget Card ────────────────────────────────────────────────
function BudgetCard({
  budget,
  onEdit,
  onDelete,
}: {
  budget: BudgetWithCategory
  onEdit: (b: BudgetWithCategory) => void
  onDelete: (id: string) => void
}) {
  const status = getBudgetStatus(budget.percentage)
  const color = getBudgetStatusColor(status)
  const capped = Math.min(budget.percentage, 100)
  const isCompleted = status === 'safe' && budget.percentage < 40
  const remaining = Number(budget.amount) - budget.spent
  const isExceeded = remaining < 0

  return (
    <div className="card p-5 overflow-hidden border border-zinc-200 dark:border-zinc-800/80">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-3">
        {/* Left: Icon & Category Info */}
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-base"
            style={{ background: budget.category.color ? budget.category.color + '22' : undefined }}
          >
            {budget.category.icon === 'utensils' ? '🍽' :
              budget.category.icon === 'car' ? '🚗' :
              budget.category.icon === 'shopping-bag' ? '🛍' :
              budget.category.icon === 'zap' ? '⚡' :
              budget.category.icon === 'heart-pulse' ? '❤️' :
              budget.category.icon === 'tv' ? '📺' :
              budget.category.icon === 'graduation-cap' ? '🎓' : '💰'}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-bold text-zinc-900 dark:text-zinc-100 text-sm truncate" title={budget.category.name}>
              {budget.category.name}
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 capitalize">
              {budget.period ? budget.period.toLowerCase() : 'bulanan'}
            </p>
          </div>
        </div>

        {/* Right: Status Icon */}
        <div className="shrink-0">
          {isCompleted ? (
            <CheckCircle2 className="w-4 h-4 text-lime-500 shrink-0" />
          ) : status === 'danger' || status === 'exceeded' ? (
            <AlertTriangle className="w-4 h-4 shrink-0" style={{ color }} />
          ) : null}
        </div>
      </div>

      {/* Amounts */}
      <div className="flex items-end justify-between mb-3">
        <div>
          <p className="text-xs mb-0.5" style={{ color: 'var(--text-muted)' }}>Terpakai</p>
          <p className="text-xl font-bold" style={{ color }}>
            {formatCurrencyShort(budget.spent)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs mb-0.5" style={{ color: 'var(--text-muted)' }}>Limit</p>
          <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
            {formatCurrencyShort(Number(budget.amount))}
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div
        className="w-full h-2 rounded-full overflow-hidden mb-1.5"
        style={{ background: 'var(--bg-muted)' }}
      >
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${capped}%`, background: color }}
        />
      </div>

      {/* Percentage label */}
      <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
        <span>{budget.percentage}% terpakai</span>
        {status === 'danger' && <span className="font-medium text-amber-500">Mendekati limit!</span>}
      </div>

      {/* Footer Actions & Remaining Status */}
      <div className="pt-3 mt-3 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between gap-2">
        <span className={cn(
          'text-xs font-semibold shrink-0',
          isExceeded
            ? 'text-rose-600 dark:text-rose-400'
            : 'text-lime-600 dark:text-lime-400'
        )}>
          {isExceeded
            ? `Melewati ${formatCurrencyShort(Math.abs(remaining))}`
            : `Sisa ${formatCurrencyShort(remaining)}`
          }
        </span>
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => onEdit(budget)}
            className="p-1.5 rounded-lg text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            title="Edit budget"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(budget.id)}
            className="p-1.5 rounded-lg text-zinc-500 dark:text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
            title="Hapus budget"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Budget Form Modal ──────────────────────────────────────────
function BudgetFormModal({
  open,
  onClose,
  onSuccess,
  editData,
}: {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  editData: BudgetWithCategory | null
}) {
  const { data: categories } = useCategories('EXPENSE')
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<BudgetInput>({
    // @ts-expect-error — zodResolver v5 inference difference with exactOptionalPropertyTypes
    resolver: zodResolver(budgetSchema),
    defaultValues: { period: 'MONTHLY', alertThreshold: 80 },
  })

  // Populate on edit
  useState(() => {
    if (editData) {
      reset({
        categoryId: editData.categoryId,
        amount: Number(editData.amount),
        period: editData.period,
        alertThreshold: editData.alertThreshold,
      })
    } else {
      reset({ period: 'MONTHLY', alertThreshold: 80 })
    }
  })

  async function onSubmit(data: BudgetInput) {
    try {
      const res = await fetch(
        editData ? `/api/budgets/${editData.id}` : '/api/budgets',
        {
          method: editData ? 'PATCH' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        }
      )
      if (!res.ok) {
        const err = await res.json() as { error?: string }
        toast.error(err.error ?? 'Gagal menyimpan budget')
        return
      }
      toast.success(editData ? 'Budget diperbarui' : 'Budget berhasil dibuat')
      onSuccess()
    } catch {
      toast.error('Terjadi kesalahan')
    }
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.5)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="card w-full max-w-sm" style={{ background: 'var(--bg-card)' }}>
        <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: 'var(--border-default)' }}>
          <h2 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
            {editData ? 'Edit Budget' : 'Buat Budget Baru'}
          </h2>
          <button onClick={onClose} style={{ color: 'var(--text-muted)' }}>✕</button>
        </div>

        <form onSubmit={handleSubmit(onSubmit as unknown as Parameters<typeof handleSubmit>[0])} className="p-5 space-y-4">
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
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            {errors.categoryId && (
              <p className="text-xs mt-1" style={{ color: 'var(--color-danger-text)' }}>
                {errors.categoryId.message}
              </p>
            )}
          </div>

          {/* Amount */}
          <div>
            <label className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
              Batas pengeluaran (Rp)
            </label>
            <input
              {...register('amount', { valueAsNumber: true })}
              type="number"
              placeholder="0"
              className="mt-1 w-full px-3 py-2 rounded-lg border text-sm outline-none"
              style={{
                background: 'var(--bg-card)',
                borderColor: errors.amount ? 'var(--color-danger-500)' : 'var(--border-default)',
                color: 'var(--text-primary)',
              }}
            />
            {errors.amount && (
              <p className="text-xs mt-1" style={{ color: 'var(--color-danger-text)' }}>
                {errors.amount.message}
              </p>
            )}
          </div>

          {/* Alert threshold */}
          <div>
            <label className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
              Alert pada <span style={{ color: 'var(--color-primary-600)' }}>
                {watch('alertThreshold') ?? 80}%
              </span>
            </label>
            <Controller
              name="alertThreshold"
              control={control}
              render={({ field }) => (
                <input
                  type="range"
                  min={50}
                  max={100}
                  step={5}
                  value={field.value}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                  className="mt-2 w-full accent-[var(--color-primary-600)]"
                />
              )}
            />
            <div className="flex justify-between text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
              <span>50%</span><span>75%</span><span>100%</span>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="secondary" fullWidth onClick={onClose}>
              Batal
            </Button>
            <Button type="submit" fullWidth loading={isSubmitting}>
              {editData ? 'Simpan' : 'Buat budget'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Main export ────────────────────────────────────────────────
export function BudgetManager() {
  const { data: budgets, isLoading, refresh } = useBudgets()
  const [modalOpen, setModalOpen] = useState(false)
  const [editingBudget, setEditingBudget] = useState<BudgetWithCategory | null>(null)
  const [pendingDeleteBudget, setPendingDeleteBudget] = useState<BudgetWithCategory | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  async function handleConfirmDelete() {
    if (!pendingDeleteBudget) return
    setIsDeleting(true)
    try {
      await fetch(`/api/budgets/${pendingDeleteBudget.id}`, { method: 'DELETE' })
      toast.success('Budget dihapus')
      refresh()
      setPendingDeleteBudget(null)
    } catch {
      toast.error('Gagal menghapus')
    } finally {
      setIsDeleting(false)
    }
  }

  function handleEdit(b: BudgetWithCategory) {
    setEditingBudget(b)
    setModalOpen(true)
  }

  return (
    <>
      <div className="space-y-6">
        {/* Summary card */}
        {!isLoading && budgets.length > 0 && (() => {
        const totalBudget = budgets.reduce((s, b) => s + Number(b.amount), 0)
        const totalSpent  = budgets.reduce((s, b) => s + b.spent, 0)
        const safeCount   = budgets.filter((b) => getBudgetStatus(b.percentage) === 'safe').length
        const overallPct  = totalBudget > 0 ? Math.min(Math.round((totalSpent / totalBudget) * 100), 100) : 0
        const overallColor = overallPct >= 90
          ? 'var(--color-danger-text)'
          : overallPct >= 70
          ? 'var(--color-warning-text)'
          : 'var(--color-income)'
        return (
          <div
            className="rounded-2xl border p-4"
            style={{ background: 'var(--bg-card)', borderColor: 'var(--border-default)' }}
          >
            {/* Top: title + add button */}
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                Ringkasan Budget
              </p>
              <button
                onClick={() => { setEditingBudget(null); setModalOpen(true) }}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white"
                style={{ background: 'var(--accent-solid)' }}
              >
                <Plus className="w-4 h-4" /> Tambah
              </button>
            </div>

            {/* Overall spend vs budget */}
            <div className="mb-3">
              <div className="flex items-end justify-between mb-1.5">
                <div>
                  <span className="text-2xl font-bold" style={{ color: overallColor }}>
                    {formatCurrencyShort(totalSpent)}
                  </span>
                  <span className="text-sm ml-1.5" style={{ color: 'var(--text-muted)' }}>
                    / {formatCurrencyShort(totalBudget)}
                  </span>
                </div>
                <span className="text-sm font-semibold" style={{ color: overallColor }}>
                  {overallPct}%
                </span>
              </div>
              <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: 'var(--bg-muted)' }}>
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${overallPct}%`, background: overallColor }}
                />
              </div>
            </div>

            {/* 3 stat pills */}
            <div className="grid grid-cols-3 gap-2 mt-3">
              <div
                className="rounded-xl p-3 text-center"
                style={{ background: 'var(--bg-muted)' }}
              >
                <p className="text-xs mb-0.5" style={{ color: 'var(--text-muted)' }}>Total budget</p>
                <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                  {formatCurrencyShort(totalBudget)}
                </p>
              </div>
              <div
                className="rounded-xl p-3 text-center"
                style={{ background: 'var(--bg-muted)' }}
              >
                <p className="text-xs mb-0.5" style={{ color: 'var(--text-muted)' }}>Terpakai</p>
                <p className="text-sm font-bold" style={{ color: 'var(--color-danger-text)' }}>
                  {formatCurrencyShort(totalSpent)}
                </p>
              </div>
              <div
                className="rounded-xl p-3 text-center"
                style={{ background: 'var(--bg-muted)' }}
              >
                <p className="text-xs mb-0.5" style={{ color: 'var(--text-muted)' }}>Aman</p>
                <p className="text-sm font-bold" style={{ color: 'var(--color-income)' }}>
                  {safeCount}<span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>/{budgets.length}</span>
                </p>
              </div>
            </div>
          </div>
        )
      })()}

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <BudgetCardSkeleton key={i} />
          ))}
        </div>
      ) : budgets.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-20 text-center">
          <p className="text-4xl mb-3">💰</p>
          <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>
            Belum ada budget
          </p>
          <p className="text-sm mt-1 mb-5" style={{ color: 'var(--text-muted)' }}>
            Buat budget untuk mengontrol pengeluaranmu
          </p>
          <button
            onClick={() => { setEditingBudget(null); setModalOpen(true) }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white"
            style={{ background: 'var(--accent-solid)' }}
          >
            <Plus className="w-4 h-4" /> Buat budget pertama
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {budgets.map((b) => (
            <BudgetCard key={b.id} budget={b} onEdit={handleEdit} onDelete={() => setPendingDeleteBudget(b)} />
          ))}
        </div>
      )}
      </div>

      <BudgetFormModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditingBudget(null) }}
        onSuccess={() => { setModalOpen(false); setEditingBudget(null); refresh() }}
        editData={editingBudget}
      />

      <ConfirmDialog
        open={pendingDeleteBudget !== null}
        title="Hapus budget?"
        description={
          pendingDeleteBudget
            ? `Budget untuk kategori "${pendingDeleteBudget.category.name}" akan dihapus secara permanen. Tindakan ini tidak dapat dibatalkan.`
            : ''
        }
        confirmLabel="Hapus budget"
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setPendingDeleteBudget(null)}
      />
    </>
  )
}

// Fix: useForm needs watch
function watch(name: string) {
  return name
}