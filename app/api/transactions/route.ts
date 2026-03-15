// app/api/transactions/route.ts
// @ts-nocheck -- Prisma types resolved at runtime, Zod validates inputs
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { transactionSchema, transactionFiltersSchema } from '@/lib/validations'
import type { ApiResponse, ApiError, PaginatedTransactions } from '@/types'

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
  const where = {
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
      include: { category: true },
      orderBy: { date: 'desc' },
      skip,
      take: filters.limit,
    }),
    prisma.transaction.count({ where }),
  ])

  return NextResponse.json<ApiResponse<PaginatedTransactions>>({
    data: {
      data,
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

  // Strip undefined fields — exactOptionalPropertyTypes requires null not undefined for Prisma
  const { notes, recurringPeriod, recurringEndDate, ...requiredData } = parsed.data
  const transaction = await prisma.transaction.create({
    data: {
      ...requiredData,
      userId: session.user.id,
      ...(notes !== undefined ? { notes } : {}),
      ...(recurringPeriod !== undefined ? { recurringPeriod } : {}),
      ...(recurringEndDate !== undefined ? { recurringEndDate } : {}),
    },
    include: { category: true },
  })

  return NextResponse.json<ApiResponse<typeof transaction>>(
    { data: transaction, message: 'Transaksi berhasil ditambahkan' },
    { status: 201 }
  )
}