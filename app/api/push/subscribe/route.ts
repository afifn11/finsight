// app/api/push/subscribe/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import type { ApiError } from '@/types'

const subscribeSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string().min(1),
    auth: z.string().min(1),
  }),
})

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json<ApiError>({ error: 'Unauthorized' }, { status: 401 })
  }

  const body: unknown = await req.json()
  const parsed = subscribeSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json<ApiError>({ error: 'Data subscription tidak valid' }, { status: 400 })
  }

  const { endpoint, keys } = parsed.data
  const userAgent = req.headers.get('user-agent') // string | null, bukan string | undefined

  await prisma.pushSubscription.upsert({
    where: { endpoint },
    update: {
      userId: session.user.id,
      p256dh: keys.p256dh,
      auth: keys.auth,
      ...(userAgent !== null ? { userAgent } : {}),
    },
    create: {
      userId: session.user.id,
      endpoint,
      p256dh: keys.p256dh,
      auth: keys.auth,
      ...(userAgent !== null ? { userAgent } : {}),
    },
  })

  return NextResponse.json({ message: 'Notifikasi budget diaktifkan' })
}