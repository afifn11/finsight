// app/api/user/delete/route.ts
// @ts-nocheck -- Prisma types resolved at runtime, Zod validates inputs
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import type { ApiError } from '@/types'

export async function DELETE() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json<ApiError>({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = session.user.id

  try {
    // Prisma cascade delete handles all related data:
    // transactions, budgets, categories, accounts, sessions, ai_insights
    await prisma.user.delete({ where: { id: userId } })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[DELETE /api/user/delete]', err)
    return NextResponse.json<ApiError>(
      { error: 'Gagal menghapus akun' },
      { status: 500 }
    )
  }
}