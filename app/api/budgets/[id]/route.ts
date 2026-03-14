// app/api/budgets/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { budgetSchema } from '@/lib/validations'
import type { ApiResponse, ApiError } from '@/types'

// Next.js 16: params must be awaited
type RouteParams = { params: Promise<{ id: string }> }

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json<ApiError>({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const existing = await prisma.budget.findUnique({ where: { id }, select: { userId: true } })
  if (!existing || existing.userId !== session.user.id) {
    return NextResponse.json<ApiError>({ error: 'Tidak ditemukan' }, { status: 404 })
  }

  const body: unknown = await req.json()
  const parsed = budgetSchema.partial().safeParse(body)
  if (!parsed.success) {
    return NextResponse.json<ApiError>(
      { error: 'Validasi gagal', details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  const updated = await prisma.budget.update({
    where: { id },
    data: parsed.data as Parameters<typeof prisma.budget.update>[0]['data'],
    include: { category: true },
  })

  return NextResponse.json<ApiResponse<typeof updated>>({
    data: updated,
    message: 'Budget diperbarui',
  })
}

export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json<ApiError>({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const existing = await prisma.budget.findUnique({ where: { id }, select: { userId: true } })
  if (!existing || existing.userId !== session.user.id) {
    return NextResponse.json<ApiError>({ error: 'Tidak ditemukan' }, { status: 404 })
  }

  await prisma.budget.delete({ where: { id } })
  return NextResponse.json<ApiResponse<{ id: string }>>({
    data: { id },
    message: 'Budget dihapus',
  })
}