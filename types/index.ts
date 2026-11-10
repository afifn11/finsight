// types/index.ts
// FinSight — Global TypeScript Types

import type {
  Transaction,
  Category,
  Budget,
  User,
  Wallet,
  WalletType,
  WalletTransfer,
  Subscription,
  SubscriptionCycle,
  SubscriptionStatus,
  UserAchievement,
} from '@prisma/client'

// ── Re-export Prisma types ─────────────────────────────────────
export type {
  Transaction,
  Category,
  Budget,
  User,
  Wallet,
  WalletType,
  WalletTransfer,
  Subscription,
  SubscriptionCycle,
  SubscriptionStatus,
  UserAchievement,
}

// ── Extended types with relations ─────────────────────────────
export type TransactionWithCategory = Transaction & {
  category: Category
  wallet?: Wallet | null
  receiptUrl?: string | null
  receiptPath?: string | null
  receiptName?: string | null
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
  walletId?: string | null
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

// ── Multi-wallet types ─────────────────────────────────────────
export interface WalletWithBalance extends Wallet {
  balanceNumber: number
}

export interface WalletTransferInput {
  fromWalletId: string
  toWalletId: string
  amount: number
  fee?: number
  notes?: string | null
  date?: Date | string
}

export interface WalletsResponse {
  wallets: Wallet[]
  netWorth: number
  breakdownByType: Record<string, number>
}

// ── Subscription types ─────────────────────────────────────────
export interface SubscriptionFormData {
  name: string
  amount: number
  billingCycle: SubscriptionCycle
  nextBillingDate: Date | string
  category?: string
  color?: string
  icon?: string
  status?: SubscriptionStatus
  notes?: string | null
}

export interface SubscriptionsResponse {
  subscriptions: Subscription[]
  monthlyCommitment: number
  activeCount: number
  upcomingThisMonthCount: number
}

// ── Bank Statement Parser types ────────────────────────────────
export interface ParsedStatementTransaction {
  id: string
  date: string
  description: string
  amount: number
  type: 'INCOME' | 'EXPENSE'
  categoryName: string
  categoryId?: string | undefined
  selected?: boolean | undefined
}

export interface BankStatementParseResponse {
  transactions: ParsedStatementTransaction[]
  count: number
  detectedBank?: string | undefined
}

export interface BankStatementImportPayload {
  walletId?: string | null | undefined
  transactions: Array<{
    date: string
    description: string
    amount: number
    type: 'INCOME' | 'EXPENSE'
    categoryId?: string | undefined
    categoryName?: string | undefined
  }>
}

// ── Gamification & Achievements types ──────────────────────────
export interface AchievementBadge {
  key: string
  title: string
  description: string
  icon: string
  unlocked: boolean
  unlockedAt: string | null
  progress: number // 0 - 100
  currentVal: number
  targetVal: number
  unit?: string | undefined
}

export interface AchievementsResponse {
  badges: AchievementBadge[]
  unlockedCount: number
  totalCount: number
  totalPoints: number
}

// ── Navigation ─────────────────────────────────────────────────
export interface NavItem {
  label: string
  href: string
  icon: string            // Lucide icon name
  badge?: number          // Optional notification count
}