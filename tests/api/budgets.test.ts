// tests/api/budgets.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET, POST } from '@/app/api/budgets/route'
import { PATCH, DELETE } from '@/app/api/budgets/[id]/route'
import { prisma } from '@/lib/prisma'
import {
  mockAuthenticatedSession,
  mockUnauthenticatedSession,
  buildRequest,
  factory,
  MOCK_USER,
} from '../helpers'

const ROUTE = (id: string) => ({ params: Promise.resolve({ id }) })

// ── GET /api/budgets ───────────────────────────────────────────
describe('GET /api/budgets', () => {
  beforeEach(() => {
    mockAuthenticatedSession()
    vi.mocked(prisma.transaction.groupBy).mockResolvedValue([])
  })

  it('returns 401 when unauthenticated', async () => {
    mockUnauthenticatedSession()
    const res = await GET(buildRequest('GET'))
    expect(res.status).toBe(401)
  })

  it('returns budgets with computed spent and percentage', async () => {
    vi.mocked(prisma.budget.findMany).mockResolvedValue([factory.budget()] as never)
    vi.mocked(prisma.transaction.groupBy).mockResolvedValue([
      { categoryId: 'cat-001', _sum: { amount: '500000' } },
    ] as never)

    const res = await GET(buildRequest('GET'))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data[0].spent).toBe(500000)
    expect(body.data[0].percentage).toBe(33)
  })

  it('returns 0 spent when no transactions for category', async () => {
    vi.mocked(prisma.budget.findMany).mockResolvedValue([factory.budget()] as never)
    vi.mocked(prisma.transaction.groupBy).mockResolvedValue([])

    const res = await GET(buildRequest('GET'))
    const body = await res.json()
    expect(body.data[0].spent).toBe(0)
    expect(body.data[0].percentage).toBe(0)
  })

  it('returns empty array when no budgets', async () => {
    vi.mocked(prisma.budget.findMany).mockResolvedValue([])
    const res = await GET(buildRequest('GET'))
    const body = await res.json()
    expect(body.data).toHaveLength(0)
  })

  it('percentage > 100 when overspent', async () => {
    vi.mocked(prisma.budget.findMany).mockResolvedValue([factory.budget()] as never)
    vi.mocked(prisma.transaction.groupBy).mockResolvedValue([
      { categoryId: 'cat-001', _sum: { amount: '2000000' } }, // exceeds 1500000
    ] as never)

    const res = await GET(buildRequest('GET'))
    const body = await res.json()
    expect(body.data[0].percentage).toBeGreaterThan(100)
  })

  it('only returns active budgets for authenticated user', async () => {
    vi.mocked(prisma.budget.findMany).mockResolvedValue([])

    await GET(buildRequest('GET'))

    expect(prisma.budget.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: MOCK_USER.id, isActive: true },
      })
    )
  })
})

// ── POST /api/budgets ──────────────────────────────────────────
describe('POST /api/budgets', () => {
  const validBody = {
    categoryId: 'cat-001',
    amount: 1500000,
    period: 'MONTHLY',
    alertThreshold: 80,
  }

  beforeEach(() => mockAuthenticatedSession())

  it('returns 401 when unauthenticated', async () => {
    mockUnauthenticatedSession()
    const res = await POST(buildRequest('POST', validBody))
    expect(res.status).toBe(401)
  })

  it('creates budget and returns 201', async () => {
    vi.mocked(prisma.budget.upsert).mockResolvedValue(factory.budget() as never)

    const res = await POST(buildRequest('POST', validBody))
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.data.id).toBe('budget-001')
    expect(body.message).toBe('Budget berhasil disimpan')
  })

  it('returns 400 — missing categoryId', async () => {
    const res = await POST(buildRequest('POST', { ...validBody, categoryId: '' }))
    expect(res.status).toBe(400)
  })

  it('returns 400 — negative amount', async () => {
    const res = await POST(buildRequest('POST', { ...validBody, amount: -1 }))
    expect(res.status).toBe(400)
  })

  it('returns 400 — invalid period', async () => {
    const res = await POST(buildRequest('POST', { ...validBody, period: 'WEEKLY' }))
    expect(res.status).toBe(400)
  })

  it('assigns correct userId from session', async () => {
    vi.mocked(prisma.budget.upsert).mockResolvedValue(factory.budget() as never)
    await POST(buildRequest('POST', validBody))
    expect(prisma.budget.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({ userId: MOCK_USER.id }),
      })
    )
  })
})

// ── PATCH /api/budgets/:id ─────────────────────────────────────
describe('PATCH /api/budgets/:id', () => {
  beforeEach(() => mockAuthenticatedSession())

  it('returns 401 when unauthenticated', async () => {
    mockUnauthenticatedSession()
    const res = await PATCH(buildRequest('PATCH', { amount: 2000000 }), ROUTE('budget-001'))
    expect(res.status).toBe(401)
  })

  it('updates budget successfully', async () => {
    vi.mocked(prisma.budget.findUnique).mockResolvedValue({ userId: MOCK_USER.id } as never)
    vi.mocked(prisma.budget.update).mockResolvedValue(factory.budget() as never)

    const res = await PATCH(buildRequest('PATCH', { amount: 2000000 }), ROUTE('budget-001'))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.message).toBe('Budget diperbarui')
  })

  it('returns 404 for other user budget', async () => {
    vi.mocked(prisma.budget.findUnique).mockResolvedValue({ userId: 'other' } as never)
    const res = await PATCH(buildRequest('PATCH', { amount: 2000000 }), ROUTE('budget-001'))
    expect(res.status).toBe(404)
  })
})

// ── DELETE /api/budgets/:id ────────────────────────────────────
describe('DELETE /api/budgets/:id', () => {
  beforeEach(() => mockAuthenticatedSession())

  it('returns 401 when unauthenticated', async () => {
    mockUnauthenticatedSession()
    const res = await DELETE(buildRequest('DELETE'), ROUTE('budget-001'))
    expect(res.status).toBe(401)
  })

  it('deletes budget successfully', async () => {
    vi.mocked(prisma.budget.findUnique).mockResolvedValue({ userId: MOCK_USER.id } as never)
    vi.mocked(prisma.budget.delete).mockResolvedValue({} as never)

    const res = await DELETE(buildRequest('DELETE'), ROUTE('budget-001'))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data.id).toBe('budget-001')
  })

  it('returns 404 for non-existent budget', async () => {
    vi.mocked(prisma.budget.findUnique).mockResolvedValue(null)
    const res = await DELETE(buildRequest('DELETE'), ROUTE('budget-999'))
    expect(res.status).toBe(404)
  })
})
