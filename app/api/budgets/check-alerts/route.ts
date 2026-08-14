// app/api/budgets/check-alerts/route.ts
// Dipanggil setelah setiap transaksi baru dibuat.
// Cek apakah ada budget yang melewati threshold dan buat alert.
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { startOfMonth, endOfMonth } from 'date-fns'
import type { ApiError } from '@/types'

interface CategorySpendRow {
  categoryId: string
  _sum: { amount: number | null }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json<ApiError>({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = session.user.id
  const now = new Date()
  const month = now.getMonth() + 1
  const year = now.getFullYear()
  const monthStart = startOfMonth(now)
  const monthEnd = endOfMonth(now)

  // Get all active budgets
  const budgets = await prisma.budget.findMany({
    where: { userId, isActive: true },
    include: { category: true },
  })

  if (budgets.length === 0) {
    return NextResponse.json({ data: [] })
  }

  // Get spending per category this month
  const spending = await prisma.transaction.groupBy({
    by: ['categoryId'],
    where: {
      userId,
      type: 'EXPENSE',
      date: { gte: monthStart, lte: monthEnd },
    },
    _sum: { amount: true },
  })

  const spendMap = new Map(
    (spending as unknown as CategorySpendRow[]).map((s) => [
      s.categoryId,
      Number(s._sum.amount ?? 0),
    ])
  )

  const triggeredAlerts: Array<{
    budgetId: string
    categoryName: string
    percentage: number
    spent: number
    budgetAmount: number
  }> = []

  for (const budget of budgets) {
    const spent = spendMap.get(budget.categoryId) ?? 0
    const percentage = Math.round((spent / Number(budget.amount)) * 100)
    const threshold = budget.alertThreshold ?? 80

    if (percentage >= threshold) {
      // Check if alert already sent this month
      const existing = await prisma.budgetAlert.findUnique({
        where: { budgetId_month_year: { budgetId: budget.id, month, year } },
      })

      if (!existing) {
        await prisma.budgetAlert.create({
          data: {
            budgetId: budget.id,
            percentage,
            month,
            year,
          },
        })

        triggeredAlerts.push({
          budgetId: budget.id,
          categoryName: budget.category.name,
          percentage,
          spent,
          budgetAmount: Number(budget.amount),
        })
      }
    }
  }

  return NextResponse.json({ data: triggeredAlerts })
}

// GET — get active alerts for current month (for notification badge)
export async function GET(_req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json<ApiError>({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = session.user.id
  const now = new Date()
  const month = now.getMonth() + 1
  const year = now.getFullYear()

  const alerts = await prisma.budgetAlert.findMany({
    where: {
      budget: { userId },
      month,
      year,
    },
    include: {
      budget: {
        include: { category: true },
      },
    },
    orderBy: { triggeredAt: 'desc' },
  })

  const monthStart = startOfMonth(now)
  const monthEnd = endOfMonth(now)

  // Get current spending for each alerted budget
  const alertsWithSpending = await Promise.all(
    alerts.map(async (alert) => {
      const spending = await prisma.transaction.aggregate({
        where: {
          userId,
          categoryId: alert.budget.categoryId,
          type: 'EXPENSE',
          date: { gte: monthStart, lte: monthEnd },
        },
        _sum: { amount: true },
      })
      const spent = Number(spending._sum.amount ?? 0)
      const percentage = Math.round((spent / Number(alert.budget.amount)) * 100)

      return {
        id: alert.id,
        categoryName: alert.budget.category.name,
        categoryColor: alert.budget.category.color,
        budgetAmount: Number(alert.budget.amount),
        spent,
        percentage,
        threshold: alert.budget.alertThreshold,
        triggeredAt: alert.triggeredAt,
      }
    })
  )

  return NextResponse.json({ data: alertsWithSpending })
}