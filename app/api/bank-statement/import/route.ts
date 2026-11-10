// app/api/bank-statement/import/route.ts
// Batch import approved transactions from bank statement parser
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { bankStatementImportSchema } from '@/lib/validations'
import type { ApiResponse, ApiError } from '@/types'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json<ApiError>({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = session.user.id
  const body = (await req.json()) as unknown
  const parsed = bankStatementImportSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json<ApiError>(
      {
        error: parsed.error.issues[0]?.message ?? 'Data transaksi tidak valid',
        details: parsed.error.format(),
      },
      { status: 400 }
    )
  }

  const { walletId, transactions } = parsed.data

  // If walletId provided, verify user ownership
  if (walletId) {
    const wallet = await prisma.wallet.findUnique({
      where: { id: walletId },
      select: { id: true, userId: true },
    })
    if (!wallet || wallet.userId !== userId) {
      return NextResponse.json<ApiError>({ error: 'Dompet tujuan tidak valid' }, { status: 404 })
    }
  }

  // Get fallback default category
  const defaultCategory = await prisma.category.findFirst({
    where: { OR: [{ userId }, { type: 'SYSTEM' }] },
    select: { id: true },
  })

  if (!defaultCategory) {
    return NextResponse.json<ApiError>(
      { error: 'Kategori transaksi tidak ditemukan dalam sistem' },
      { status: 400 }
    )
  }

  // Calculate net wallet adjustment: sum(income) - sum(expense)
  let netBalanceAdjustment = 0
  for (const tx of transactions) {
    if (tx.type === 'INCOME') {
      netBalanceAdjustment += tx.amount
    } else {
      netBalanceAdjustment -= tx.amount
    }
  }

  // Execute in an atomic database transaction
  await prisma.$transaction(async (tx) => {
    // 1. Batch create all transactions
    await tx.transaction.createMany({
      data: transactions.map((item) => ({
        userId,
        amount: item.amount,
        type: item.type,
        categoryId: item.categoryId ?? defaultCategory.id,
        walletId: walletId ?? null,
        description: item.description,
        date: new Date(item.date),
        notes: 'Diimpor dari Mutasi Rekening Bank',
      })),
    })

    // 2. Adjust wallet balance if wallet is selected
    if (walletId && netBalanceAdjustment !== 0) {
      await tx.wallet.update({
        where: { id: walletId },
        data: {
          balance: {
            increment: netBalanceAdjustment,
          },
        },
      })
    }
  })

  return NextResponse.json<ApiResponse<{ count: number }>>({
    data: { count: transactions.length },
    message: `Berhasil mengimpor ${transactions.length} transaksi mutasi rekening`,
  })
}
