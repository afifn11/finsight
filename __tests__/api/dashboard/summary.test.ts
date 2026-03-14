// __tests__/api/dashboard/summary.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET } from '@/app/api/dashboard/summary/route'
import { prisma } from '@/lib/prisma'
import {
  mockAuthenticatedSession,
  mockUnauthenticatedSession,
  MOCK_USER,
} from '../../helpers'

describe('GET /api/dashboard/summary', () => {
  beforeEach(() => {
    mockAuthenticatedSession()
    // Reset semua mock ke default empty setiap test
    vi.mocked(prisma.transaction.groupBy).mockReset()
    vi.mocked(prisma.category.findMany).mockResolvedValue([])
  })

  it('returns 401 when not authenticated', async () => {
    mockUnauthenticatedSession()
    const res = await GET()
    expect(res.status).toBe(401)
  })

  it('returns dashboard summary with correct calculations', async () => {
    // First call = current month, rest = 6 monthly trend calls
    vi.mocked(prisma.transaction.groupBy)
      .mockResolvedValueOnce([
        { type: 'INCOME', _sum: { amount: '8000000' }, _count: 3 },
        { type: 'EXPENSE', _sum: { amount: '4000000' }, _count: 5 },
      ] as never)
      .mockResolvedValue([] as never)

    const res = await GET()
    expect(res.status).toBe(200)
    const body = await res.json()

    expect(body.data.summary.totalIncome).toBe(8000000)
    expect(body.data.summary.totalExpense).toBe(4000000)
    expect(body.data.summary.netBalance).toBe(4000000)
    expect(body.data.summary.savingRate).toBe(50)
  })

  it('returns 6 months of trend data', async () => {
    vi.mocked(prisma.transaction.groupBy).mockResolvedValue([] as never)

    const res = await GET()
    const body = await res.json()
    expect(body.data.monthlyTrend).toHaveLength(6)
  })

  it('calculates saving rate as 0 when no income', async () => {
    // Semua call return empty (no income, no expense)
    vi.mocked(prisma.transaction.groupBy).mockResolvedValue([] as never)

    const res = await GET()
    const body = await res.json()

    expect(body.data.summary.savingRate).toBe(0)
    expect(body.data.summary.totalIncome).toBe(0)
  })

  it('returns empty category breakdown when no expenses', async () => {
    vi.mocked(prisma.transaction.groupBy).mockResolvedValue([] as never)

    const res = await GET()
    const body = await res.json()
    expect(body.data.categoryBreakdown).toHaveLength(0)
  })

  it('includes period label in summary', async () => {
    vi.mocked(prisma.transaction.groupBy).mockResolvedValue([] as never)

    const res = await GET()
    const body = await res.json()
    expect(typeof body.data.summary.periodLabel).toBe('string')
    expect(body.data.summary.periodLabel.length).toBeGreaterThan(0)
  })

  it('only queries authenticated user data', async () => {
    vi.mocked(prisma.transaction.groupBy).mockResolvedValue([] as never)

    await GET()

    const calls = vi.mocked(prisma.transaction.groupBy).mock.calls
    calls.forEach((call) => {
      expect(call[0]).toMatchObject({
        where: expect.objectContaining({ userId: MOCK_USER.id }),
      })
    })
  })
})
