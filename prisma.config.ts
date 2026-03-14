// prisma.config.ts
// Prisma 7 — konfigurasi koneksi database
import 'dotenv/config'
import path from 'node:path'
import { defineConfig } from 'prisma/config'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'

const isProduction = process.env.NODE_ENV === 'production'

export default defineConfig({
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
      return new PrismaPg(pool)
    },
  },
})
