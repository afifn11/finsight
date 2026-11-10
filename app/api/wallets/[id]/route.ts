// app/api/wallets/[id]/route.ts
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { updateWalletSchema } from '@/lib/validations'
import type { ApiResponse, ApiError, Wallet } from '@/types'

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json<ApiError>({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  try {
    const existing = await prisma.wallet.findFirst({
      where: { id, userId: session.user.id },
    })

    if (!existing) {
      return NextResponse.json<ApiError>({ error: 'Dompet tidak ditemukan' }, { status: 404 })
    }

    const json = await req.json()
    const parsed = updateWalletSchema.safeParse(json)

    if (!parsed.success) {
      return NextResponse.json<ApiError>(
        { error: parsed.error.issues[0]?.message ?? 'Data pembaruan dompet tidak valid' },
        { status: 400 }
      )
    }

    const { name, type, balance, color, icon, accountNumber, isIncludedInNetWorth } = parsed.data

    const updateData = {
      ...(name !== undefined ? { name } : {}),
      ...(type !== undefined ? { type } : {}),
      ...(balance !== undefined ? { balance } : {}),
      ...(color !== undefined ? { color } : {}),
      ...(icon !== undefined ? { icon } : {}),
      ...(accountNumber !== undefined ? { accountNumber: accountNumber ?? null } : {}),
      ...(isIncludedInNetWorth !== undefined ? { isIncludedInNetWorth } : {}),
    }

    const updated = await prisma.wallet.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json<ApiResponse<Wallet>>({
      data: updated,
      message: 'Dompet berhasil diperbarui',
    })
  } catch (error) {
    console.error('[PATCH /api/wallets/[id]]', error)
    return NextResponse.json<ApiError>({ error: 'Gagal memperbarui dompet' }, { status: 500 })
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json<ApiError>({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  try {
    const existing = await prisma.wallet.findFirst({
      where: { id, userId: session.user.id },
    })

    if (!existing) {
      return NextResponse.json<ApiError>({ error: 'Dompet tidak ditemukan' }, { status: 404 })
    }

    // Safety check: prevent deleting user's last remaining wallet
    const walletCount = await prisma.wallet.count({
      where: { userId: session.user.id },
    })

    if (walletCount <= 1) {
      return NextResponse.json<ApiError>(
        { error: 'Tidak dapat menghapus dompet terakhir. Kamu harus memiliki minimal satu dompet aktif.' },
        { status: 400 }
      )
    }

    await prisma.wallet.delete({
      where: { id },
    })

    return NextResponse.json<ApiResponse<{ id: string }>>({
      data: { id },
      message: 'Dompet berhasil dihapus',
    })
  } catch (error) {
    console.error('[DELETE /api/wallets/[id]]', error)
    return NextResponse.json<ApiError>({ error: 'Gagal menghapus dompet' }, { status: 500 })
  }
}
