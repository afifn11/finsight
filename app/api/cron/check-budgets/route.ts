// app/api/cron/check-budgets/route.ts
// Dipanggil Vercel Cron secara berkala (lihat vercel.json) untuk cek
// SEMUA user, bukan cuma yang baru tambah transaksi. Vercel otomatis
// mengirim header "Authorization: Bearer $CRON_SECRET" untuk request
// yang berasal dari Cron Jobs mereka, jadi ini aman dari akses publik.
import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { prisma } from '@/lib/prisma'
import { checkBudgetAlertsForUser } from '@/lib/budget-alerts'
import { sendPushToUser } from '@/lib/push'

export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) {
    console.error('[CRON_CONFIG_ERROR] CRON_SECRET is not configured in environment variables')
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
  }

  const authHeader = req.headers.get('authorization') ?? ''
  const expectedHeader = `Bearer ${cronSecret}`

  // Constant-time comparison untuk mencegah timing attack pada cron secret
  const isMatch =
    authHeader.length === expectedHeader.length &&
    crypto.timingSafeEqual(Buffer.from(authHeader), Buffer.from(expectedHeader))

  if (!isMatch) {
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
