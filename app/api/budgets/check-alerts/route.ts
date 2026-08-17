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

  const alerts = await prisma.budgetAlert.findMany({
    where: { budget: { userId }, month, year },
    include: { budget: { include: { category: true } } },
    orderBy: { triggeredAt: 'desc' },
  })

  const monthStart = startOfMonth(now)
  const monthEnd = endOfMonth(now)

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