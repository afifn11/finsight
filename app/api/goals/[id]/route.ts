// app/api/goals/[id]/route.ts
// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  targetAmount: z.coerce.number().positive().optional().transform(v => v !== undefined ? Math.round(v) : undefined),
  currentAmount: z.coerce.number().min(0).optional().transform(v => v !== undefined ? Math.round(v) : undefined),
  deadline: z.coerce.date().optional().nullable(),
  icon: z.string().optional(),
  color: z.string().optional(),
  notes: z.string().max(500).optional().nullable(),
  status: z.enum(['ACTIVE', 'COMPLETED', 'CANCELLED']).optional(),
})

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const existing = await prisma.financialGoal.findFirst({ where: { id, userId: session.user.id } })
  if (!existing) return NextResponse.json({ error: 'Goal tidak ditemukan' }, { status: 404 })

  const body = await req.json()
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Validasi gagal' }, { status: 400 })

  const updated = await prisma.financialGoal.update({
    where: { id },
    data: parsed.data,
  })

  return NextResponse.json({ data: updated })
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const existing = await prisma.financialGoal.findFirst({ where: { id, userId: session.user.id } })
  if (!existing) return NextResponse.json({ error: 'Goal tidak ditemukan' }, { status: 404 })

  await prisma.financialGoal.delete({ where: { id } })
  return NextResponse.json({ message: 'Goal dihapus' })
}