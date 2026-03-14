// tests/api/dashboard.test.ts
import { describe, it, expect, vi } from 'vitest'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { MOCK_SESSION, MOCK_CATEGORY, buildRequest } from '../setup'
import { GET } from '@/app/api/dashboard/summary/route'

const mockSession = vi.mocked(getServerSession)
const mockPrisma = vi.mocked(prisma)

const MOCK_GROUPBY_INCOME = [{ type: 'INCOME', _sum: { amount: 5000000 }, _count: 2 }]
const MOCK_GROUPBY_EXPENSE = [{ type: 'EXPENSE', _sum: { amount: 2000000 }, _count: 5 }]
const MOCK_GROUPBY_BOTH = [...MOCK_GROUPBY_INCOME, ...MOCK_GROUPBY_EXPENSE]
const MOCK_CAT_AGG = [{ categoryId: 'cat-001', _sum: { amount: 2000000 }, _count: 5 }]

function setupDashboardMocks(overrides: { income?: number; expense?: number } = {}) {
  const income = overrides.income ?? 5000000
  const expense = overrides.expense ?? 2000000

  // currentMonthAgg
  vi.mocked(mockPrisma.transaction.groupBy)
    .mockResolvedValueOnce([
      { type: 'INCOME', _sum: { amount: income }, _count: 1 },
      { type: 'EXPENSE', _sum: { amount: expense }, _count: 3 },
    ] as never)

  // last6MonthsData — 6 calls
  for (let i = 0; i < 6; i++) {
    vi.mocked(mockPrisma.transaction.groupBy).mockResolvedValueOnce([
      { type: 'INCOME', _sum: { amount: income }, _count: 1 },
      { type: 'EXPENSE', _sum: { amount: expense }, _count: 1 },
    ] as never)
  }

  // categoryAgg
  vi.mocked(mockPrisma.transaction.groupBy).mockResolvedValueOnce(MOCK_CAT_AGG as never)

  // categories for breakdown
  vi.mocked(mockPrisma.category.findMany).mockResolvedValueOnce([MOCK_CATEGORY])
}

describe('GET /api/dashboard/summary', () => {
  it('returns 401 when not authenticated', async () => {
    mockSession.mockResolvedValueOnce(null)
    expect((await GET()).status).toBe(401)
  })

  it('returns correct summary totals', async () => {
    mockSession.mockResolvedValueOnce(MOCK_SESSION)
    setupDashboardMocks({ income: 5000000, expense: 2000000 })
    const body = await (await GET()).json()
    expect(body.data.summary.totalIncome).toBe(5000000)
    expect(body.data.summary.totalExpense).toBe(2000000)
    expect(body.data.summary.netBalance).toBe(3000000)
  })

  it('calculates saving rate correctly', async () => {
    mockSession.mockResolvedValueOnce(MOCK_SESSION)
    setupDashboardMocks({ income: 5000000, expense: 2500000 })
    const body = await (await GET()).json()
    expect(body.data.summary.savingRate).toBe(50)
  })

  it('saving rate is 0 when no income', async () => {
    mockSession.mockResolvedValueOnce(MOCK_SESSION)
    setupDashboardMocks({ income: 0, expense: 0 })
    const body = await (await GET()).json()
    expect(body.data.summary.savingRate).toBe(0)
  })

  it('returns 6 months trend data', async () => {
    mockSession.mockResolvedValueOnce(MOCK_SESSION)
    setupDashboardMocks()
    const body = await (await GET()).json()
    expect(body.data.monthlyTrend).toHaveLength(6)
  })

  it('returns category breakdown', async () => {
    mockSession.mockResolvedValueOnce(MOCK_SESSION)
    setupDashboardMocks()
    const body = await (await GET()).json()
    expect(body.data.categoryBreakdown).toHaveLength(1)
    expect(body.data.categoryBreakdown[0].categoryName).toBe('Makanan & Minuman')
    expect(body.data.categoryBreakdown[0].percentage).toBe(100)
  })
})
