// app/api/transactions/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { transactionSchema } from '@/lib/validations'
import type { ApiResponse, ApiError } from '@/types'
import type { Prisma } from '@prisma/client'

// Next.js 16: params must be awaited (breaking change from v15)
type RouteParams = { params: Promise<{ id: string }> }

// ── GET /api/transactions/:id ──────────────────────────────────
export async function GET(_req: NextRequest, { params }: RouteParams) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json<ApiError>({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const transaction = await prisma.transaction.findUnique({
    where: { id },
    include: { category: true },
  })

  if (!transaction || transaction.userId !== session.user.id) {
    return NextResponse.json<ApiError>({ error: 'Tidak ditemukan' }, { status: 404 })
  }

  return NextResponse.json<ApiResponse<typeof transaction>>({ data: transaction })
}

// ── PATCH /api/transactions/:id ────────────────────────────────
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json<ApiError>({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  // Verify ownership
  const existing = await prisma.transaction.findUnique({
    where: { id },
    select: { userId: true },
  })

  if (!existing || existing.userId !== session.user.id) {
    return NextResponse.json<ApiError>({ error: 'Tidak ditemukan' }, { status: 404 })
  }

  const body: unknown = await req.json()
  const parsed = transactionSchema.partial().safeParse(body)

  if (!parsed.success) {
    return NextResponse.json<ApiError>(
      { error: 'Validasi gagal', details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  const updateData: Prisma.TransactionUpdateInput = parsed.data

  const updated = await prisma.transaction.update({
    where: { id },
    data: updateData,
    include: { category: true },
  })

  return NextResponse.json<ApiResponse<typeof updated>>({
    data: updated,
    message: 'Transaksi berhasil diperbarui',
  })
}

// ── DELETE /api/transactions/:id ───────────────────────────────
export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json<ApiError>({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  const existing = await prisma.transaction.findUnique({
    where: { id },
    select: { userId: true },
  })

  if (!existing || existing.userId !== session.user.id) {
    return NextResponse.json<ApiError>({ error: 'Tidak ditemukan' }, { status: 404 })
  }

  await prisma.transaction.delete({ where: { id } })

  return NextResponse.json<ApiResponse<{ id: string }>>({
    data: { id },
    message: 'Transaksi berhasil dihapus',
  })
}