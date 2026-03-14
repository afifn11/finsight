// types/index.ts
// FinSight — Global TypeScript Types

import type { Transaction, Category, Budget, User } from '@prisma/client'

// ── Re-export Prisma types ─────────────────────────────────────
export type { Transaction, Category, Budget, User }

// ── Extended types with relations ─────────────────────────────
export type TransactionWithCategory = Transaction & {
  category: Category
}

export type BudgetWithCategory = Budget & {
  category: Category
  spent: number      // Computed: total spent this period
  percentage: number // Computed: spent / amount * 100
}

// ── Dashboard types ────────────────────────────────────────────
export interface DashboardSummary {
  totalIncome: number
  totalExpense: number
  netBalance: number
  savingRate: number      // Percentage
  transactionCount: number
  periodLabel: string     // e.g. "Maret 2026"
}

export interface MonthlySummary {
  month: string           // e.g. "Jan", "Feb"
  year: number
  income: number
  expense: number
  balance: number
}

export interface CategoryBreakdown {
  categoryId: string
  categoryName: string
  categoryIcon: string
  categoryColor: string
  total: number
  percentage: number      // Of total expense
  transactionCount: number
}

// ── Transaction filters ────────────────────────────────────────
export interface TransactionFilters {
  type?: 'INCOME' | 'EXPENSE' | 'ALL'
  categoryId?: string
  dateFrom?: Date
  dateTo?: Date
  search?: string
  page?: number
  limit?: number
}

export interface PaginatedTransactions {
  data: TransactionWithCategory[]
  total: number
  page: number
  limit: number
  totalPages: number
}

// ── AI Insight types ───────────────────────────────────────────
export type InsightType = 'info' | 'warning' | 'tip' | 'achievement'

export interface Insight {
  title: string
  description: string
  type: InsightType
  icon?: string           // Optional Lucide icon name
}

export interface AiInsightData {
  insights: Insight[]
  generatedAt: string     // ISO date string
  month: number
  year: number
}

// ── API Response wrapper ───────────────────────────────────────
export interface ApiResponse<T> {
  data: T
  message?: string
}

export interface ApiError {
  error: string
  code?: string
  details?: unknown
}

// ── Form types ─────────────────────────────────────────────────
export interface TransactionFormData {
  amount: number
  type: 'INCOME' | 'EXPENSE'
  categoryId: string
  description: string
  date: Date
  notes?: string
  isRecurring: boolean
  recurringPeriod?: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY'
}

export interface BudgetFormData {
  categoryId: string
  amount: number
  period: 'MONTHLY' | 'YEARLY'
  alertThreshold: number
}

// ── Navigation ─────────────────────────────────────────────────
export interface NavItem {
  label: string
  href: string
  icon: string            // Lucide icon name
  badge?: number          // Optional notification count
}
