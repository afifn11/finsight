// tests/api/dashboard.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET } from '@/app/api/dashboard/summary/route'
import { prisma } from '@/lib/prisma'
import {
  mockAuthenticatedSession,
  mockUnauthenticatedSession,
  MOCK_USER,
} from '../helpers'

// Helper: setup groupBy mocks with income/expense values
function setupMocks(income = 0, expense = 0) {
  const currentMonth = income > 0 || expense > 0
    ? [
        ...(income > 0 ? [{ type: 'INCOME', _sum: { amount: String(income) }, _count: 1 }] : []),
        ...(expense > 0 ? [{ type: 'EXPENSE', _sum: { amount: String(expense) }, _count: 1 }] : []),
      ]
    : []

  vi.mocked(prisma.transaction.groupBy)
    .mockResolvedValueOnce(currentMonth as never) // current month summary
    .mockResolvedValue([] as never) // 6 monthly trend calls

  vi.mocked(prisma.category.findMany).mockResolvedValue([])
}

describe('GET /api/dashboard/summary', () => {
  beforeEach(() => {
    mockAuthenticatedSession()
    vi.mocked(prisma.transaction.groupBy).mockResolvedValue([])
    vi.mocked(prisma.category.findMany).mockResolvedValue([])
  })

  it('returns 401 when not authenticated', async () => {
    mockUnauthenticatedSession()
    const res = await GET()
    expect(res.status).toBe(401)
  })

  it('returns correct summary totals', async () => {
    setupMocks(5000000, 2000000)
    const res = await GET()
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.data.summary.totalIncome).toBe(5000000)
    expect(body.data.summary.totalExpense).toBe(2000000)
    expect(body.data.summary.netBalance).toBe(3000000)
  })

  it('calculates saving rate correctly', async () => {
    setupMocks(5000000, 2500000)
    const res = await GET()
    const body = await res.json()
    expect(body.data.summary.savingRate).toBe(50)
  })

  it('saving rate is 0 when no income', async () => {
    setupMocks(0, 0)
    const res = await GET()
    const body = await res.json()
    expect(body.data.summary.savingRate).toBe(0)
    expect(body.data.summary.totalIncome).toBe(0)
  })

  it('returns 6 months trend data', async () => {
    setupMocks()
    const res = await GET()
    const body = await res.json()
    expect(body.data.monthlyTrend).toHaveLength(6)
  })

  it('returns category breakdown', async () => {
    vi.mocked(prisma.transaction.groupBy)
      .mockResolvedValueOnce([
        { type: 'EXPENSE', _sum: { amount: '500000' }, _count: 1 },
      ] as never)
      .mockResolvedValueOnce([
        { categoryId: 'cat-001', _sum: { amount: '500000' }, _count: 1 },
      ] as never)
      .mockResolvedValue([] as never)

    vi.mocked(prisma.category.findMany).mockResolvedValue([
      {
        id: 'cat-001', name: 'Makanan & Minuman',
        icon: 'utensils', color: '#f59e0b',
        type: 'SYSTEM', forType: 'EXPENSE',
        userId: null, createdAt: new Date(), updatedAt: new Date(),
      },
    ] as never)

    const res = await GET()
    const body = await res.json()
    expect(body.data.categoryBreakdown).toHaveLength(1)
    expect(body.data.categoryBreakdown[0].categoryName).toBe('Makanan & Minuman')
  })

  it('only queries authenticated user data', async () => {
    await GET()
    const calls = vi.mocked(prisma.transaction.groupBy).mock.calls
    calls.forEach((call) => {
      expect(call[0]).toMatchObject({
        where: expect.objectContaining({ userId: MOCK_USER.id }),
      })
    })
  })
})
