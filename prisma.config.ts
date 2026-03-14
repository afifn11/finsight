// prisma.config.ts
import 'dotenv/config'
import path from 'node:path'
import { defineConfig } from 'prisma/config'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'

export default defineConfig({
  earlyAccess: true,
  schema: path.join('prisma', 'schema.prisma'),

  datasource: {
    url: process.env.DATABASE_URL!,
  },

  migrate: {
    async adapter() {
      const pool = new Pool({
        connectionString: process.env.DIRECT_URL,
      })
      return new PrismaPg(pool)
    },
  },
})
