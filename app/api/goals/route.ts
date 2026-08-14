// app/api/goals/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import type { ApiError, ApiResponse } from '@/types'
import type { FinancialGoal } from '@prisma/client'

const goalSchema = z.object({
  name: z.string().min(1).max(50),
  targetAmount: z.coerce.number().positive().transform((v) => Math.round(v)),
  currentAmount: z.coerce.number().min(0).default(0).transform((v) => Math.round(v)),
  deadline: z.coerce.date().optional().nullable(),
  icon: z.string().default('target'),
  color: z.string().default('#4ade80'),
  notes: z.string().max(500).optional().nullable(),
})

export async function GET(_req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json<ApiError>({ error: 'Unauthorized' }, { status: 401 })
  }

  const goals = await prisma.financialGoal.findMany({
    where: { userId: session.user.id, status: 'ACTIVE' },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json<ApiResponse<FinancialGoal[]>>({ data: goals })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json<ApiError>({ error: 'Unauthorized' }, { status: 401 })
  }

  const body: unknown = await req.json()
  const parsed = goalSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json<ApiError>(
      { error: 'Validasi gagal', details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  const goal = await prisma.financialGoal.create({
    data: {
      userId: session.user.id,
      name: parsed.data.name,
      targetAmount: parsed.data.targetAmount,
      currentAmount: parsed.data.currentAmount,
      deadline: parsed.data.deadline ?? null,
      icon: parsed.data.icon,
      color: parsed.data.color,
      notes: parsed.data.notes ?? null,
    },
  })

  return NextResponse.json<ApiResponse<FinancialGoal>>(
    { data: goal, message: 'Goal berhasil dibuat' },
    { status: 201 }
  )
}