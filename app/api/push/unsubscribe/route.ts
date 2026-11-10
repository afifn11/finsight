// app/api/push/unsubscribe/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import type { ApiError } from '@/types'

const unsubscribeSchema = z.object({
  endpoint: z.string().url('Endpoint harus berupa URL yang valid'),
})

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json<ApiError>({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json<ApiError>({ error: 'Payload JSON tidak valid' }, { status: 400 })
  }

  const parsed = unsubscribeSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json<ApiError>(
      { error: 'Endpoint wajib diisi dengan format URL yang valid' },
      { status: 400 }
    )
  }

  await prisma.pushSubscription.deleteMany({
    where: { endpoint: parsed.data.endpoint, userId: session.user.id },
  })

  return NextResponse.json({ message: 'Notifikasi budget dimatikan' })
}
