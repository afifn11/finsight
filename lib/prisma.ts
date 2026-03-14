// lib/prisma.ts
// Prisma 7 — PrismaClient dengan pg adapter
// Singleton pattern untuk Next.js dev mode

import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

function createPrismaClient() {
  const isProduction = process.env.NODE_ENV === 'production'

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    // Connection pooling — cegah "too many clients" error di Supabase free tier
    max: 3,              // max 3 connections (Supabase free tier limit: 60 total)
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
    // SSL wajib untuk koneksi ke Supabase dari production (Vercel)
    ssl: isProduction ? { rejectUnauthorized: false } : false,
  })

  const adapter = new PrismaPg(pool as never)

  return new PrismaClient({
    adapter,
    log: isProduction ? ['error'] : ['error', 'warn'],
  })
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma