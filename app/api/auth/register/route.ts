// app/api/auth/register/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { registerSchema } from '@/lib/validations'
import { hashPassword } from '@/lib/password'
import type { ApiResponse, ApiError } from '@/types'

export async function POST(req: NextRequest) {
  const body: unknown = await req.json()
  const parsed = registerSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json<ApiError>(
      { error: 'Validasi gagal', details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  const { name, email, password } = parsed.data

  // Check existing user
  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    return NextResponse.json<ApiError>(
      { error: 'Email sudah terdaftar' },
      { status: 409 }
    )
  }

  // P0.1: passwordHash sekarang disimpan di kolom Prisma-nya sendiri,
  // bukan di-overload lewat field `image`. Hash yang sama juga dipakai
  // oleh lib/auth.ts (satu sumber kebenaran: lib/password.ts).
  const passwordHash = hashPassword(password)

  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      onboardingDone: false,
    },
    select: { id: true, email: true, name: true },
  })

  return NextResponse.json<ApiResponse<{ id: string; email: string }>>(
    { data: { id: user.id, email: user.email ?? '' }, message: 'Akun berhasil dibuat' },
    { status: 201 }
  )
}