// app/api/cron/daily-check/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Resend } from 'resend'
import { render } from '@react-email/render'
import {
  startOfMonth,
  endOfMonth,
  startOfDay,
  differenceInDays,
  format,
} from 'date-fns'
import { id as localeId } from 'date-fns/locale'
import {
  AlertEmail,
  type BudgetWarningItem,
  type SubscriptionReminderItem,
} from '@/components/emails/AlertEmail'
import * as React from 'react'

function formatRupiah(num: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(num)
}

function getCycleLabel(cycle: string): string {
  switch (cycle) {
    case 'WEEKLY':
      return 'Mingguan'
    case 'YEARLY':
      return 'Tahunan'
    case 'MONTHLY':
    default:
      return 'Bulanan'
  }
}

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const resendApiKey = process.env.RESEND_API_KEY
    const resend = resendApiKey ? new Resend(resendApiKey) : null
    const fromEmail = process.env.RESEND_FROM_EMAIL ?? 'FinSight <onboarding@resend.dev>'

    const now = new Date()
    const todayStart = startOfDay(now)
    const monthStart = startOfMonth(now)
    const monthEnd = endOfMonth(now)

    const users = await prisma.user.findMany({
      include: {
        budgets: {
          where: { isActive: true },
          include: { category: true },
        },
        subscriptions: {
          where: { status: 'ACTIVE' },
        },
      },
    })

    let emailsSent = 0
    const alertsSummary: Array<{
      email: string
      budgetAlerts: number
      subscriptionReminders: number
    }> = []

    for (const user of users) {
      if (!user.email) continue

      // 1. Check active budgets where spent / amount > 0.8
      const budgetWarnings: BudgetWarningItem[] = []

      if (user.budgets.length > 0) {
        const categoryExpenses = await prisma.transaction.groupBy({
          by: ['categoryId'],
          where: {
            userId: user.id,
            type: 'EXPENSE',
            date: { gte: monthStart, lte: monthEnd },
          },
          _sum: { amount: true },
        })

        const spentMap = new Map(
          categoryExpenses.map((row) => [row.categoryId, Number(row._sum.amount ?? 0)])
        )

        for (const budget of user.budgets) {
          const limit = Number(budget.amount ?? 0)
          if (limit <= 0) continue

          const spent = spentMap.get(budget.categoryId) ?? 0
          const ratio = spent / limit

          if (ratio > 0.8) {
            budgetWarnings.push({
              categoryName: budget.category.name,
              spent: formatRupiah(spent),
              limit: formatRupiah(limit),
              percentage: Math.round(ratio * 100),
            })
          }
        }
      }

      // 2. Check subscriptions where next billing date is exactly 3 days away
      const subscriptionReminders: SubscriptionReminderItem[] = []

      for (const sub of user.subscriptions) {
        const billingDateStart = startOfDay(new Date(sub.nextBillingDate))
        const daysAway = differenceInDays(billingDateStart, todayStart)

        if (daysAway === 3) {
          subscriptionReminders.push({
            name: sub.name,
            amount: formatRupiah(Number(sub.amount)),
            dueDate: format(new Date(sub.nextBillingDate), 'dd MMMM yyyy', { locale: localeId }),
            billingCycle: getCycleLabel(sub.billingCycle),
          })
        }
      }

      // 3. Send AlertEmail if any conditions are met
      if (budgetWarnings.length > 0 || subscriptionReminders.length > 0) {
        alertsSummary.push({
          email: user.email,
          budgetAlerts: budgetWarnings.length,
          subscriptionReminders: subscriptionReminders.length,
        })

        if (resend) {
          const html = await render(
            React.createElement(AlertEmail, {
              userName: user.name ?? 'Pengguna FinSight',
              budgetWarnings,
              subscriptionReminders,
            })
          )

          await resend.emails.send({
            from: fromEmail,
            to: user.email,
            subject: '⚠️ Peringatan Harian FinSight: Cek Budget & Tagihan Rutinmu',
            html,
          })

          emailsSent++
        }
      }
    }

    return NextResponse.json({
      success: true,
      processedUsers: users.length,
      emailsSent,
      alertsSummary,
      timestamp: now.toISOString(),
    })
  } catch (error) {
    console.error('[CRON_DAILY_CHECK_ERROR]', error)
    return NextResponse.json(
      { error: 'Internal server error running daily check' },
      { status: 500 }
    )
  }
}
