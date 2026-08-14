// lib/auth.ts
import type { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import CredentialsProvider from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { verifyPassword } from '@/lib/password'

// ── Zod validation ─────────────────────────────────────────────
const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})

// ── P0.5: fail fast kalau NEXTAUTH_SECRET tidak di-set ──────────
// Fallback hardcoded sebelumnya berarti setiap deployment yang lupa
// set env var ini akan berbagi secret yang sama & bisa di-forge.
const nextAuthSecret = process.env.NEXTAUTH_SECRET
if (!nextAuthSecret) {
  throw new Error(
    'NEXTAUTH_SECRET wajib di-set di environment variables. ' +
      'Generate dengan: openssl rand -base64 32'
  )
}

// ── NextAuth config ────────────────────────────────────────────
export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as Required<NextAuthOptions>['adapter'],

  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),

    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const parsed = credentialsSchema.safeParse(credentials)
        if (!parsed.success) return null

        const { email, password } = parsed.data

        const user = await prisma.user.findUnique({
          where: { email },
        })

        // User tidak ada, atau daftar via Google (tidak punya passwordHash)
        if (!user?.passwordHash) return null

        // P0.1: dulu baris ini tidak pernah dipanggil — authorize() selalu
        // return null untuk user non-demo. Sekarang benar-benar diverifikasi.
        const isValid = verifyPassword(password, user.passwordHash)
        if (!isValid) return null

        return { id: user.id, email: user.email, name: user.name, image: user.image }
      },
    }),
  ],

  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 hari
  },

  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id
        token.image = user.image ?? null
        token.name = user.name ?? null
        // Fetch onboardingDone saat login pertama
        const dbUser1 = await prisma.user.findUnique({
          where: { id: user.id as string },
          select: { onboardingDone: true, image: true, name: true },
        })
        token.onboardingDone = dbUser1?.onboardingDone ?? false
        if (dbUser1?.image) token.image = dbUser1.image
        if (dbUser1?.name) token.name = dbUser1.name
      }
      // Refresh onboardingDone saat session di-update (setelah onboarding selesai)
      if (trigger === 'update' && token.id) {
        const dbUser2 = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { onboardingDone: true },
        })
        token.onboardingDone = dbUser2?.onboardingDone ?? false
      }
      return token
    },

    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string
        session.user.onboardingDone = (token.onboardingDone as boolean) ?? false
        if (token.image) session.user.image = token.image as string
        if (token.name) session.user.name = token.name as string
      }
      return session
    },

    async signIn({ user, account }) {
      if (account?.provider === 'google' && user.id) {
        // Redirect ke onboarding kalau belum selesai ditangani middleware
        void prisma.user.findUnique({
          where: { id: user.id },
          select: { onboardingDone: true },
        })
        return true
      }
      return true
    },
  },

  pages: {
    signIn: '/login',
    newUser: '/onboarding', // Redirect user OAuth baru ke sini
    error: '/login',
  },

  secret: nextAuthSecret,
  debug: process.env.NODE_ENV === 'development',
}

// ── Type augmentation untuk session ─────────────────────────────
declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      name?: string | null
      image?: string | null
      onboardingDone?: boolean
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string
    onboardingDone?: boolean
  }
}