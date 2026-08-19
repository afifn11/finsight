// hooks/index.ts
// FinSight — Custom React Hooks
// All data fetching hooks using native fetch + SWR-like pattern

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import type {
  BudgetWithCategory,
  PaginatedTransactions,
  TransactionFilters,
  AiInsightData,
} from '@/types'
import type { DashboardData } from '@/app/api/dashboard/summary/route'

// ── Generic fetcher ────────────────────────────────────────────
async function fetcher<T>(url: string): Promise<T> {
  const res = await fetch(url, { cache: 'no-store' })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }))
    throw new Error((err as { error?: string }).error ?? 'Request failed')
  }
  const json = await res.json() as { data: T }
  return json.data
}


// ── useDebounce ────────────────────────────────────────────────
export function useDebounce<T>(value: T, delay = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])

  return debouncedValue
}

// ── useDashboard ───────────────────────────────────────────────
export function useDashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const result = await fetcher<DashboardData>('/api/dashboard/summary')
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat data')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { void load() }, [load])

  return { data, isLoading, error, refresh: load }
}

// ── useTransactions ────────────────────────────────────────────
export function useTransactions(filters: TransactionFilters = {}) {
  const [data, setData] = useState<PaginatedTransactions | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Destructure primitives so useCallback deps don't change on every render
  // when the caller passes an inline object literal (e.g. useTransactions({ limit: 8 }))
  const {
    type,
    categoryId,
    dateFrom,
    dateTo,
    search,
    page,
    limit,
  } = filters

  const buildUrl = useCallback(() => {
    const params = new URLSearchParams()
    if (type && type !== 'ALL') params.set('type', type)
    if (categoryId) params.set('categoryId', categoryId)
    if (dateFrom) params.set('dateFrom', dateFrom.toISOString())
    if (dateTo) params.set('dateTo', dateTo.toISOString())
    if (search) params.set('search', search)
    if (page) params.set('page', String(page))
    if (limit) params.set('limit', String(limit))
    return `/api/transactions?${params.toString()}`
  }, [type, categoryId, dateFrom, dateTo, search, page, limit])

  const load = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const result = await fetcher<PaginatedTransactions>(buildUrl())
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat transaksi')
    } finally {
      setIsLoading(false)
    }
  }, [buildUrl])

  useEffect(() => { void load() }, [load])

  return { data, isLoading, error, refresh: load }
}

// ── useBudgets ─────────────────────────────────────────────────
export function useBudgets() {
  const [data, setData] = useState<BudgetWithCategory[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const result = await fetcher<BudgetWithCategory[]>('/api/budgets')
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat budget')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { void load() }, [load])

  return { data, isLoading, error, refresh: load }
}

// ── useAiInsight ───────────────────────────────────────────────
export function useAiInsight() {
  const [data, setData] = useState<AiInsightData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const result = await fetcher<AiInsightData>('/api/ai/insight')
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat AI insight')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { void load() }, [load])

  return { data, isLoading, error, refresh: load }
}

// ── useDeleteTransaction ───────────────────────────────────────
export function useDeleteTransaction(onSuccess?: () => void) {
  const [isDeleting, setIsDeleting] = useState(false)

  const deleteTransaction = useCallback(
    async (id: string) => {
      setIsDeleting(true)
      try {
        const res = await fetch(`/api/transactions/${id}`, { method: 'DELETE' })
        if (!res.ok) throw new Error('Gagal menghapus')
        toast.success('Transaksi berhasil dihapus')
        onSuccess?.()
      } catch {
        toast.error('Gagal menghapus transaksi')
      } finally {
        setIsDeleting(false)
      }
    },
    [onSuccess]
  )

  return { deleteTransaction, isDeleting }
}

// ── useCategories ──────────────────────────────────────────────
export function useCategories(forType?: 'INCOME' | 'EXPENSE') {
  const [data, setData] = useState<import('@/types').Category[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const url = forType
      ? `/api/categories?forType=${forType}`
      : '/api/categories'

    fetcher<import('@/types').Category[]>(url)
      .then(setData)
      .catch(() => toast.error('Gagal memuat kategori'))
      .finally(() => setIsLoading(false))
  }, [forType])

  return { data, isLoading }
}