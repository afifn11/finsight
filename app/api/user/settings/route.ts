// app/api/user/settings/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { userSettingsSchema } from '@/lib/validations'
import type { ApiResponse, ApiError } from '@/types'
import type { Prisma } from '@prisma/client'

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json<ApiError>({ error: 'Unauthorized' }, { status: 401 })
  }

  const body: unknown = await req.json()
  const parsed = userSettingsSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json<ApiError>(
      { error: 'Validasi gagal', details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  const updateData: Prisma.UserUpdateInput = parsed.data

  const user = await prisma.user.update({
    where: { id: session.user.id },
    data: updateData,
    select: { id: true, name: true, email: true, currency: true, timezone: true },
  })

  return NextResponse.json<ApiResponse<typeof user>>({
    data: user,
    message: 'Pengaturan disimpan',
  })
}