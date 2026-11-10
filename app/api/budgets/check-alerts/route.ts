// app/api/budgets/check-alerts/route.ts
// Dipanggil setelah setiap transaksi baru dibuat — cek budget & kirim push.
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { startOfMonth, endOfMonth } from 'date-fns'
import { checkBudgetAlertsForUser } from '@/lib/budget-alerts'
import { sendPushToUser } from '@/lib/push'

export async function POST(_req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const triggered = await checkBudgetAlertsForUser(session.user.id)

  if (triggered.length > 0) {
    const fmt = (n: number) => new Intl.NumberFormat('id-ID').format(n)
    await Promise.allSettled(
      triggered.map((a) =>
        sendPushToUser(session.user.id, {
          title: `Budget ${a.categoryName} sudah ${a.percentage}% terpakai`,
          body: `Rp${fmt(a.spent)} dari Rp${fmt(a.budgetAmount)}`,
          url: '/budgets',
        })
      )
    )
  }

  return NextResponse.json({ data: triggered })
}

// GET — get active alerts for current month (for notification badge)
export async function GET(_req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = session.user.id
  const now = new Date()
  const month = now.getMonth() + 1
  const year = now.getFullYear()

  // 1. Fetch active alerts with lean projections
  const alerts = await prisma.budgetAlert.findMany({
    where: { budget: { userId }, month, year },
    include: {
      budget: {
        select: {
          id: true,
          categoryId: true,
          amount: true,
          alertThreshold: true,
          category: {
            select: { name: true, color: true },
          },
        },
      },
    },
    orderBy: { triggeredAt: 'desc' },
  })

  if (alerts.length === 0) {
    return NextResponse.json({ data: [] })
  }

  const monthStart = startOfMonth(now)
  const monthEnd = endOfMonth(now)
  const categoryIds = Array.from(new Set(alerts.map((a) => a.budget.categoryId)))

  // 2. Single grouped aggregation across all alert categories to eliminate N+1 queries
  const spendingAgg = await prisma.transaction.groupBy({
    by: ['categoryId'],
    where: {
      userId,
      categoryId: { in: categoryIds },
      type: 'EXPENSE',
      date: { gte: monthStart, lte: monthEnd },
    },
    _sum: { amount: true },
  })

  const spendMap = new Map(
    spendingAgg.map((s) => [s.categoryId, Number(s._sum.amount ?? 0)])
  )

  const alertsWithSpending = alerts.map((alert) => {
    const spent = spendMap.get(alert.budget.categoryId) ?? 0
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

  return NextResponse.json({ data: alertsWithSpending })
}