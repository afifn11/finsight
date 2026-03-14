// __tests__/api/dashboard/summary.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { GET } from '@/app/api/dashboard/summary/route'
import { mockSession, mockCategory, createMockRequest } from '../../mocks/fixtures'

const mockGetSession = vi.mocked(getServerSession)
const mockPrisma = vi.mocked(prisma)

const mockMonthAgg = [
  { type: 'INCOME', _sum: { amount: 5000000 }, _count: 1 },
  { type: 'EXPENSE', _sum: { amount: 1500000 }, _count: 5 },
]

const mockTrendData = [
  { type: 'INCOME', _sum: { amount: 4500000 } },
  { type: 'EXPENSE', _sum: { amount: 2000000 } },
]

const mockCategoryAgg = [
  { categoryId: mockCategory.id, _sum: { amount: 900000 }, _count: 3 },
]

describe('GET /api/dashboard/summary', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetSession.mockResolvedValue(mockSession)

    // Mock 6-month trend (Promise.all with 6 items)
    mockPrisma.transaction.groupBy
      .mockResolvedValueOnce(
        mockMonthAgg as unknown as Awaited<ReturnType<typeof prisma.transaction.groupBy>>
      )
      .mockResolvedValue(
        mockTrendData as unknown as Awaited<ReturnType<typeof prisma.transaction.groupBy>>
      )

    mockPrisma.category.findMany.mockResolvedValue([mockCategory])
  })

  it('returns 401 when not authenticated', async () => {
    mockGetSession.mockResolvedValue(null)
    const req = createMockRequest('GET', '/api/dashboard/summary')
    const res = await GET()
    expect(res.status).toBe(401)
  })

  it('returns dashboard summary with correct calculations', async () => {
    // Re-mock for this specific test
    mockPrisma.transaction.groupBy
      .mockResolvedValueOnce(
        mockMonthAgg as unknown as Awaited<ReturnType<typeof prisma.transaction.groupBy>>
      )
      .mockResolvedValue(
        mockTrendData as unknown as Awaited<ReturnType<typeof prisma.transaction.groupBy>>
      )

    const req = createMockRequest('GET', '/api/dashboard/summary')
    const res = await GET()
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.data.summary.totalIncome).toBe(5000000)
    expect(data.data.summary.totalExpense).toBe(1500000)
    expect(data.data.summary.netBalance).toBe(3500000)
    expect(data.data.summary.savingRate).toBe(70)
    expect(data.data.summary.transactionCount).toBe(6)
  })

  it('returns 6 months of trend data', async () => {
    mockPrisma.transaction.groupBy
      .mockResolvedValueOnce(
        mockMonthAgg as unknown as Awaited<ReturnType<typeof prisma.transaction.groupBy>>
      )
      .mockResolvedValue(
        mockTrendData as unknown as Awaited<ReturnType<typeof prisma.transaction.groupBy>>
      )

    const res = await GET()
    const data = await res.json()

    expect(data.data.monthlyTrend).toHaveLength(6)
  })

  it('calculates saving rate as 0 when no income', async () => {
    mockPrisma.transaction.groupBy
      .mockResolvedValueOnce([
        { type: 'EXPENSE', _sum: { amount: 500000 }, _count: 2 },
      ] as unknown as Awaited<ReturnType<typeof prisma.transaction.groupBy>>)
      .mockResolvedValue([] as unknown as Awaited<ReturnType<typeof prisma.transaction.groupBy>>)

    const res = await GET()
    const data = await res.json()

    expect(data.data.summary.savingRate).toBe(0)
    expect(data.data.summary.totalIncome).toBe(0)
  })

  it('returns empty category breakdown when no expenses', async () => {
    mockPrisma.transaction.groupBy
      .mockResolvedValueOnce(
        [{ type: 'INCOME', _sum: { amount: 5000000 }, _count: 1 }] as unknown as Awaited<
          ReturnType<typeof prisma.transaction.groupBy>
        >
      )
      .mockResolvedValue([] as unknown as Awaited<ReturnType<typeof prisma.transaction.groupBy>>)

    const res = await GET()
    const data = await res.json()

    expect(data.data.categoryBreakdown).toHaveLength(0)
  })

  it('includes period label in summary', async () => {
    mockPrisma.transaction.groupBy
      .mockResolvedValueOnce(
        mockMonthAgg as unknown as Awaited<ReturnType<typeof prisma.transaction.groupBy>>
      )
      .mockResolvedValue(
        mockTrendData as unknown as Awaited<ReturnType<typeof prisma.transaction.groupBy>>
      )

    const res = await GET()
    const data = await res.json()

    expect(data.data.summary.periodLabel).toBeTruthy()
    expect(typeof data.data.summary.periodLabel).toBe('string')
  })
})
