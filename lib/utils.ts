// lib/utils.ts
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns'
import { id as localeId } from 'date-fns/locale'

// ── Tailwind class merger ──────────────────────────────────────
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}

// ── Currency formatter ─────────────────────────────────────────
export function formatCurrency(
  amount: number,
  currency = 'IDR',
  locale = 'id-ID'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

// Short format: Rp 1,5 jt / Rp 2,3 M
export function formatCurrencyShort(amount: number): string {
  if (amount >= 1_000_000_000) {
    return `Rp ${(amount / 1_000_000_000).toFixed(1)} M`
  }
  if (amount >= 1_000_000) {
    return `Rp ${(amount / 1_000_000).toFixed(1)} jt`
  }
  if (amount >= 1_000) {
    return `Rp ${(amount / 1_000).toFixed(0)} rb`
  }
  return `Rp ${amount}`
}

// ── Date helpers ───────────────────────────────────────────────
export function formatDate(date: Date | string, pattern = 'dd MMM yyyy'): string {
  return format(new Date(date), pattern, { locale: localeId })
}

export function formatDateShort(date: Date | string): string {
  return format(new Date(date), 'dd MMM', { locale: localeId })
}

export function formatMonth(date: Date | string): string {
  return format(new Date(date), 'MMMM yyyy', { locale: localeId })
}

export function getCurrentMonthRange(): { start: Date; end: Date } {
  const now = new Date()
  return {
    start: startOfMonth(now),
    end: endOfMonth(now),
  }
}

export function getLastNMonthsRange(n: number): { start: Date; end: Date } {
  const now = new Date()
  return {
    start: startOfMonth(subMonths(now, n - 1)),
    end: endOfMonth(now),
  }
}

// ── Percentage helpers ─────────────────────────────────────────
export function calculatePercentage(value: number, total: number): number {
  if (total === 0) return 0
  return Math.round((value / total) * 100)
}

export function formatPercentage(value: number): string {
  return `${value.toFixed(1)}%`
}

// ── Budget status ──────────────────────────────────────────────
export type BudgetStatus = 'safe' | 'warning' | 'danger' | 'exceeded'

export function getBudgetStatus(percentage: number): BudgetStatus {
  if (percentage >= 100) return 'exceeded'
  if (percentage >= 80) return 'danger'
  if (percentage >= 60) return 'warning'
  return 'safe'
}

export function getBudgetStatusColor(status: BudgetStatus): string {
  const colors: Record<BudgetStatus, string> = {
    safe: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444',
    exceeded: '#dc2626',
  }
  return colors[status]
}

// ── Transaction type helpers ───────────────────────────────────
export function getTransactionSign(type: 'INCOME' | 'EXPENSE'): string {
  return type === 'INCOME' ? '+' : '-'
}

export function getTransactionColor(type: 'INCOME' | 'EXPENSE'): string {
  return type === 'INCOME' ? 'text-income' : 'text-expense'
}

// ── Truncate text ──────────────────────────────────────────────
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return `${text.slice(0, maxLength)}...`
}

// ── Generate initials for avatar ───────────────────────────────
export function getInitials(name: string | null | undefined): string {
  if (!name) return 'U'
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
}

// ── Sleep utility for dev ──────────────────────────────────────
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
