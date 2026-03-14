// tests/api/export.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET } from '@/app/api/export/route'
import { prisma } from '@/lib/prisma'
import {
  mockAuthenticatedSession,
  mockUnauthenticatedSession,
  buildRequest,
  factory,
} from '../helpers'

const mockTransactions = [
  factory.transaction({ type: 'INCOME', amount: '8500000', description: 'Gaji' }),
  factory.transaction({ type: 'EXPENSE', amount: '150000', description: 'Makan siang' }),
]

describe('GET /api/export', () => {
  beforeEach(() => {
    mockAuthenticatedSession()
    vi.mocked(prisma.transaction.findMany).mockResolvedValue(mockTransactions as never)
  })

  it('returns 401 when unauthenticated', async () => {
    mockUnauthenticatedSession()
    const res = await GET(buildRequest('GET', undefined, { type: 'csv' }))
    expect(res.status).toBe(401)
  })

  describe('CSV export', () => {
    it('returns CSV content type', async () => {
      const res = await GET(buildRequest('GET', undefined, { type: 'csv', period: 'current' }))
      expect(res.headers.get('Content-Type')).toContain('text/csv')
    })

    it('returns content-disposition attachment header', async () => {
      const res = await GET(buildRequest('GET', undefined, { type: 'csv', period: 'current' }))
      expect(res.headers.get('Content-Disposition')).toContain('attachment')
      expect(res.headers.get('Content-Disposition')).toContain('.csv')
    })

    it('includes CSV header row', async () => {
      const res = await GET(buildRequest('GET', undefined, { type: 'csv' }))
      const text = await res.text()
      expect(text).toContain('Tanggal')
      expect(text).toContain('Deskripsi')
      expect(text).toContain('Nominal')
    })

    it('includes transaction data in CSV', async () => {
      const res = await GET(buildRequest('GET', undefined, { type: 'csv' }))
      const text = await res.text()
      expect(text).toContain('Gaji')
      expect(text).toContain('Makan siang')
    })

    it('includes both income and expense rows', async () => {
      const res = await GET(buildRequest('GET', undefined, { type: 'csv' }))
      const text = await res.text()
      expect(text).toContain('Pemasukan')
      expect(text).toContain('Pengeluaran')
    })
  })

  describe('PDF data export', () => {
    it('returns JSON data for PDF rendering', async () => {
      const res = await GET(buildRequest('GET', undefined, { type: 'pdf', period: 'current' }))
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body).toHaveProperty('period')
      expect(body).toHaveProperty('summary')
      expect(body).toHaveProperty('transactions')
      expect(body).toHaveProperty('generatedAt')
    })

    it('computes correct totals in summary', async () => {
      const res = await GET(buildRequest('GET', undefined, { type: 'pdf' }))
      const body = await res.json()

      expect(body.summary.totalIncome).toBe(8500000)
      expect(body.summary.totalExpense).toBe(150000)
      expect(body.summary.netBalance).toBe(8500000 - 150000)
      expect(body.summary.transactionCount).toBe(2)
    })

    it('returns formatted transaction dates', async () => {
      const res = await GET(buildRequest('GET', undefined, { type: 'pdf' }))
      const body = await res.json()

      body.transactions.forEach((tx: { date: string }) => {
        expect(typeof tx.date).toBe('string')
        expect(tx.date.length).toBeGreaterThan(0)
      })
    })
  })

  describe('period parameter', () => {
    it('queries current month by default', async () => {
      await GET(buildRequest('GET', undefined, { type: 'csv' }))

      const call = vi.mocked(prisma.transaction.findMany).mock.calls[0]![0]
      const dateFilter = (call!.where as Record<string, unknown>)?.date
      expect(dateFilter).toBeDefined()
    })

    it('queries last 3 months when period=last3', async () => {
      await GET(buildRequest('GET', undefined, { type: 'csv', period: 'last3' }))

      const call = vi.mocked(prisma.transaction.findMany).mock.calls[0]![0]
      const dateWhere = (call!.where as Record<string, unknown>)?.date as Record<string, Date> | undefined
      const startDate = dateWhere?.gte as Date
      const endDate = dateWhere?.lte as Date

      // 3-month range: start should be at least 60 days before end
      const diffDays = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
      expect(diffDays).toBeGreaterThanOrEqual(60)
    })
  })
})