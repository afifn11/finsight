// app/api/auth/register/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { registerSchema } from '@/lib/validations'
import { hashPassword } from '@/lib/password'
import { authRateLimiter, checkRateLimit } from '@/lib/rate-limit'
import type { ApiResponse, ApiError } from '@/types'

export async function POST(req: NextRequest) {
  // Ekstraksi Client IP untuk rate limiting (mendukung header reverse proxy / Cloudflare / Vercel)
  const clientIp =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    '127.0.0.1'

  // Batasi rate register per IP untuk mencegah bot spam & resource exhaustion
  const { success, remaining, reset } = await checkRateLimit(authRateLimiter, clientIp)
  if (!success) {
    return NextResponse.json<ApiError>(
      { error: 'Terlalu banyak permintaan pendaftaran. Silakan coba beberapa saat lagi.' },
      {
        status: 429,
        headers: {
          'X-RateLimit-Remaining': String(remaining),
          'X-RateLimit-Reset': String(reset),
        },
      }
    )
  }

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

  // Hash password secara asynchronous (non-blocking)
  const passwordHash = await hashPassword(password)

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
