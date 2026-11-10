// tests/api/achievements.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET } from '@/app/api/achievements/route'
import { prisma } from '@/lib/prisma'
import { mockAuthenticatedSession, mockUnauthenticatedSession, MOCK_USER } from '../helpers'
import type { AchievementsResponse } from '@/types'

describe('GET /api/achievements', () => {
  beforeEach(() => {
    mockAuthenticatedSession()
    vi.mocked(prisma.transaction.count).mockResolvedValue(10)
    vi.mocked(prisma.transaction.groupBy).mockResolvedValue([
      { type: 'INCOME', _sum: { amount: 10000000 } } as never,
      { type: 'EXPENSE', _sum: { amount: 4000000 } } as never,
    ])
    vi.mocked(prisma.wallet.findMany).mockResolvedValue([
      {
        id: 'w-1',
        userId: MOCK_USER.id,
        name: 'BCA',
        balance: 15000000,
        isIncludedInNetWorth: true,
      } as never,
      {
        id: 'w-2',
        userId: MOCK_USER.id,
        name: 'GoPay',
        balance: 500000,
        isIncludedInNetWorth: true,
      } as never,
      {
        id: 'w-3',
        userId: MOCK_USER.id,
        name: 'Cash',
        balance: 200000,
        isIncludedInNetWorth: true,
      } as never,
    ])
    vi.mocked(prisma.budget.findMany).mockResolvedValue([])
    vi.mocked(prisma.subscription.count).mockResolvedValue(2)
    vi.mocked(prisma.userAchievement.findMany).mockResolvedValue([])
    vi.mocked(prisma.userAchievement.createMany).mockResolvedValue({ count: 4 } as never)
  })

  it('returns 401 when unauthenticated', async () => {
    mockUnauthenticatedSession()
    const res = await GET()
    expect(res.status).toBe(401)
  })

  it('returns computed badges, unlockedCount, and points', async () => {
    const res = await GET()
    expect(res.status).toBe(200)
    const body = (await res.json()) as { data: AchievementsResponse }

    expect(body.data.badges).toHaveLength(6)
    expect(body.data.totalCount).toBe(6)
    expect(body.data.unlockedCount).toBeGreaterThanOrEqual(1)
    expect(body.data.totalPoints).toBeGreaterThan(0)

    // Check SAVER_STARTER (since txCount = 10 >= 5)
    const starterBadge = body.data.badges.find((b) => b.key === 'SAVER_STARTER')
    expect(starterBadge?.unlocked).toBe(true)

    // Check NET_WORTH_10M (since net worth = 15.7M >= 10M)
    const netWorthBadge = body.data.badges.find((b) => b.key === 'NET_WORTH_10M')
    expect(netWorthBadge?.unlocked).toBe(true)
  })
})
