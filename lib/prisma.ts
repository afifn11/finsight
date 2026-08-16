// lib/prisma.ts
// Prisma 7 — PrismaClient dengan pg adapter
// Singleton pattern untuk Next.js dev mode

import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

function createPrismaClient() {
  const isProduction = process.env.NODE_ENV === 'production'

  // P0.4 (revisi): rejectUnauthorized: true tetap dipakai (verifikasi
  // SSL aktif), tapi sekarang kita berikan CA certificate resmi Supabase
  // secara eksplisit — supaya Node.js tahu certificate chain Supabase
  // itu valid, tanpa perlu mematikan verifikasi sama sekali.
  // Download CA cert dari: Supabase Dashboard → Settings → Database →
  // SSL Configuration → Download CA certificate.
  const sslConfig = isProduction
    ? process.env.SUPABASE_CA_CERT
      ? { rejectUnauthorized: true, ca: process.env.SUPABASE_CA_CERT }
      : { rejectUnauthorized: true } // fallback — masih akan error kalau CA belum di-set
    : false

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 3,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
    ssl: sslConfig,
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