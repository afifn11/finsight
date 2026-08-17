// app/api/cron/check-budgets/route.ts
// Dipanggil Vercel Cron secara berkala (lihat vercel.json) untuk cek
// SEMUA user, bukan cuma yang baru tambah transaksi. Vercel otomatis
// mengirim header "Authorization: Bearer $CRON_SECRET" untuk request
// yang berasal dari Cron Jobs mereka, jadi ini aman dari akses publik.
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { checkBudgetAlertsForUser } from '@/lib/budget-alerts'
import { sendPushToUser } from '@/lib/push'

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const users = await prisma.user.findMany({
    where: { budgets: { some: { isActive: true } } },
    select: { id: true },
  })

  const fmt = (n: number) => new Intl.NumberFormat('id-ID').format(n)
  let totalTriggered = 0

  for (const user of users) {
    const triggered = await checkBudgetAlertsForUser(user.id)
    if (triggered.length > 0) {
      totalTriggered += triggered.length
      await Promise.allSettled(
        triggered.map((a) =>
          sendPushToUser(user.id, {
            title: `Budget ${a.categoryName} sudah ${a.percentage}% terpakai`,
            body: `Rp${fmt(a.spent)} dari Rp${fmt(a.budgetAmount)}`,
            url: '/budgets',
          })
        )
      )
    }
  }

  return NextResponse.json({ checkedUsers: users.length, triggeredAlerts: totalTriggered })
}