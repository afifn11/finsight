// __tests__/api/ai/insight.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { GET } from '@/app/api/ai/insight/route'
import { mockSession, mockTransaction, mockBudget, createMockRequest } from '../../mocks/fixtures'

const mockGetSession = vi.mocked(getServerSession)
const mockPrisma = vi.mocked(prisma)

const cachedInsight = {
  id: 'insight-001',
  userId: mockSession.user.id,
  month: new Date().getMonth() + 1,
  year: new Date().getFullYear(),
  createdAt: new Date(),
  content: {
    insights: [
      { title: 'Cached insight', description: 'From cache', type: 'info' },
    ],
    generatedAt: new Date().toISOString(),
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
  },
}

describe('GET /api/ai/insight', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetSession.mockResolvedValue(mockSession)
  })

  it('returns 401 when not authenticated', async () => {
    mockGetSession.mockResolvedValue(null)
    const res = await GET()
    expect(res.status).toBe(401)
  })

  it('returns cached insight when available', async () => {
    mockPrisma.aiInsight.findUnique.mockResolvedValue(cachedInsight)

    const res = await GET()
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.data.insights[0].title).toBe('Cached insight')
    // Should NOT call Gemini when cache exists
    const { GoogleGenAI } = await import('@google/genai')
    const mockInstance = vi.mocked(GoogleGenAI).mock.results[0]?.value
    if (mockInstance) {
      expect(mockInstance.models.generateContent).not.toHaveBeenCalled()
    }
  })

  it('generates new insight when cache is empty', async () => {
    mockPrisma.aiInsight.findUnique.mockResolvedValue(null)
    mockPrisma.transaction.findMany.mockResolvedValue([mockTransaction])
    mockPrisma.transaction.groupBy.mockResolvedValue([])
    mockPrisma.budget.findMany.mockResolvedValue([mockBudget])
    mockPrisma.aiInsight.upsert.mockResolvedValue(cachedInsight)

    const res = await GET()
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.data.insights).toBeDefined()
    expect(Array.isArray(data.data.insights)).toBe(true)
    // Should cache the result
    expect(mockPrisma.aiInsight.upsert).toHaveBeenCalled()
  })

  it('returns fallback insight when Gemini returns invalid JSON', async () => {
    mockPrisma.aiInsight.findUnique.mockResolvedValue(null)
    mockPrisma.transaction.findMany.mockResolvedValue([])
    mockPrisma.transaction.groupBy.mockResolvedValue([])
    mockPrisma.budget.findMany.mockResolvedValue([])
    mockPrisma.aiInsight.upsert.mockResolvedValue(cachedInsight)

    // Override Gemini mock to return invalid JSON
    const { GoogleGenAI } = await import('@google/genai')
    vi.mocked(GoogleGenAI).mockImplementationOnce(() => ({
      models: {
        generateContent: vi.fn().mockResolvedValue({ text: 'invalid json {{{' }),
      },
    }) as unknown as InstanceType<typeof GoogleGenAI>)

    const res = await GET()
    const data = await res.json()

    expect(res.status).toBe(200)
    // Fallback insight should be returned
    expect(data.data.insights).toHaveLength(1)
    expect(data.data.insights[0].type).toBe('info')
  })

  it('caches result with correct month and year', async () => {
    mockPrisma.aiInsight.findUnique.mockResolvedValue(null)
    mockPrisma.transaction.findMany.mockResolvedValue([])
    mockPrisma.transaction.groupBy.mockResolvedValue([])
    mockPrisma.budget.findMany.mockResolvedValue([])
    mockPrisma.aiInsight.upsert.mockResolvedValue(cachedInsight)

    await GET()

    const now = new Date()
    expect(mockPrisma.aiInsight.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          userId_month_year: expect.objectContaining({
            userId: mockSession.user.id,
            month: now.getMonth() + 1,
            year: now.getFullYear(),
          }),
        }),
      })
    )
  })
})
