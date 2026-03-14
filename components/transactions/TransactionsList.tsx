// components/transactions/TransactionsList.tsx
'use client'

import { useState, useCallback } from 'react'
import { Plus, Search, Filter, ArrowUpRight, ArrowDownLeft, Pencil, Trash2, ChevronLeft, ChevronRight } from 'lucide-react'
import { useTransactions, useDeleteTransaction } from '@/hooks'
import { formatCurrency, formatDateShort, cn } from '@/lib/utils'
import { TransactionFormModal } from './TransactionFormModal'
import type { TransactionWithCategory, TransactionFilters } from '@/types'

// ── Transaction row ────────────────────────────────────────────
function TransactionRow({
  tx,
  onEdit,
  onDelete,
  isDeleting,
}: {
  tx: TransactionWithCategory
  onEdit: (tx: TransactionWithCategory) => void
  onDelete: (id: string) => void
  isDeleting: boolean
}) {
  const isIncome = tx.type === 'INCOME'

  return (
    <div
      className="flex items-center gap-3 px-3 py-3 rounded-xl border transition-colors hover:opacity-90"
      style={{ background: 'var(--bg-card)', borderColor: 'var(--border-default)' }}
    >
      {/* Icon */}
      <div
        className="flex items-center justify-center w-9 h-9 rounded-lg shrink-0"
        style={{ background: tx.category.color + '22' }}
      >
        {isIncome
          ? <ArrowUpRight className="w-4 h-4" style={{ color: 'var(--color-success-600)' }} />
          : <ArrowDownLeft className="w-4 h-4" style={{ color: 'var(--color-danger-600)' }} />
        }
      </div>

      {/* Description + meta */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
          {tx.description}
        </p>
        <div className="flex items-center gap-1.5 mt-0.5 min-w-0">
          <span
            className="text-xs px-1.5 py-0.5 rounded-md shrink-0 max-w-[100px] truncate"
            style={{ background: tx.category.color + '22', color: tx.category.color }}
          >
            {tx.category.name}
          </span>
          <span className="text-xs shrink-0" style={{ color: 'var(--text-muted)' }}>
            {formatDateShort(tx.date)}
          </span>
          {tx.isRecurring && (
            <span className="text-xs shrink-0" style={{ color: 'var(--color-primary-600)' }}>↻</span>
          )}
        </div>
      </div>

      {/* Amount + Actions */}
      <div className="flex items-center gap-1 shrink-0">
        <span
          className={cn('text-sm font-semibold', isIncome ? 'text-income' : 'text-expense')}
        >
          {isIncome ? '+' : '-'}{formatCurrency(Number(tx.amount))}
        </span>
        <button
          onClick={() => onEdit(tx)}
          className="p-1.5 rounded-md transition-colors hover:opacity-70"
          style={{ color: 'var(--text-muted)' }}
          title="Edit"
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => onDelete(tx.id)}
          disabled={isDeleting}
          className="p-1.5 rounded-md transition-colors hover:opacity-70 disabled:opacity-40"
          style={{ color: 'var(--color-danger-500)' }}
          title="Hapus"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────
export function TransactionsList() {
  const [filters, setFilters] = useState<TransactionFilters>({
    type: 'ALL',
    page: 1,
    limit: 20,
  })
  const [modalOpen, setModalOpen] = useState(false)
  const [editingTx, setEditingTx] = useState<TransactionWithCategory | null>(null)

  const { data, isLoading, refresh } = useTransactions(filters)

  const handleFiltersChange = useCallback((partial: Partial<TransactionFilters>) => {
    setFilters((prev) => ({ ...prev, ...partial }))
  }, [])

  const { deleteTransaction, isDeleting } = useDeleteTransaction(refresh)

  function handleEdit(tx: TransactionWithCategory) {
    setEditingTx(tx)
    setModalOpen(true)
  }

  function handleAdd() {
    setEditingTx(null)
    setModalOpen(true)
  }

  function handleModalClose() {
    setModalOpen(false)
    setEditingTx(null)
  }

  return (
    <>
      <div className="space-y-4">
        {/* Toolbar */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative flex-1 min-w-0">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
                style={{ color: 'var(--text-muted)' }}
              />
              <input
                type="text"
                placeholder="Cari transaksi..."
                value={filters.search ?? ''}
                onChange={(e) => handleFiltersChange({ search: e.target.value, page: 1 })}
                className="w-full pl-9 pr-3 py-2 rounded-lg border text-sm outline-none"
                style={{
                  background: 'var(--bg-card)',
                  borderColor: 'var(--border-default)',
                  color: 'var(--text-primary)',
                }}
              />
            </div>
            {/* Add button */}
            <button
              onClick={handleAdd}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white shrink-0 transition-colors hover:opacity-90"
              style={{ background: 'var(--color-primary-800)' }}
            >
              <Plus className="w-4 h-4" /> Tambah
            </button>
          </div>
          {/* Type filter tabs — full width, always visible */}
          <div className="flex rounded-lg border overflow-hidden" style={{ borderColor: 'var(--border-default)' }}>
            {(['ALL', 'INCOME', 'EXPENSE'] as const).map((type) => (
              <button
                key={type}
                onClick={() => handleFiltersChange({ type, page: 1 })}
                className="flex-1 py-2 text-sm font-medium transition-colors"
                style={
                  filters.type === type
                    ? { background: 'var(--color-primary-800)', color: '#fff' }
                    : { background: 'var(--bg-card)', color: 'var(--text-secondary)' }
                }
              >
                {type === 'ALL' ? 'Semua' : type === 'INCOME' ? 'Pemasukan' : 'Pengeluaran'}
              </button>
            ))}
          </div>
        </div>

        {/* Stats strip */}
        {data && (
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Menampilkan{' '}
            <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
              {data.data.length}
            </span>{' '}
            dari <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{data.total}</span>{' '}
            transaksi
          </p>
        )}

        {/* List */}
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="h-16 rounded-lg animate-pulse"
                style={{ background: 'var(--bg-muted)' }}
              />
            ))}
          </div>
        ) : !data?.data.length ? (
          <div
            className="card flex flex-col items-center justify-center py-16 text-center"
          >
            <Filter className="w-10 h-10 mb-3" style={{ color: 'var(--text-muted)' }} />
            <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
              Tidak ada transaksi ditemukan
            </p>
            <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
              Coba ubah filter atau tambah transaksi baru
            </p>
            <button
              onClick={handleAdd}
              className="mt-4 px-4 py-2 rounded-lg text-sm font-medium text-white"
              style={{ background: 'var(--color-primary-800)' }}
            >
              Tambah transaksi
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {data.data.map((tx) => (
              <TransactionRow
                key={tx.id}
                tx={tx}
                onEdit={handleEdit}
                onDelete={deleteTransaction}
                isDeleting={isDeleting}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {data && data.totalPages > 1 && (
          <div className="flex items-center justify-between pt-2">
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Halaman {data.page} dari {data.totalPages}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => handleFiltersChange({ page: (filters.page ?? 1) - 1 })}
                disabled={(filters.page ?? 1) <= 1}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm border disabled:opacity-40"
                style={{ borderColor: 'var(--border-default)', color: 'var(--text-secondary)' }}
              >
                <ChevronLeft className="w-4 h-4" /> Prev
              </button>
              <button
                onClick={() => handleFiltersChange({ page: (filters.page ?? 1) + 1 })}
                disabled={(filters.page ?? 1) >= data.totalPages}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm border disabled:opacity-40"
                style={{ borderColor: 'var(--border-default)', color: 'var(--text-secondary)' }}
              >
                Next <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      <TransactionFormModal
        open={modalOpen}
        onClose={handleModalClose}
        onSuccess={() => { handleModalClose(); refresh() }}
        editData={editingTx}
      />
    </>
  )
}