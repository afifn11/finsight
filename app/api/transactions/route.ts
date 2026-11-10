// app/api/transactions/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { transactionSchema, transactionFiltersSchema } from '@/lib/validations'
import type { ApiResponse, ApiError, PaginatedTransactions, TransactionWithCategory } from '@/types'
import type { Prisma } from '@prisma/client'

// ── GET /api/transactions ──────────────────────────────────────
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json<ApiError>(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  const { searchParams } = req.nextUrl
  const rawFilters = {
    type: searchParams.get('type') ?? 'ALL',
    categoryId: searchParams.get('categoryId') ?? undefined,
    dateFrom: searchParams.get('dateFrom') ?? undefined,
    dateTo: searchParams.get('dateTo') ?? undefined,
    search: searchParams.get('search') ?? undefined,
    page: searchParams.get('page') ?? '1',
    limit: searchParams.get('limit') ?? '20',
  }

  const filters = transactionFiltersSchema.parse(rawFilters)
  const skip = (filters.page - 1) * filters.limit

  // Build WHERE clause
  const where: Prisma.TransactionWhereInput = {
    userId: session.user.id,
    ...(filters.type !== 'ALL' && { type: filters.type }),
    ...(filters.categoryId && { categoryId: filters.categoryId }),
    ...(filters.dateFrom || filters.dateTo
      ? {
          date: {
            ...(filters.dateFrom && { gte: filters.dateFrom }),
            ...(filters.dateTo && { lte: filters.dateTo }),
          },
        }
      : {}),
    ...(filters.search && {
      description: {
        contains: filters.search,
        mode: 'insensitive' as const,
      },
    }),
  }

  const [data, total] = await Promise.all([
    prisma.transaction.findMany({
      where,
      include: {
        category: {
          select: { id: true, name: true, icon: true, color: true },
        },
      },
      orderBy: { date: 'desc' },
      skip,
      take: filters.limit,
    }),
    prisma.transaction.count({ where }),
  ])

  return NextResponse.json<ApiResponse<PaginatedTransactions>>({
    data: {
      data: data as unknown as TransactionWithCategory[],
      total,
      page: filters.page,
      limit: filters.limit,
      totalPages: Math.ceil(total / filters.limit),
    },
  })
}

// ── POST /api/transactions ─────────────────────────────────────
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json<ApiError>(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  const body: unknown = await req.json()
  const parsed = transactionSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json<ApiError>(
      {
        error: 'Validasi gagal',
        details: parsed.error.flatten().fieldErrors,
      },
      { status: 400 }
    )
  }

  // Verifikasi kepemilikan kategori (sistem atau milik user sendiri)
  const category = await prisma.category.findFirst({
    where: {
      id: parsed.data.categoryId,
      OR: [{ userId: null }, { userId: session.user.id }],
    },
    select: { id: true },
  })

  if (!category) {
    return NextResponse.json<ApiError>(
      { error: 'Kategori tidak valid atau tidak ditemukan' },
      { status: 400 }
    )
  }

  // Verifikasi kepemilikan wallet jika disertakan
  if (parsed.data.walletId) {
    const wallet = await prisma.wallet.findFirst({
      where: {
        id: parsed.data.walletId,
        userId: session.user.id,
      },
      select: { id: true },
    })

    if (!wallet) {
      return NextResponse.json<ApiError>(
        { error: 'Dompet tidak valid atau tidak ditemukan' },
        { status: 400 }
      )
    }
  }

  // Strip undefined fields — exactOptionalPropertyTypes butuh null, bukan undefined, untuk Prisma
  const { notes, recurringPeriod, recurringEndDate, walletId, ...requiredData } = parsed.data

  const createData: Prisma.TransactionUncheckedCreateInput = {
    ...requiredData,
    userId: session.user.id,
    walletId: walletId ?? null,
    ...(notes !== undefined ? { notes } : {}),
    ...(recurringPeriod !== undefined ? { recurringPeriod } : {}),
    ...(recurringEndDate !== undefined ? { recurringEndDate } : {}),
  }

  const transaction = await prisma.$transaction(async (tx) => {
    const created = await tx.transaction.create({
      data: createData,
      include: { category: true, wallet: true },
    })

    // Update wallet balance automatically
    if (created.walletId) {
      if (created.type === 'INCOME') {
        await tx.wallet.update({
          where: { id: created.walletId },
          data: { balance: { increment: created.amount } },
        })
      } else {
        await tx.wallet.update({
          where: { id: created.walletId },
          data: { balance: { decrement: created.amount } },
        })
      }
    }

    return created
  })

  return NextResponse.json<ApiResponse<typeof transaction>>(
    { data: transaction, message: 'Transaksi berhasil ditambahkan' },
    { status: 201 }
  )
}