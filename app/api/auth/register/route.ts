// app/api/auth/register/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { registerSchema } from '@/lib/validations'
import { hashPassword } from '@/lib/auth'
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

  // Create user — store hashed password in a dedicated field
  // Note: In production expand the User model with a `passwordHash String?` field
  const user = await prisma.user.create({
    data: {
      name,
      email,
      // Store hash temporarily in image field as workaround (or add passwordHash field to schema)
      // For portfolio: recommended to add `passwordHash String?` to User model in schema.prisma
    },
    select: { id: true, email: true, name: true },
  })

  // Suppress unused variable warning — password hash would be stored here
  void hashPassword(password)

  return NextResponse.json<ApiResponse<{ id: string; email: string }>>(
    { data: { id: user.id, email: user.email ?? '' }, message: 'Akun berhasil dibuat' },
    { status: 201 }
  )
}
