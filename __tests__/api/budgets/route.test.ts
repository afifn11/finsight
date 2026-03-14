// __tests__/api/budgets/route.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { GET, POST } from '@/app/api/budgets/route'
import { mockSession, mockBudget, mockCategory, createMockRequest } from '../../mocks/fixtures'

const mockGetSession = vi.mocked(getServerSession)
const mockPrisma = vi.mocked(prisma)

describe('GET /api/budgets', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetSession.mockResolvedValue(mockSession)
  })

  it('returns 401 when not authenticated', async () => {
    mockGetSession.mockResolvedValue(null)
    const req = createMockRequest('GET', '/api/budgets')
    const res = await GET(req)
    expect(res.status).toBe(401)
  })

  it('returns budgets with computed spent and percentage', async () => {
    mockPrisma.budget.findMany.mockResolvedValue([mockBudget])
    mockPrisma.transaction.groupBy.mockResolvedValue([
      {
        categoryId: mockCategory.id,
        _sum: { amount: 450000 },
      } as unknown as Awaited<ReturnType<typeof prisma.transaction.groupBy>>[0],
    ])

    const req = createMockRequest('GET', '/api/budgets')
    const res = await GET(req)
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.data).toHaveLength(1)
    expect(data.data[0].spent).toBe(450000)
    expect(data.data[0].percentage).toBe(30)
  })

  it('returns 0 spent when no transactions for category', async () => {
    mockPrisma.budget.findMany.mockResolvedValue([mockBudget])
    mockPrisma.transaction.groupBy.mockResolvedValue([])

    const req = createMockRequest('GET', '/api/budgets')
    const res = await GET(req)
    const data = await res.json()

    expect(data.data[0].spent).toBe(0)
    expect(data.data[0].percentage).toBe(0)
  })

  it('returns empty array when no budgets set', async () => {
    mockPrisma.budget.findMany.mockResolvedValue([])
    mockPrisma.transaction.groupBy.mockResolvedValue([])

    const req = createMockRequest('GET', '/api/budgets')
    const res = await GET(req)
    const data = await res.json()

    expect(data.data).toHaveLength(0)
  })

  it('only returns active budgets', async () => {
    const req = createMockRequest('GET', '/api/budgets')
    await GET(req)

    expect(mockPrisma.budget.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          userId: mockSession.user.id,
          isActive: true,
        }),
      })
    )
  })
})

describe('POST /api/budgets', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetSession.mockResolvedValue(mockSession)
  })

  it('returns 401 when not authenticated', async () => {
    mockGetSession.mockResolvedValue(null)
    const req = createMockRequest('POST', '/api/budgets', {})
    const res = await POST(req)
    expect(res.status).toBe(401)
  })

  it('creates budget successfully with upsert', async () => {
    mockPrisma.budget.upsert.mockResolvedValue(mockBudget)

    const req = createMockRequest('POST', '/api/budgets', {
      categoryId: mockCategory.id,
      amount: 1500000,
      period: 'MONTHLY',
      alertThreshold: 80,
    })
    const res = await POST(req)
    const data = await res.json()

    expect(res.status).toBe(201)
    expect(data.message).toBe('Budget berhasil disimpan')
    expect(mockPrisma.budget.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          userId: mockSession.user.id,
          amount: 1500000,
        }),
      })
    )
  })

  it('returns 400 for invalid amount', async () => {
    const req = createMockRequest('POST', '/api/budgets', {
      categoryId: mockCategory.id,
      amount: -500,
      period: 'MONTHLY',
      alertThreshold: 80,
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('returns 400 when categoryId is missing', async () => {
    const req = createMockRequest('POST', '/api/budgets', {
      amount: 500000,
      period: 'MONTHLY',
      alertThreshold: 80,
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('uses MONTHLY as default period', async () => {
    mockPrisma.budget.upsert.mockResolvedValue(mockBudget)

    const req = createMockRequest('POST', '/api/budgets', {
      categoryId: mockCategory.id,
      amount: 500000,
      alertThreshold: 80,
    })
    await POST(req)

    expect(mockPrisma.budget.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          userId_categoryId_period: expect.objectContaining({
            period: 'MONTHLY',
          }),
        }),
      })
    )
  })
})
