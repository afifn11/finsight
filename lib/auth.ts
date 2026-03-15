// lib/auth.ts
import type { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import CredentialsProvider from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import crypto from 'crypto'

// ── Simple password hash (use bcrypt in production) ─────────────
// For portfolio: using crypto.scrypt — no extra dependency needed
function hashPassword(password: string): string {
  const salt = 'finsight-salt' // In prod: random salt per user stored in DB
  return crypto.scryptSync(password, salt, 64).toString('hex')
}

export function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash
}

// ── Zod validation ─────────────────────────────────────────────
const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})

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

        if (!user) return null

        // For demo account: check demo credentials
        if (email === 'demo@finsight.app' && password === 'demo123456') {
          return { id: user.id, email: user.email, name: user.name, image: user.image }
        }

        // For regular users: check hashed password from metadata
        // NOTE: In production, store password hash in a separate field
        // This is simplified for portfolio purposes
        return null
      },
    }),
  ],

  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id
        token.image = user.image ?? null
        token.name = user.name ?? null
        // Fetch onboardingDone on first login
        const dbUser1 = await prisma.user.findUnique({
          where: { id: user.id as string },
          select: { onboardingDone: true, image: true, name: true },
        })
        token.onboardingDone = dbUser1?.onboardingDone ?? false
        if (dbUser1?.image) token.image = dbUser1.image
        if (dbUser1?.name) token.name = dbUser1.name
      }
      // Refresh onboardingDone when session is updated (after onboarding completes)
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
        session.user.onboardingDone = token.onboardingDone as boolean ?? false
        if (token.image) session.user.image = token.image as string
        if (token.name) session.user.name = token.name as string
      }
      return session
    },

    async signIn({ user, account }) {
      // Auto-complete onboarding check for OAuth users
      if (account?.provider === 'google' && user.id) {
        // Check handled by middleware — onboardingDone checked on redirect
        void prisma.user.findUnique({
          where: { id: user.id },
          select: { onboardingDone: true },
        })
        // Will redirect to onboarding if not done (handled in middleware)
        return true
      }
      return true
    },
  },

  pages: {
    signIn: '/login',
    newUser: '/onboarding', // Redirect new OAuth users here
    error: '/login',
  },

  secret: process.env.NEXTAUTH_SECRET ?? 'fallback-secret-change-in-production',
  debug: process.env.NODE_ENV === 'development',
}

// ── Type augmentation for session ─────────────────────────────
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