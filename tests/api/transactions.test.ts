// tests/api/transactions.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET, POST } from '@/app/api/transactions/route'
import { GET as GET_ONE, PATCH, DELETE } from '@/app/api/transactions/[id]/route'
import { prisma } from '@/lib/prisma'
import {
  mockAuthenticatedSession,
  mockUnauthenticatedSession,
  buildRequest,
  factory,
  MOCK_USER,
} from '../helpers'

const ROUTE = (id: string) => ({ params: Promise.resolve({ id }) })

// ── GET /api/transactions ──────────────────────────────────────
describe('GET /api/transactions', () => {
  beforeEach(() => {
    mockAuthenticatedSession()
    vi.mocked(prisma.transaction.findMany).mockResolvedValue([])
    vi.mocked(prisma.transaction.count).mockResolvedValue(0)
  })

  it('returns 401 when not authenticated', async () => {
    mockUnauthenticatedSession()
    const res = await GET(buildRequest('GET'))
    expect(res.status).toBe(401)
  })

  it('returns paginated transactions', async () => {
    const tx = factory.transaction()
    vi.mocked(prisma.transaction.findMany).mockResolvedValue([tx] as never)
    vi.mocked(prisma.transaction.count).mockResolvedValue(1)

    const res = await GET(buildRequest('GET'))
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.data.data).toHaveLength(1)
    expect(body.data.total).toBe(1)
  })

  it('filters by type=INCOME', async () => {
    await GET(buildRequest('GET', undefined, { type: 'INCOME' }))
    expect(prisma.transaction.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ type: 'INCOME', userId: MOCK_USER.id }),
      })
    )
  })

  it('applies correct pagination skip', async () => {
    vi.mocked(prisma.transaction.count).mockResolvedValue(50)
    await GET(buildRequest('GET', undefined, { page: '3', limit: '10' }))
    expect(prisma.transaction.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 20, take: 10 })
    )
  })

  it('filters by search term', async () => {
    await GET(buildRequest('GET', undefined, { search: 'makan' }))
    expect(prisma.transaction.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          description: { contains: 'makan', mode: 'insensitive' },
        }),
      })
    )
  })
})

// ── POST /api/transactions ─────────────────────────────────────
describe('POST /api/transactions', () => {
  const validBody = {
    amount: 150000,
    type: 'EXPENSE',
    categoryId: 'cat-001',
    description: 'Makan siang',
    date: new Date().toISOString(),
    isRecurring: false,
  }

  beforeEach(() => mockAuthenticatedSession())

  it('returns 401 when not authenticated', async () => {
    mockUnauthenticatedSession()
    const res = await POST(buildRequest('POST', {}))
    expect(res.status).toBe(401)
  })

  it('creates transaction successfully', async () => {
    vi.mocked(prisma.transaction.create).mockResolvedValue(factory.transaction() as never)
    const res = await POST(buildRequest('POST', validBody))
    const body = await res.json()
    expect(res.status).toBe(201)
    expect(body.data.id).toBe('tx-001')
  })

  it('returns 400 — missing description', async () => {
    const { description: _, ...noDesc } = validBody
    const res = await POST(buildRequest('POST', noDesc))
    expect(res.status).toBe(400)
  })

  it('returns 400 — negative amount', async () => {
    const res = await POST(buildRequest('POST', { ...validBody, amount: -1000 }))
    expect(res.status).toBe(400)
  })

  it('returns 400 — invalid type', async () => {
    const res = await POST(buildRequest('POST', { ...validBody, type: 'INVALID' }))
    expect(res.status).toBe(400)
  })

  it('returns 400 — zero amount', async () => {
    const res = await POST(buildRequest('POST', { ...validBody, amount: 0 }))
    expect(res.status).toBe(400)
  })

  it('assigns userId from session', async () => {
    vi.mocked(prisma.transaction.create).mockResolvedValue(factory.transaction() as never)
    await POST(buildRequest('POST', validBody))
    expect(prisma.transaction.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ userId: MOCK_USER.id }),
      })
    )
  })
})

// ── GET /api/transactions/:id ──────────────────────────────────
describe('GET /api/transactions/:id', () => {
  beforeEach(() => mockAuthenticatedSession())

  it('returns 401 when not authenticated', async () => {
    mockUnauthenticatedSession()
    const res = await GET_ONE(buildRequest('GET'), ROUTE('tx-001'))
    expect(res.status).toBe(401)
  })

  it('returns transaction for owner', async () => {
    vi.mocked(prisma.transaction.findUnique).mockResolvedValue(factory.transaction() as never)
    const res = await GET_ONE(buildRequest('GET'), ROUTE('tx-001'))
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.data.id).toBe('tx-001')
  })

  it('returns 404 for non-existent id', async () => {
    vi.mocked(prisma.transaction.findUnique).mockResolvedValue(null)
    const res = await GET_ONE(buildRequest('GET'), ROUTE('none'))
    expect(res.status).toBe(404)
  })

  it('returns 404 for other user transaction', async () => {
    vi.mocked(prisma.transaction.findUnique).mockResolvedValue(
      factory.transaction({ userId: 'other' }) as never
    )
    const res = await GET_ONE(buildRequest('GET'), ROUTE('tx-001'))
    expect(res.status).toBe(404)
  })
})

// ── PATCH /api/transactions/:id ────────────────────────────────
describe('PATCH /api/transactions/:id', () => {
  beforeEach(() => mockAuthenticatedSession())

  it('returns 401 when not authenticated', async () => {
    mockUnauthenticatedSession()
    const res = await PATCH(buildRequest('PATCH', {}), ROUTE('tx-001'))
    expect(res.status).toBe(401)
  })

  it('updates transaction successfully', async () => {
    vi.mocked(prisma.transaction.findUnique).mockResolvedValue({ userId: MOCK_USER.id } as never)
    vi.mocked(prisma.transaction.update).mockResolvedValue(factory.transaction() as never)
    const res = await PATCH(buildRequest('PATCH', { description: 'Updated' }), ROUTE('tx-001'))
    expect(res.status).toBe(200)
  })

  it('returns 404 for other user transaction', async () => {
    vi.mocked(prisma.transaction.findUnique).mockResolvedValue({ userId: 'other' } as never)
    const res = await PATCH(buildRequest('PATCH', { description: 'x' }), ROUTE('tx-001'))
    expect(res.status).toBe(404)
  })
})

// ── DELETE /api/transactions/:id ───────────────────────────────
describe('DELETE /api/transactions/:id', () => {
  beforeEach(() => mockAuthenticatedSession())

  it('returns 401 when not authenticated', async () => {
    mockUnauthenticatedSession()
    const res = await DELETE(buildRequest('DELETE'), ROUTE('tx-001'))
    expect(res.status).toBe(401)
  })

  it('deletes transaction successfully', async () => {
    vi.mocked(prisma.transaction.findUnique).mockResolvedValue({ userId: MOCK_USER.id } as never)
    vi.mocked(prisma.transaction.delete).mockResolvedValue({} as never)
    const res = await DELETE(buildRequest('DELETE'), ROUTE('tx-001'))
    expect(res.status).toBe(200)
  })

  it('returns 404 for non-existent transaction', async () => {
    vi.mocked(prisma.transaction.findUnique).mockResolvedValue(null)
    const res = await DELETE(buildRequest('DELETE'), ROUTE('none'))
    expect(res.status).toBe(404)
  })
})
