// app/api/wallets/transfer/route.ts
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { walletTransferSchema } from '@/lib/validations'
import type { ApiResponse, ApiError, WalletTransfer } from '@/types'

// POST /api/wallets/transfer — Execute inter-wallet balance transfer atomically
export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json<ApiError>({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const json = await req.json()
    const parsed = walletTransferSchema.safeParse(json)

    if (!parsed.success) {
      return NextResponse.json<ApiError>(
        { error: parsed.error.issues[0]?.message ?? 'Data transfer tidak valid' },
        { status: 400 }
      )
    }

    const { fromWalletId, toWalletId, amount, fee = 0, notes, date } = parsed.data

    // 1. Verify ownership of both wallets
    const [fromWallet, toWallet] = await Promise.all([
      prisma.wallet.findFirst({
        where: { id: fromWalletId, userId: session.user.id },
      }),
      prisma.wallet.findFirst({
        where: { id: toWalletId, userId: session.user.id },
      }),
    ])

    if (!fromWallet) {
      return NextResponse.json<ApiError>({ error: 'Dompet asal tidak ditemukan' }, { status: 404 })
    }

    if (!toWallet) {
      return NextResponse.json<ApiError>({ error: 'Dompet tujuan tidak ditemukan' }, { status: 404 })
    }

    // 2. Balance validation
    const totalDeduction = amount + fee
    if (Number(fromWallet.balance) < totalDeduction) {
      return NextResponse.json<ApiError>(
        {
          error: `Saldo ${fromWallet.name} tidak mencukupi. Dibutuhkan Rp ${totalDeduction.toLocaleString(
            'id-ID'
          )} (termasuk biaya admin Rp ${fee.toLocaleString('id-ID')}).`,
        },
        { status: 400 }
      )
    }

    // 3. Execute atomic balance updates & transfer record
    const result = await prisma.$transaction(async (tx) => {
      // Deduct from source wallet
      await tx.wallet.update({
        where: { id: fromWalletId },
        data: {
          balance: { decrement: totalDeduction },
        },
      })

      // Add to destination wallet
      await tx.wallet.update({
        where: { id: toWalletId },
        data: {
          balance: { increment: amount },
        },
      })

      // Create transfer record
      const transfer = await tx.walletTransfer.create({
        data: {
          userId: session.user.id,
          fromWalletId,
          toWalletId,
          amount,
          fee,
          notes: notes ?? null,
          date: date ?? new Date(),
        },
      })

      return transfer
    })

    return NextResponse.json<ApiResponse<WalletTransfer>>(
      { data: result, message: 'Transfer antar dompet berhasil dilakukan' },
      { status: 201 }
    )
  } catch (error) {
    console.error('[POST /api/wallets/transfer]', error)
    return NextResponse.json<ApiError>({ error: 'Gagal melakukan transfer dompet' }, { status: 500 })
  }
}
