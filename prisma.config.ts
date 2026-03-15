// prisma.config.ts
// Prisma 7 — konfigurasi koneksi database
import * as fs from 'node:fs'
import path from 'node:path'
import { defineConfig } from 'prisma/config'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'

// Load .env.local for Prisma CLI commands (prisma db push, migrate, etc.)
// Next.js loads this automatically but Prisma CLI does not
const envLocalPath = path.join(process.cwd(), '.env.local')
if (fs.existsSync(envLocalPath)) {
  const lines = fs.readFileSync(envLocalPath, 'utf-8').split('\n')
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eqIdx = trimmed.indexOf('=')
    if (eqIdx === -1) continue
    const key = trimmed.slice(0, eqIdx).trim()
    const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '')
    if (key && !process.env[key]) process.env[key] = val
  }
}

const isProduction = process.env.NODE_ENV === 'production'

export default defineConfig({
  // @ts-expect-error — earlyAccess is valid in Prisma 7 but not yet typed
  earlyAccess: true,
  schema: path.join('prisma', 'schema.prisma'),

  datasource: {
    url: process.env.DIRECT_URL!,
  },

  migrate: {
    async adapter() {
      const pool = new Pool({
        connectionString: process.env.DIRECT_URL,
        max: 3,
        ssl: isProduction ? { rejectUnauthorized: false } : false,
      })
      return new PrismaPg(pool as never)
    },
  },
})