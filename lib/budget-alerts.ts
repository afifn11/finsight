// lib/budget-alerts.ts
// Logic inti cek budget alert — dipakai oleh:
// 1. app/api/budgets/check-alerts (dipanggil setelah transaksi baru, single user)
// 2. app/api/cron/check-budgets (dipanggil cron Vercel berkala, semua user)
import { prisma } from '@/lib/prisma'
import { startOfMonth, endOfMonth } from 'date-fns'

interface CategorySpendRow {
  categoryId: string
  _sum: { amount: number | null }
}

export interface TriggeredBudgetAlert {
  budgetId: string
  categoryName: string
  percentage: number
  spent: number
  budgetAmount: number
}

export async function checkBudgetAlertsForUser(userId: string): Promise<TriggeredBudgetAlert[]> {
  const now = new Date()
  const month = now.getMonth() + 1
  const year = now.getFullYear()
  const monthStart = startOfMonth(now)
  const monthEnd = endOfMonth(now)

  const budgets = await prisma.budget.findMany({
    where: { userId, isActive: true },
    include: { category: true },
  })

  if (budgets.length === 0) return []

  const spending = await prisma.transaction.groupBy({
    by: ['categoryId'],
    where: { userId, type: 'EXPENSE', date: { gte: monthStart, lte: monthEnd } },
    _sum: { amount: true },
  })

  const spendMap = new Map(
    (spending as unknown as CategorySpendRow[]).map((s) => [s.categoryId, Number(s._sum.amount ?? 0)])
  )

  const triggered: TriggeredBudgetAlert[] = []

  for (const budget of budgets) {
    const spent = spendMap.get(budget.categoryId) ?? 0
    const percentage = Math.round((spent / Number(budget.amount)) * 100)
    const threshold = budget.alertThreshold ?? 80

    if (percentage >= threshold) {
      const existing = await prisma.budgetAlert.findUnique({
        where: { budgetId_month_year: { budgetId: budget.id, month, year } },
      })

      if (!existing) {
        await prisma.budgetAlert.create({
          data: { budgetId: budget.id, percentage, month, year },
        })

        triggered.push({
          budgetId: budget.id,
          categoryName: budget.category.name,
          percentage,
          spent,
          budgetAmount: Number(budget.amount),
        })
      }
    }
  }

  return triggered
}