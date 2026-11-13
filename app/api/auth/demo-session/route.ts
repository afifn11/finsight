// app/api/auth/demo-session/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { encode } from 'next-auth/jwt'
import { prisma } from '@/lib/prisma'

const DEMO_EMAIL = 'demo@finsight.app'
const DEMO_NAME = 'Demo Sandbox'

export async function GET(req: NextRequest) {
  try {
    const secret = process.env.NEXTAUTH_SECRET
    if (!secret) {
      return NextResponse.redirect(new URL('/login?error=ServerConfiguration', req.url))
    }

    // 1. Ensure Demo User exists and has onboarding completed
    const demoUser = await prisma.user.upsert({
      where: { email: DEMO_EMAIL },
      update: {
        onboardingDone: true,
      },
      create: {
        email: DEMO_EMAIL,
        name: DEMO_NAME,
        currency: 'IDR',
        timezone: 'Asia/Jakarta',
        onboardingDone: true,
      },
    })

    // 2. Ensure Demo User has at least one wallet & sample data if empty
    const existingWallets = await prisma.wallet.count({
      where: { userId: demoUser.id },
    })

    if (existingWallets === 0) {
      await prisma.wallet.createMany({
        data: [
          {
            userId: demoUser.id,
            name: 'BCA Tahapan',
            type: 'BANK',
            balance: 24500000,
            color: '#84cc16',
            icon: 'landmark',
            isIncludedInNetWorth: true,
          },
          {
            userId: demoUser.id,
            name: 'GoPay & OVO',
            type: 'E_WALLET',
            balance: 1850000,
            color: '#10b981',
            icon: 'smartphone',
            isIncludedInNetWorth: true,
          },
        ],
      })
    }

    // 3. Issue encrypted NextAuth JWT session token
    const maxAge = 24 * 60 * 60 // 24 hours for demo session
    const sessionToken = await encode({
      secret,
      maxAge,
      token: {
        id: demoUser.id,
        sub: demoUser.id,
        name: demoUser.name ?? DEMO_NAME,
        email: demoUser.email,
        onboardingDone: true,
        isDemo: true,
      },
    })

    const isSecure =
      req.nextUrl.protocol === 'https:' ||
      Boolean(process.env.NEXTAUTH_URL?.startsWith('https://'))
    const cookieName = isSecure
      ? '__Secure-next-auth.session-token'
      : 'next-auth.session-token'

    const response = NextResponse.redirect(new URL('/dashboard', req.url))

    response.cookies.set(cookieName, sessionToken, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      secure: isSecure,
      maxAge,
    })

    return response
  } catch (err) {
    console.error('[DEMO_SESSION_ERROR]', err)
    return NextResponse.redirect(new URL('/login?error=DemoSessionFailed', req.url))
  }
}
