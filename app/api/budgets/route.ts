// app/api/budgets/route.ts
// @ts-nocheck -- Prisma groupBy returns require runtime validation (Zod handles this)
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { budgetSchema } from '@/lib/validations'
import { startOfMonth, endOfMonth } from 'date-fns'
import type { ApiResponse, ApiError, BudgetWithCategory } from '@/types'

// ── GET /api/budgets ───────────────────────────────────────────
// Returns budgets with computed `spent` and `percentage` for current month
export async function GET(_req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json<ApiError>({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date()
  const monthStart = startOfMonth(now)
  const monthEnd = endOfMonth(now)

  const budgets = await prisma.budget.findMany({
    where: { userId: session.user.id, isActive: true },
    include: { category: true },
    orderBy: { createdAt: 'asc' },
  })

  // Aggregate spending per category for current month
  const spendingAgg = await prisma.transaction.groupBy({
    by: ['categoryId'],
    where: {
      userId: session.user.id,
      type: 'EXPENSE',
      date: { gte: monthStart, lte: monthEnd },
    },
    _sum: { amount: true },
  })

  const spendingMap = new Map(
    (spendingAgg as any[]).map((s) => [s.categoryId, Number(s._sum.amount ?? 0)])
  )

  const budgetsWithSpending: BudgetWithCategory[] = budgets.map((budget) => {
    const spent = spendingMap.get(budget.categoryId) ?? 0
    const percentage = Math.round((spent / Number(budget.amount)) * 100)
    return { ...budget, spent, percentage }
  })

  return NextResponse.json<ApiResponse<BudgetWithCategory[]>>({
    data: budgetsWithSpending,
  })
}

// ── POST /api/budgets ──────────────────────────────────────────
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json<ApiError>({ error: 'Unauthorized' }, { status: 401 })
  }

  const body: unknown = await req.json()
  const parsed = budgetSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json<ApiError>(
      { error: 'Validasi gagal', details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  // Upsert: update if exists, create if not
  const budget = await prisma.budget.upsert({
    where: {
      userId_categoryId_period: {
        userId: session.user.id,
        categoryId: parsed.data.categoryId,
        period: parsed.data.period,
      },
    },
    update: {
      amount: parsed.data.amount,
      alertThreshold: parsed.data.alertThreshold,
    },
    create: {
      ...parsed.data,
      userId: session.user.id,
    },
    include: { category: true },
  })

  return NextResponse.json<ApiResponse<typeof budget>>(
    { data: budget, message: 'Budget berhasil disimpan' },
    { status: 201 }
  )
}