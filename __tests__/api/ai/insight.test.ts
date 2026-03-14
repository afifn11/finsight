// __tests__/api/ai/insight.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET } from '@/app/api/ai/insight/route'
import { prisma } from '@/lib/prisma'
import {
  mockAuthenticatedSession,
  mockUnauthenticatedSession,
  buildRequest,
} from '../../helpers'

// ── Mock GoogleGenAI sebagai class (constructor) ───────────────
vi.mock('@google/genai', () => {
  const mockGenerateContent = vi.fn().mockResolvedValue({
    text: JSON.stringify([
      { title: 'Test insight', description: 'Deskripsi test', type: 'info' },
    ]),
  })

  const MockGoogleGenAI = vi.fn().mockImplementation(() => ({
    models: { generateContent: mockGenerateContent },
  }))

  return { GoogleGenAI: MockGoogleGenAI }
})

describe('GET /api/ai/insight', () => {
  beforeEach(() => {
    mockAuthenticatedSession()
    vi.mocked(prisma.transaction.findMany).mockResolvedValue([])
    vi.mocked(prisma.transaction.groupBy).mockResolvedValue([])
    vi.mocked(prisma.budget.findMany).mockResolvedValue([])
  })

  it('returns 401 when unauthenticated', async () => {
    mockUnauthenticatedSession()
    const res = await GET()
    expect(res.status).toBe(401)
  })

  it('returns cached insight if exists for current month', async () => {
    const cached = {
      id: 'insight-001',
      userId: 'user-test-123',
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear(),
      createdAt: new Date(),
      content: {
        insights: [{ title: 'Cached', description: 'From cache', type: 'info' }],
        generatedAt: new Date().toISOString(),
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
      },
    }
    vi.mocked(prisma.aiInsight.findUnique).mockResolvedValue(cached as never)

    const res = await GET()
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data.insights[0]?.title).toBe('Cached')
  })

  it('generates new insight when no cache', async () => {
    vi.mocked(prisma.aiInsight.findUnique).mockResolvedValue(null)
    vi.mocked(prisma.aiInsight.upsert).mockResolvedValue({} as never)

    const res = await GET()
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data.insights).toHaveLength(1)
    expect(body.data.insights[0]?.title).toBe('Test insight')
  })

  it('caches generated insight', async () => {
    vi.mocked(prisma.aiInsight.findUnique).mockResolvedValue(null)
    vi.mocked(prisma.aiInsight.upsert).mockResolvedValue({} as never)

    await GET()

    expect(prisma.aiInsight.upsert).toHaveBeenCalledOnce()
  })

  it('returns fallback insight on JSON parse error', async () => {
    vi.mocked(prisma.aiInsight.findUnique).mockResolvedValue(null)
    vi.mocked(prisma.aiInsight.upsert).mockResolvedValue({} as never)

    const { GoogleGenAI } = await import('@google/genai')
    vi.mocked(GoogleGenAI).mockImplementationOnce(() => ({
      models: {
        generateContent: vi.fn().mockResolvedValue({ text: 'invalid json{{' }),
      },
    }) as never)

    const res = await GET()
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data.insights[0]?.title).toBe('Data keuangan siap dianalisis')
  })
})
