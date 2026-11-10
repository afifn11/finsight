// app/api/subscriptions/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { subscriptionSchema } from '@/lib/validations'
import { startOfMonth, endOfMonth } from 'date-fns'
import type { ApiResponse, ApiError, SubscriptionsResponse } from '@/types'

// ── GET /api/subscriptions ─────────────────────────────────────
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json<ApiError>({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = session.user.id

  const subscriptions = await prisma.subscription.findMany({
    where: { userId },
    orderBy: { nextBillingDate: 'asc' },
  })

  const now = new Date()
  const mStart = startOfMonth(now)
  const mEnd = endOfMonth(now)

  let monthlyCommitment = 0
  let activeCount = 0
  let upcomingThisMonthCount = 0

  for (const sub of subscriptions) {
    const numAmount = Number(sub.amount)

    if (sub.status === 'ACTIVE') {
      activeCount++
      if (sub.billingCycle === 'WEEKLY') {
        monthlyCommitment += (numAmount * 52) / 12
      } else if (sub.billingCycle === 'MONTHLY') {
        monthlyCommitment += numAmount
      } else if (sub.billingCycle === 'YEARLY') {
        monthlyCommitment += numAmount / 12
      }
    }

    if (sub.status === 'ACTIVE' && sub.nextBillingDate >= mStart && sub.nextBillingDate <= mEnd) {
      upcomingThisMonthCount++
    }
  }

  const responseData: SubscriptionsResponse = {
    subscriptions,
    monthlyCommitment: Math.round(monthlyCommitment),
    activeCount,
    upcomingThisMonthCount,
  }

  return NextResponse.json<ApiResponse<SubscriptionsResponse>>({
    data: responseData,
  })
}

// ── POST /api/subscriptions ────────────────────────────────────
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json<ApiError>({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = (await req.json()) as unknown
  const parsed = subscriptionSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json<ApiError>(
      {
        error: parsed.error.issues[0]?.message ?? 'Data langganan tidak valid',
        details: parsed.error.format(),
      },
      { status: 400 }
    )
  }

  const subscription = await prisma.subscription.create({
    data: {
      userId: session.user.id,
      name: parsed.data.name,
      amount: parsed.data.amount,
      billingCycle: parsed.data.billingCycle,
      nextBillingDate: parsed.data.nextBillingDate,
      category: parsed.data.category,
      color: parsed.data.color,
      icon: parsed.data.icon,
      status: parsed.data.status,
      notes: parsed.data.notes ?? null,
    },
  })

  return NextResponse.json<ApiResponse<typeof subscription>>(
    {
      data: subscription,
      message: 'Langganan berhasil ditambahkan',
    },
    { status: 201 }
  )
}
