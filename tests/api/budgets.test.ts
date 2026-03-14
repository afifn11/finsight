// tests/api/budgets.test.ts
import { describe, it, expect, vi } from 'vitest'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { MOCK_SESSION, MOCK_BUDGET, buildRequest } from '../setup'
import { GET, POST } from '@/app/api/budgets/route'
import { PATCH, DELETE } from '@/app/api/budgets/[id]/route'

const mockSession = vi.mocked(getServerSession)
const mockPrisma = vi.mocked(prisma)

describe('GET /api/budgets', () => {
  it('returns 401 when not authenticated', async () => {
    mockSession.mockResolvedValueOnce(null)
    expect((await GET(buildRequest('/api/budgets'))).status).toBe(401)
  })

  it('returns budgets with computed spent and percentage', async () => {
    mockSession.mockResolvedValueOnce(MOCK_SESSION)
    vi.mocked(mockPrisma.budget.findMany).mockResolvedValueOnce([MOCK_BUDGET])
    vi.mocked(mockPrisma.transaction.groupBy).mockResolvedValueOnce([
      { categoryId: 'cat-001', _sum: { amount: 800000 } },
    ] as never)
    const body = await (await GET(buildRequest('/api/budgets'))).json()
    expect(body.data[0].spent).toBe(800000)
    expect(body.data[0].percentage).toBe(53)
  })

  it('returns 0 spent when no transactions', async () => {
    mockSession.mockResolvedValueOnce(MOCK_SESSION)
    vi.mocked(mockPrisma.budget.findMany).mockResolvedValueOnce([MOCK_BUDGET])
    vi.mocked(mockPrisma.transaction.groupBy).mockResolvedValueOnce([])
    const body = await (await GET(buildRequest('/api/budgets'))).json()
    expect(body.data[0].spent).toBe(0)
    expect(body.data[0].percentage).toBe(0)
  })

  it('returns empty array when no budgets', async () => {
    mockSession.mockResolvedValueOnce(MOCK_SESSION)
    vi.mocked(mockPrisma.budget.findMany).mockResolvedValueOnce([])
    vi.mocked(mockPrisma.transaction.groupBy).mockResolvedValueOnce([])
    const body = await (await GET(buildRequest('/api/budgets'))).json()
    expect(body.data).toHaveLength(0)
  })

  it('percentage > 100 when overspent', async () => {
    mockSession.mockResolvedValueOnce(MOCK_SESSION)
    vi.mocked(mockPrisma.budget.findMany).mockResolvedValueOnce([MOCK_BUDGET])
    vi.mocked(mockPrisma.transaction.groupBy).mockResolvedValueOnce([
      { categoryId: 'cat-001', _sum: { amount: 2000000 } },
    ] as never)
    const body = await (await GET(buildRequest('/api/budgets'))).json()
    expect(body.data[0].percentage).toBe(133)
  })
})

describe('POST /api/budgets', () => {
  const validBody = { categoryId: 'cat-001', amount: 1500000, period: 'MONTHLY', alertThreshold: 80 }

  it('returns 401 when not authenticated', async () => {
    mockSession.mockResolvedValueOnce(null)
    expect((await POST(buildRequest('/api/budgets', { method: 'POST', body: {} }))).status).toBe(401)
  })

  it('creates budget successfully', async () => {
    mockSession.mockResolvedValueOnce(MOCK_SESSION)
    vi.mocked(mockPrisma.budget.upsert).mockResolvedValueOnce(MOCK_BUDGET)
    const res = await POST(buildRequest('/api/budgets', { method: 'POST', body: validBody }))
    const body = await res.json()
    expect(res.status).toBe(201)
    expect(body.data.id).toBe('budget-001')
    expect(mockPrisma.budget.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ create: expect.objectContaining({ userId: 'user-test-123' }) })
    )
  })

  it('returns 400 — missing categoryId', async () => {
    mockSession.mockResolvedValueOnce(MOCK_SESSION)
    const { categoryId: _, ...body } = validBody
    expect((await POST(buildRequest('/api/budgets', { method: 'POST', body }))).status).toBe(400)
  })

  it('returns 400 — negative amount', async () => {
    mockSession.mockResolvedValueOnce(MOCK_SESSION)
    expect((await POST(buildRequest('/api/budgets', { method: 'POST', body: { ...validBody, amount: -1 } }))).status).toBe(400)
  })

  it('returns 400 — invalid period', async () => {
    mockSession.mockResolvedValueOnce(MOCK_SESSION)
    expect((await POST(buildRequest('/api/budgets', { method: 'POST', body: { ...validBody, period: 'WEEKLY' } }))).status).toBe(400)
  })
})

describe('PATCH /api/budgets/:id', () => {
  it('returns 401 when not authenticated', async () => {
    mockSession.mockResolvedValueOnce(null)
    expect((await PATCH(buildRequest('/api/budgets/b1', { method: 'PATCH' }), { params: Promise.resolve({ id: 'b1' }) })).status).toBe(401)
  })

  it('updates budget successfully', async () => {
    mockSession.mockResolvedValueOnce(MOCK_SESSION)
    vi.mocked(mockPrisma.budget.findUnique).mockResolvedValueOnce({ userId: 'user-test-123' } as typeof MOCK_BUDGET)
    vi.mocked(mockPrisma.budget.update).mockResolvedValueOnce({ ...MOCK_BUDGET, amount: 2000000 })
    const res = await PATCH(buildRequest('/api/budgets/b1', { method: 'PATCH', body: { amount: 2000000 } }), { params: Promise.resolve({ id: 'b1' }) })
    expect(res.status).toBe(200)
  })

  it('returns 404 for other user budget', async () => {
    mockSession.mockResolvedValueOnce(MOCK_SESSION)
    vi.mocked(mockPrisma.budget.findUnique).mockResolvedValueOnce({ userId: 'other' } as typeof MOCK_BUDGET)
    expect((await PATCH(buildRequest('/api/budgets/b1', { method: 'PATCH', body: {} }), { params: Promise.resolve({ id: 'b1' }) })).status).toBe(404)
  })
})

describe('DELETE /api/budgets/:id', () => {
  it('returns 401 when not authenticated', async () => {
    mockSession.mockResolvedValueOnce(null)
    expect((await DELETE(buildRequest('/api/budgets/b1', { method: 'DELETE' }), { params: Promise.resolve({ id: 'b1' }) })).status).toBe(401)
  })

  it('deletes budget successfully', async () => {
    mockSession.mockResolvedValueOnce(MOCK_SESSION)
    vi.mocked(mockPrisma.budget.findUnique).mockResolvedValueOnce({ userId: 'user-test-123' } as typeof MOCK_BUDGET)
    vi.mocked(mockPrisma.budget.delete).mockResolvedValueOnce(MOCK_BUDGET)
    const res = await DELETE(buildRequest('/api/budgets/b1', { method: 'DELETE' }), { params: Promise.resolve({ id: 'b1' }) })
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.data.id).toBe('budget-001')
  })

  it('returns 404 for non-existent budget', async () => {
    mockSession.mockResolvedValueOnce(MOCK_SESSION)
    vi.mocked(mockPrisma.budget.findUnique).mockResolvedValueOnce(null)
    expect((await DELETE(buildRequest('/api/budgets/none', { method: 'DELETE' }), { params: Promise.resolve({ id: 'none' }) })).status).toBe(404)
  })
})
