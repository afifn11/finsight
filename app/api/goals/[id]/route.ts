// app/api/goals/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import type { ApiError, ApiResponse } from '@/types'
import type { FinancialGoal, Prisma } from '@prisma/client'

const updateSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  targetAmount: z
    .coerce.number()
    .positive()
    .optional()
    .transform((v) => (v !== undefined ? Math.round(v) : undefined)),
  currentAmount: z
    .coerce.number()
    .min(0)
    .optional()
    .transform((v) => (v !== undefined ? Math.round(v) : undefined)),
  deadline: z.coerce.date().optional().nullable(),
  icon: z.string().optional(),
  color: z.string().optional(),
  notes: z.string().max(500).optional().nullable(),
  status: z.enum(['ACTIVE', 'COMPLETED', 'CANCELLED']).optional(),
})

type RouteParams = { params: Promise<{ id: string }> }

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json<ApiError>({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const existing = await prisma.financialGoal.findFirst({
    where: { id, userId: session.user.id },
  })
  if (!existing) {
    return NextResponse.json<ApiError>({ error: 'Goal tidak ditemukan' }, { status: 404 })
  }

  const body: unknown = await req.json()
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json<ApiError>({ error: 'Validasi gagal' }, { status: 400 })
  }

  const updateData: Prisma.FinancialGoalUpdateInput = parsed.data

  const updated = await prisma.financialGoal.update({
    where: { id },
    data: updateData,
  })

  return NextResponse.json<ApiResponse<FinancialGoal>>({ data: updated })
}

export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json<ApiError>({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const existing = await prisma.financialGoal.findFirst({
    where: { id, userId: session.user.id },
  })
  if (!existing) {
    return NextResponse.json<ApiError>({ error: 'Goal tidak ditemukan' }, { status: 404 })
  }

  await prisma.financialGoal.delete({ where: { id } })
  return NextResponse.json({ message: 'Goal dihapus' })
}