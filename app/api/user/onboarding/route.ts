// app/api/user/onboarding/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import type { ApiResponse, ApiError } from '@/types'

const onboardingSchema = z.object({
  currency: z.string().length(3).default('IDR'),
  timezone: z.string().default('Asia/Jakarta'),
  budgets: z
    .array(
      z.object({
        categoryId: z.string().min(1),
        amount: z.number().positive(),
      })
    )
    .default([]),
})

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json<ApiError>({ error: 'Unauthorized' }, { status: 401 })
  }

  const body: unknown = await req.json()
  const parsed = onboardingSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json<ApiError>(
      { error: 'Validasi gagal', details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  const { currency, timezone, budgets } = parsed.data
  const userId = session.user.id

  // Run all operations in parallel
  await Promise.all([
    // 1. Update user preferences + mark onboarding done
    prisma.user.update({
      where: { id: userId },
      data: { currency, timezone, onboardingDone: true },
    }),

    // 2. Create initial budgets (if any selected)
    ...budgets.map((b) =>
      prisma.budget.upsert({
        where: {
          userId_categoryId_period: {
            userId,
            categoryId: b.categoryId,
            period: 'MONTHLY',
          },
        },
        update: { amount: b.amount },
        create: {
          userId,
          categoryId: b.categoryId,
          amount: b.amount,
          period: 'MONTHLY',
          alertThreshold: 80,
        },
      })
    ),
  ])

  return NextResponse.json<ApiResponse<{ done: boolean }>>({
    data: { done: true },
    message: 'Onboarding selesai',
  })
}