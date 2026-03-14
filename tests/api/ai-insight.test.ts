// tests/api/ai-insight.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET } from '@/app/api/ai/insight/route'
import { prisma } from '@/lib/prisma'
import {
  mockAuthenticatedSession,
  mockUnauthenticatedSession,
  MOCK_USER,
} from '../helpers'

describe('GET /api/ai/insight', () => {
  beforeEach(() => {
    mockAuthenticatedSession()
    vi.mocked(prisma.transaction.findMany).mockResolvedValue([])
    vi.mocked(prisma.transaction.groupBy).mockResolvedValue([])
    vi.mocked(prisma.budget.findMany).mockResolvedValue([])
    vi.mocked(prisma.aiInsight.findUnique).mockResolvedValue(null)
    vi.mocked(prisma.aiInsight.upsert).mockResolvedValue({} as never)
  })

  it('returns 401 when unauthenticated', async () => {
    mockUnauthenticatedSession()
    const res = await GET()
    expect(res.status).toBe(401)
  })

  it('returns cached insight when available', async () => {
    const cached = {
      id: 'insight-001',
      userId: MOCK_USER.id,
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear(),
      createdAt: new Date(),
      content: {
        insights: [{ title: 'Cached insight', description: 'From cache', type: 'info' }],
        generatedAt: new Date().toISOString(),
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
      },
    }
    vi.mocked(prisma.aiInsight.findUnique).mockResolvedValue(cached as never)

    const res = await GET()
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data.insights[0]?.title).toBe('Cached insight')
  })

  it('generates new insight when no cache', async () => {
    const res = await GET()
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data.insights).toHaveLength(1)
    expect(body.data.insights[0]?.title).toBe('Test insight')
  })

  it('caches generated insight', async () => {
    await GET()
    expect(prisma.aiInsight.upsert).toHaveBeenCalledOnce()
  })

  it('does not call AI when cache exists', async () => {
    const cached = {
      id: 'insight-001',
      userId: MOCK_USER.id,
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear(),
      createdAt: new Date(),
      content: {
        insights: [{ title: 'Cached', description: 'x', type: 'info' }],
        generatedAt: new Date().toISOString(),
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
      },
    }
    vi.mocked(prisma.aiInsight.findUnique).mockResolvedValue(cached as never)

    await GET()
    expect(prisma.aiInsight.upsert).not.toHaveBeenCalled()
  })

  it('returns correct data structure', async () => {
    const res = await GET()
    const body = await res.json()
    expect(body.data).toHaveProperty('insights')
    expect(body.data).toHaveProperty('generatedAt')
    expect(body.data).toHaveProperty('month')
    expect(body.data).toHaveProperty('year')
  })
})
