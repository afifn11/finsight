// components/transactions/TransactionsList.tsx
'use client'

import { useState, useCallback, useEffect } from 'react'
import { Plus, Search, Filter, ArrowUpRight, ArrowDownLeft, Pencil, Trash2, ChevronLeft, ChevronRight, Paperclip } from 'lucide-react'
import { ActionButton, ActionGroup } from '@/components/ui/ActionButton'
import { useTransactions, useDeleteTransaction, useDebounce } from '@/hooks'
import { formatCurrency, formatDateShort, cn } from '@/lib/utils'
import { TransactionFormModal } from './TransactionFormModal'
import { TransactionRowSkeleton } from '@/components/ui/Skeleton'
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
      className="rounded-xl border transition-colors"
      style={{ background: 'var(--bg-card)', borderColor: 'var(--border-default)' }}
    >
      {/* Main content row */}
      <div className="flex items-start gap-3 px-4 py-3.5">

        {/* Type icon */}
        <div
          className="flex items-center justify-center w-9 h-9 rounded-xl shrink-0 mt-0.5"
          style={{
            background: isIncome ? 'var(--color-success-50)' : 'var(--color-danger-50)',
          }}
        >
          {isIncome
            ? <ArrowUpRight className="w-4 h-4" style={{ color: 'var(--color-success-600)' }} />
            : <ArrowDownLeft className="w-4 h-4" style={{ color: 'var(--color-danger-600)' }} />
          }
        </div>

        {/* Center: description + meta */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium leading-snug" style={{ color: 'var(--text-primary)' }}>
            {tx.description}
          </p>
          <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
            <span
              className="inline-flex items-center text-xs px-2 py-0.5 rounded-full font-medium max-w-[110px] truncate"
              style={{ background: tx.category.color + '18', color: tx.category.color }}
            >
              {tx.category.name}
            </span>
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {formatDateShort(tx.date)}
            </span>
            {tx.isRecurring && (
              <span
                className="text-xs px-1.5 py-0.5 rounded-full"
                style={{ background: 'var(--color-primary-50)', color: 'var(--color-primary-700)' }}
              >
                ↻ Berulang
              </span>
            )}
          </div>
        </div>

        {/* Right: amount + attachment indicator */}
        <div className="shrink-0 text-right pt-0.5">
          <span className={cn('text-sm font-bold tabular-nums', isIncome ? 'text-income' : 'text-expense')}>
            {isIncome ? '+' : '-'}{formatCurrency(Number(tx.amount))}
          </span>
          {tx.receiptName && (
            <div className="flex items-center justify-end gap-0.5 mt-1">
              <Paperclip className="w-3 h-3" style={{ color: 'var(--text-muted)' }} />
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Bukti</span>
            </div>
          )}
        </div>
      </div>

      {/* Action bar */}
      <div
        className="flex items-center justify-end gap-1 px-3 py-2 border-t"
        style={{ borderColor: 'var(--border-default)' }}
      >
        <ActionGroup>
          <ActionButton
            icon={<Pencil className="w-3.5 h-3.5" />}
            label="Edit"
            onClick={() => onEdit(tx)}
            variant="default"
          />
          <ActionButton
            icon={<Trash2 className="w-3.5 h-3.5" />}
            label="Hapus"
            onClick={() => onDelete(tx.id)}
            disabled={isDeleting}
            variant="danger"
          />
        </ActionGroup>
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
  const [searchInput, setSearchInput] = useState('')
  const debouncedSearch = useDebounce(searchInput, 300)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingTx, setEditingTx] = useState<TransactionWithCategory | null>(null)

  useEffect(() => {
    setFilters((prev) => {
      const { search: _, ...rest } = prev
      return debouncedSearch
        ? { ...rest, search: debouncedSearch, page: 1 }
        : { ...rest, page: 1 }
    })
  }, [debouncedSearch])

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
            <div className="relative flex-1 min-w-0">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
                style={{ color: 'var(--text-muted)' }}
              />
              <input
                type="text"
                placeholder="Cari transaksi..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-lg border text-sm outline-none"
                style={{
                  background: 'var(--bg-card)',
                  borderColor: 'var(--border-default)',
                  color: 'var(--text-primary)',
                }}
              />
            </div>
            <button
              onClick={handleAdd}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white shrink-0 transition-colors hover:opacity-90"
              style={{ background: 'var(--color-primary-800)' }}
            >
              <Plus className="w-4 h-4" /> Tambah
            </button>
          </div>

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

        {data && (
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Menampilkan{' '}
            <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{data.data.length}</span>{' '}
            dari{' '}
            <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{data.total}</span>{' '}
            transaksi
          </p>
        )}

        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <TransactionRowSkeleton key={i} />
            ))}
          </div>
        ) : !data?.data.length ? (
          <div className="card flex flex-col items-center justify-center py-16 text-center">
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

      <TransactionFormModal
        open={modalOpen}
        onClose={handleModalClose}
        onSuccess={(closeModal?: boolean) => {
          refresh()
          if (closeModal !== false) handleModalClose()
        }}
        editData={editingTx}
      />
    </>
  )
}