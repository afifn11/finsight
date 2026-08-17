// app/api/push/unsubscribe/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import type { ApiError } from '@/types'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json<ApiError>({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = (await req.json()) as { endpoint?: string }
  if (!body.endpoint) {
    return NextResponse.json<ApiError>({ error: 'Endpoint wajib diisi' }, { status: 400 })
  }

  await prisma.pushSubscription.deleteMany({
    where: { endpoint: body.endpoint, userId: session.user.id },
  })

  return NextResponse.json({ message: 'Notifikasi budget dimatikan' })
}