// app/api/cron/monthly-report/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Resend } from 'resend'
import { render } from '@react-email/render'
import { subMonths, startOfMonth, endOfMonth, format } from 'date-fns'
import { id as localeId } from 'date-fns/locale'
import { MonthlyReportEmail } from '@/components/emails/MonthlyReportEmail'
import * as React from 'react'

function formatRupiah(num: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(num)
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
    const prevMonthDate = subMonths(now, 1)
    const monthStart = startOfMonth(prevMonthDate)
    const monthEnd = endOfMonth(prevMonthDate)
    const monthLabel = format(prevMonthDate, 'MMMM yyyy', { locale: localeId })

    const users = await prisma.user.findMany()
    let emailsSent = 0
    const reportsSummary: Array<{
      email: string
      totalIncome: number
      totalExpense: number
      netCashflow: number
    }> = []

    for (const user of users) {
      if (!user.email) continue

      const transactions = await prisma.transaction.findMany({
        where: {
          userId: user.id,
          date: { gte: monthStart, lte: monthEnd },
        },
        include: {
          category: true,
        },
      })

      let totalIncome = 0
      let totalExpense = 0
      const categorySpendMap = new Map<string, { name: string; total: number }>()

      for (const tx of transactions) {
        const amount = Number(tx.amount ?? 0)
        if (tx.type === 'INCOME') {
          totalIncome += amount
        } else if (tx.type === 'EXPENSE') {
          totalExpense += amount
          const catName = tx.category?.name ?? 'Lainnya'
          const existing = categorySpendMap.get(catName) ?? { name: catName, total: 0 }
          existing.total += amount
          categorySpendMap.set(catName, existing)
        }
      }

      const netCashflow = totalIncome - totalExpense
      const sortedCategories = Array.from(categorySpendMap.values()).sort(
        (a, b) => b.total - a.total
      )
      const topCategory = sortedCategories[0] ?? {
        name: 'Tidak ada pengeluaran',
        total: 0,
      }

      reportsSummary.push({
        email: user.email,
        totalIncome,
        totalExpense,
        netCashflow,
      })

      if (resend) {
        const html = await render(
          React.createElement(MonthlyReportEmail, {
            userName: user.name ?? 'Pengguna FinSight',
            monthLabel,
            totalIncome: formatRupiah(totalIncome),
            totalExpense: formatRupiah(totalExpense),
            netCashflow: formatRupiah(netCashflow),
            isPositiveCashflow: netCashflow >= 0,
            topCategoryName: topCategory.name,
            topCategoryAmount: formatRupiah(topCategory.total),
          })
        )

        await resend.emails.send({
          from: fromEmail,
          to: user.email,
          subject: `📊 Laporan Keuangan Bulanan FinSight — ${monthLabel}`,
          html,
        })

        emailsSent++
      }
    }

    return NextResponse.json({
      success: true,
      month: monthLabel,
      processedUsers: users.length,
      emailsSent,
      reportsSummary,
      timestamp: now.toISOString(),
    })
  } catch (error) {
    console.error('[CRON_MONTHLY_REPORT_ERROR]', error)
    return NextResponse.json(
      { error: 'Internal server error generating monthly reports' },
      { status: 500 }
    )
  }
}
