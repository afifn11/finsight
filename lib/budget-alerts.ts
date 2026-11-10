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

  // 1. Fetch active budgets with lean projections
  const budgets = await prisma.budget.findMany({
    where: { userId, isActive: true },
    select: {
      id: true,
      categoryId: true,
      amount: true,
      alertThreshold: true,
      category: {
        select: { name: true },
      },
    },
  })

  if (budgets.length === 0) return []

  // 2. Aggregate monthly expense spending per category
  const spending = await prisma.transaction.groupBy({
    by: ['categoryId'],
    where: { userId, type: 'EXPENSE', date: { gte: monthStart, lte: monthEnd } },
    _sum: { amount: true },
  })

  const spendMap = new Map(
    (spending as unknown as CategorySpendRow[]).map((s) => [s.categoryId, Number(s._sum.amount ?? 0)])
  )

  // 3. Batch fetch existing alerts this month to eliminate serial findUnique in loop
  const budgetIds = budgets.map((b) => b.id)
  const existingAlerts = await prisma.budgetAlert.findMany({
    where: { budgetId: { in: budgetIds }, month, year },
    select: { budgetId: true },
  })
  const existingAlertSet = new Set(existingAlerts.map((a) => a.budgetId))

  const triggered: TriggeredBudgetAlert[] = []
  const alertsToCreate: { budgetId: string; percentage: number; month: number; year: number }[] = []

  for (const budget of budgets) {
    const spent = spendMap.get(budget.categoryId) ?? 0
    const percentage = Math.round((spent / Number(budget.amount)) * 100)
    const threshold = budget.alertThreshold ?? 80

    if (percentage >= threshold && !existingAlertSet.has(budget.id)) {
      alertsToCreate.push({
        budgetId: budget.id,
        percentage,
        month,
        year,
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

  // 4. Batch insert alerts with skipDuplicates to prevent P2002 race-condition crashes
  if (alertsToCreate.length > 0) {
    await prisma.budgetAlert.createMany({
      data: alertsToCreate,
      skipDuplicates: true,
    })
  }

  return triggered
}
