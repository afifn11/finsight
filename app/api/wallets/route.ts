// app/api/wallets/route.ts
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { walletSchema } from '@/lib/validations'
import type { ApiResponse, ApiError, WalletsResponse, Wallet } from '@/types'

// GET /api/wallets — Fetch all user wallets with computed Net Worth
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json<ApiError>({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    let wallets = await prisma.wallet.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'asc' },
    })

    // If user has no wallets yet, automatically initialize a default Cash wallet
    if (wallets.length === 0) {
      const defaultWallet = await prisma.wallet.create({
        data: {
          userId: session.user.id,
          name: 'Dompet Tunai',
          type: 'CASH',
          balance: 0,
          color: '#10b981',
          icon: 'wallet',
          isIncludedInNetWorth: true,
        },
      })
      wallets = [defaultWallet]
    }

    // Compute Net Worth (sum of all wallets marked isIncludedInNetWorth)
    let netWorth = 0
    const breakdownByType: Record<string, number> = {
      BANK: 0,
      E_WALLET: 0,
      CASH: 0,
      INVESTMENT: 0,
      OTHER: 0,
    }

    for (const w of wallets) {
      const bal = Number(w.balance)
      if (w.isIncludedInNetWorth) {
        netWorth += bal
      }
      breakdownByType[w.type] = (breakdownByType[w.type] ?? 0) + bal
    }

    return NextResponse.json<ApiResponse<WalletsResponse>>({
      data: {
        wallets,
        netWorth,
        breakdownByType,
      },
    })
  } catch (error) {
    console.error('[GET /api/wallets]', error)
    return NextResponse.json<ApiError>({ error: 'Gagal mengambil data dompet' }, { status: 500 })
  }
}

// POST /api/wallets — Create a new wallet
export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json<ApiError>({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const json = await req.json()
    const parsed = walletSchema.safeParse(json)

    if (!parsed.success) {
      return NextResponse.json<ApiError>(
        { error: parsed.error.issues[0]?.message ?? 'Data dompet tidak valid' },
        { status: 400 }
      )
    }

    const { name, type, balance, color, icon, accountNumber, isIncludedInNetWorth } = parsed.data

    const wallet = await prisma.wallet.create({
      data: {
        userId: session.user.id,
        name,
        type,
        balance,
        color,
        icon,
        accountNumber: accountNumber ?? null,
        isIncludedInNetWorth,
      },
    })

    return NextResponse.json<ApiResponse<Wallet>>(
      { data: wallet, message: 'Dompet berhasil dibuat' },
      { status: 201 }
    )
  } catch (error) {
    console.error('[POST /api/wallets]', error)
    return NextResponse.json<ApiError>({ error: 'Gagal membuat dompet' }, { status: 500 })
  }
}
