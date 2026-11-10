// tests/api/bank-statement.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST as parsePOST } from '@/app/api/bank-statement/parse/route'
import { POST as importPOST } from '@/app/api/bank-statement/import/route'
import { prisma } from '@/lib/prisma'
import {
  mockAuthenticatedSession,
  mockUnauthenticatedSession,
  buildRequest,
  MOCK_USER,
} from '../helpers'
import { NextRequest } from 'next/server'

describe('/api/bank-statement', () => {
  beforeEach(() => {
    mockAuthenticatedSession()
    vi.mocked(prisma.category.findMany).mockResolvedValue([
      { id: 'cat-1', name: 'Makanan & Minuman', forType: 'EXPENSE' } as never,
      { id: 'cat-2', name: 'Gaji', forType: 'INCOME' } as never,
    ])
    vi.mocked(prisma.category.findFirst).mockResolvedValue({ id: 'cat-1' } as never)
    vi.mocked(prisma.wallet.findUnique).mockResolvedValue({
      id: 'wallet-001',
      userId: MOCK_USER.id,
    } as never)
    vi.mocked(prisma.wallet.update).mockResolvedValue({} as never)
    vi.mocked(prisma.transaction.createMany).mockResolvedValue({ count: 2 } as never)
  })

  describe('POST /api/bank-statement/parse', () => {
    it('returns 401 when unauthenticated', async () => {
      mockUnauthenticatedSession()
      const formData = new FormData()
      formData.append('file', new File(['dummy'], 'mutasi.csv', { type: 'text/csv' }))
      const req = new NextRequest('http://localhost:3000/api/bank-statement/parse', {
        method: 'POST',
        body: formData,
      })

      const res = await parsePOST(req)
      expect(res.status).toBe(401)
    })

    it('returns 400 when no file is uploaded', async () => {
      const formData = new FormData()
      const req = new NextRequest('http://localhost:3000/api/bank-statement/parse', {
        method: 'POST',
        body: formData,
      })

      const res = await parsePOST(req)
      expect(res.status).toBe(400)
    })
  })

  describe('POST /api/bank-statement/import', () => {
    it('returns 401 when unauthenticated', async () => {
      mockUnauthenticatedSession()
      const req = buildRequest('POST', {
        transactions: [
          {
            date: '2026-11-01',
            description: 'Kopi Kenangan',
            amount: 25000,
            type: 'EXPENSE',
          },
        ],
      })

      const res = await importPOST(req)
      expect(res.status).toBe(401)
    })

    it('returns 400 when transactions list is empty', async () => {
      const req = buildRequest('POST', { transactions: [] })
      const res = await importPOST(req)
      expect(res.status).toBe(400)
    })

    it('batch imports approved transactions atomically with wallet adjustment', async () => {
      const req = buildRequest('POST', {
        walletId: 'wallet-001',
        transactions: [
          {
            date: '2026-11-01',
            description: 'Gaji Bulanan',
            amount: 10000000,
            type: 'INCOME',
            categoryId: 'cat-2',
          },
          {
            date: '2026-11-02',
            description: 'Belanja Supermarket',
            amount: 500000,
            type: 'EXPENSE',
            categoryId: 'cat-1',
          },
        ],
      })

      const res = await importPOST(req)
      expect(res.status).toBe(200)
      const body = (await res.json()) as { data: { count: number } }
      expect(body.data.count).toBe(2)
      expect(prisma.$transaction).toHaveBeenCalled()
    })
  })
})
