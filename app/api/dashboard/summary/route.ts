// app/api/dashboard/summary/route.ts
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { startOfMonth, endOfMonth, subMonths } from 'date-fns'
import type {
  ApiResponse,
  ApiError,
  DashboardSummary,
  MonthlySummary,
  CategoryBreakdown,
} from '@/types'

export interface DashboardData {
  summary: DashboardSummary
  monthlyTrend: MonthlySummary[]
  categoryBreakdown: CategoryBreakdown[]
}

interface TypeAggRow {
  type: 'INCOME' | 'EXPENSE'
  _sum: { amount: number | null }
  _count: number
}

interface CategoryAggRow {
  categoryId: string
  _sum: { amount: number | null }
  _count: number
}

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json<ApiError>({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = session.user.id
  const now = new Date()
  const monthStart = startOfMonth(now)
  const monthEnd = endOfMonth(now)

  // ── 1. Current month income + expense totals ───────────────
  const currentMonthAgg = await prisma.transaction.groupBy({
    by: ['type'],
    where: { userId, date: { gte: monthStart, lte: monthEnd } },
    _sum: { amount: true },
    _count: true,
  })

  // ── 2. Category breakdown for current month (expense only) ─
  const categoryAgg = await prisma.transaction.groupBy({
    by: ['categoryId'],
    where: {
      userId,
      type: 'EXPENSE',
      date: { gte: monthStart, lte: monthEnd },
    },
    _sum: { amount: true },
    _count: true,
    orderBy: { _sum: { amount: 'desc' } },
  })

  // ── 3. Last 6 months data for trend chart ──────────────────
  const last6MonthsData = await Promise.all(
    Array.from({ length: 6 }, (_, i) => {
      const monthDate = subMonths(now, 5 - i)
      const start = startOfMonth(monthDate)
      const end = endOfMonth(monthDate)
      return prisma.transaction
        .groupBy({
          by: ['type'],
          where: { userId, date: { gte: start, lte: end } },
          _sum: { amount: true },
        })
        .then((rows) => ({ monthDate, rows: rows as unknown as TypeAggRow[] }))
    })
  )

  // ── Compute summary ────────────────────────────────────────
  const monthAgg = currentMonthAgg as unknown as TypeAggRow[]
  const totalIncome = Number(monthAgg.find((r) => r.type === 'INCOME')?._sum.amount ?? 0)
  const totalExpense = Number(monthAgg.find((r) => r.type === 'EXPENSE')?._sum.amount ?? 0)
  const transactionCount = monthAgg.reduce((acc, r) => acc + r._count, 0)

  const summary: DashboardSummary = {
    totalIncome,
    totalExpense,
    netBalance: totalIncome - totalExpense,
    savingRate:
      totalIncome > 0 ? Math.round(((totalIncome - totalExpense) / totalIncome) * 100) : 0,
    transactionCount,
    periodLabel: now.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }),
  }

  // ── Compute monthly trend ──────────────────────────────────
  const monthlyTrend: MonthlySummary[] = last6MonthsData.map(({ monthDate, rows }) => {
    const income = Number(rows.find((r) => r.type === 'INCOME')?._sum.amount ?? 0)
    const expense = Number(rows.find((r) => r.type === 'EXPENSE')?._sum.amount ?? 0)
    return {
      month: monthDate.toLocaleDateString('id-ID', { month: 'short' }),
      year: monthDate.getFullYear(),
      income,
      expense,
      balance: income - expense,
    }
  })

  // ── Compute category breakdown ─────────────────────────────
  const catAgg = categoryAgg as unknown as CategoryAggRow[]
  const categoryIds = catAgg.map((c) => c.categoryId)
  const categories = await prisma.category.findMany({
    where: { id: { in: categoryIds } },
    select: { id: true, name: true, icon: true, color: true },
  })
  const catMap = new Map(categories.map((c) => [c.id, c]))

  const categoryBreakdown: CategoryBreakdown[] = catAgg.map((agg) => {
    const cat = catMap.get(agg.categoryId)
    const total = Number(agg._sum.amount ?? 0)
    return {
      categoryId: agg.categoryId,
      categoryName: cat?.name ?? 'Tidak diketahui',
      categoryIcon: cat?.icon ?? 'circle',
      categoryColor: cat?.color ?? '#94a3b8',
      total,
      percentage: totalExpense > 0 ? Math.round((total / totalExpense) * 100) : 0,
      transactionCount: agg._count,
    }
  })

  return NextResponse.json<ApiResponse<DashboardData>>({
    data: { summary, monthlyTrend, categoryBreakdown },
  })
}