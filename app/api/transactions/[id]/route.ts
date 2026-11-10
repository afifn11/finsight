// app/api/transactions/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { transactionSchema } from '@/lib/validations'
import { deleteReceiptFile } from '@/lib/supabase'
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
    select: { userId: true, walletId: true, amount: true, type: true },
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

  // Verifikasi kepemilikan dompet jika diubah
  if (parsed.data.walletId) {
    const wallet = await prisma.wallet.findFirst({
      where: { id: parsed.data.walletId, userId: session.user.id },
      select: { id: true },
    })
    if (!wallet) {
      return NextResponse.json<ApiError>({ error: 'Dompet tidak valid' }, { status: 400 })
    }
  }

  const {
    amount, type, categoryId, walletId, description, date,
    notes, isRecurring, recurringPeriod, recurringEndDate,
  } = parsed.data

  const updateData: Prisma.TransactionUncheckedUpdateInput = {
    ...(amount !== undefined ? { amount } : {}),
    ...(type !== undefined ? { type } : {}),
    ...(categoryId !== undefined ? { categoryId } : {}),
    ...(walletId !== undefined ? { walletId } : {}),
    ...(description !== undefined ? { description } : {}),
    ...(date !== undefined ? { date } : {}),
    ...(notes !== undefined ? { notes } : {}),
    ...(isRecurring !== undefined ? { isRecurring } : {}),
    ...(recurringPeriod !== undefined ? { recurringPeriod } : {}),
    ...(recurringEndDate !== undefined ? { recurringEndDate } : {}),
  }

  const updated = await prisma.$transaction(async (tx) => {
    // 1. Revert previous wallet balance if walletId existed
    if (existing.walletId) {
      if (existing.type === 'INCOME') {
        await tx.wallet.update({
          where: { id: existing.walletId },
          data: { balance: { decrement: existing.amount } },
        })
      } else {
        await tx.wallet.update({
          where: { id: existing.walletId },
          data: { balance: { increment: existing.amount } },
        })
      }
    }

    // 2. Perform transaction update
    const txUpdated = await tx.transaction.update({
      where: { id },
      data: updateData,
      include: { category: true, wallet: true },
    })

    // 3. Apply new wallet balance
    if (txUpdated.walletId) {
      if (txUpdated.type === 'INCOME') {
        await tx.wallet.update({
          where: { id: txUpdated.walletId },
          data: { balance: { increment: txUpdated.amount } },
        })
      } else {
        await tx.wallet.update({
          where: { id: txUpdated.walletId },
          data: { balance: { decrement: txUpdated.amount } },
        })
      }
    }

    return txUpdated
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
    select: { userId: true, receiptPath: true, walletId: true, amount: true, type: true },
  })

  if (!existing || existing.userId !== session.user.id) {
    return NextResponse.json<ApiError>({ error: 'Tidak ditemukan' }, { status: 404 })
  }

  // Bersihkan file bukti transaksi dari Supabase Storage jika ada
  if (existing.receiptPath) {
    try {
      await deleteReceiptFile(existing.receiptPath)
    } catch (storageErr) {
      console.error('[STORAGE_CLEANUP_ERROR] Gagal menghapus file bukti:', storageErr)
      // Tetap lanjutkan penghapusan row database agar transaksi tidak tersangkut
    }
  }

  // Reverse wallet balance atomically upon transaction deletion
  await prisma.$transaction(async (tx) => {
    if (existing.walletId) {
      if (existing.type === 'INCOME') {
        await tx.wallet.update({
          where: { id: existing.walletId },
          data: { balance: { decrement: existing.amount } },
        })
      } else {
        await tx.wallet.update({
          where: { id: existing.walletId },
          data: { balance: { increment: existing.amount } },
        })
      }
    }

    await tx.transaction.delete({ where: { id } })
  })

  return NextResponse.json<ApiResponse<{ id: string }>>({
    data: { id },
    message: 'Transaksi berhasil dihapus',
  })
}