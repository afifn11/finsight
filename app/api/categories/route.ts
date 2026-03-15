// app/api/categories/route.ts
// @ts-nocheck -- Prisma client types resolved at runtime
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { categorySchema } from '@/lib/validations'
import type { ApiResponse, ApiError } from '@/types'

// ── GET /api/categories ────────────────────────────────────────
// Returns system categories + user's custom categories
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json<ApiError>({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = req.nextUrl
  const forType = searchParams.get('forType') // 'INCOME' | 'EXPENSE'

  const categories = await prisma.category.findMany({
    where: {
      OR: [
        { userId: null },              // System categories
        { userId: session.user.id },   // User's custom categories
      ],
      ...(forType ? { forType: forType as 'INCOME' | 'EXPENSE' } : {}),
    },
    orderBy: [{ type: 'asc' }, { name: 'asc' }],
  })

  return NextResponse.json<ApiResponse<Category[]>>({ data: categories })
}

// ── POST /api/categories ───────────────────────────────────────
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json<ApiError>({ error: 'Unauthorized' }, { status: 401 })
  }

  const body: unknown = await req.json()
  const parsed = categorySchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json<ApiError>(
      { error: 'Validasi gagal', details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  const category = await prisma.category.create({
    data: {
      ...parsed.data,
      userId: session.user.id,
      type: 'CUSTOM',
    },
  })

  return NextResponse.json<ApiResponse<Category>>(
    { data: category, message: 'Kategori berhasil dibuat' },
    { status: 201 }
  )
}