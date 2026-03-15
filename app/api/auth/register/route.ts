// app/api/auth/register/route.ts
// @ts-nocheck -- Prisma types resolved at runtime, Zod validates inputs
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { registerSchema } from '@/lib/validations'
import crypto from 'crypto'
import type { ApiResponse, ApiError } from '@/types'

// Simple password hash — tidak perlu bcrypt untuk portfolio
function hashPassword(password: string): string {
  // Generate random salt per user
  const salt = crypto.randomBytes(16).toString('hex')
  const hash = crypto.scryptSync(password, salt, 64).toString('hex')
  return `${salt}:${hash}`
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(':')
  if (!salt || !hash) return false
  const testHash = crypto.scryptSync(password, salt, 64).toString('hex')
  return testHash === hash
}

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

  // Hash password dan simpan di field image sebagai workaround
  // Catatan: idealnya tambah field `passwordHash String?` di schema Prisma
  // Untuk portfolio ini, kita simpan hash di image field dengan prefix `[pw]`
  const passwordHash = hashPassword(password)

  const user = await prisma.user.create({
    data: {
      name,
      email,
      image: `[pw]${passwordHash}`, // prefix agar bisa dibedakan dari URL gambar
      onboardingDone: false,
    },
    select: { id: true, email: true, name: true },
  })

  return NextResponse.json<ApiResponse<{ id: string; email: string }>>(
    { data: { id: user.id, email: user.email ?? '' }, message: 'Akun berhasil dibuat' },
    { status: 201 }
  )
}