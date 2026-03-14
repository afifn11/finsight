// tests/api/transactions.test.ts
import { describe, it, expect, vi } from 'vitest'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { MOCK_SESSION, MOCK_TRANSACTION, buildRequest } from '../setup'
import { GET, POST } from '@/app/api/transactions/route'
import { GET as GET_ONE, PATCH, DELETE } from '@/app/api/transactions/[id]/route'

const mockSession = vi.mocked(getServerSession)
const mockPrisma = vi.mocked(prisma)

describe('GET /api/transactions', () => {
  it('returns 401 when not authenticated', async () => {
    mockSession.mockResolvedValueOnce(null)
    const res = await GET(buildRequest('/api/transactions'))
    expect(res.status).toBe(401)
  })

  it('returns paginated transactions', async () => {
    mockSession.mockResolvedValueOnce(MOCK_SESSION)
    vi.mocked(mockPrisma.transaction.findMany).mockResolvedValueOnce([MOCK_TRANSACTION])
    vi.mocked(mockPrisma.transaction.count).mockResolvedValueOnce(1)
    const res = await GET(buildRequest('/api/transactions'))
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.data.data).toHaveLength(1)
    expect(body.data.total).toBe(1)
  })

  it('filters by type=INCOME', async () => {
    mockSession.mockResolvedValueOnce(MOCK_SESSION)
    vi.mocked(mockPrisma.transaction.findMany).mockResolvedValueOnce([])
    vi.mocked(mockPrisma.transaction.count).mockResolvedValueOnce(0)
    await GET(buildRequest('/api/transactions', { searchParams: { type: 'INCOME' } }))
    expect(mockPrisma.transaction.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ type: 'INCOME' }) })
    )
  })

  it('applies correct pagination skip', async () => {
    mockSession.mockResolvedValueOnce(MOCK_SESSION)
    vi.mocked(mockPrisma.transaction.findMany).mockResolvedValueOnce([])
    vi.mocked(mockPrisma.transaction.count).mockResolvedValueOnce(50)
    const res = await GET(buildRequest('/api/transactions', { searchParams: { page: '3', limit: '10' } }))
    const body = await res.json()
    expect(body.data.totalPages).toBe(5)
    expect(mockPrisma.transaction.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 20, take: 10 })
    )
  })

  it('filters by search term', async () => {
    mockSession.mockResolvedValueOnce(MOCK_SESSION)
    vi.mocked(mockPrisma.transaction.findMany).mockResolvedValueOnce([MOCK_TRANSACTION])
    vi.mocked(mockPrisma.transaction.count).mockResolvedValueOnce(1)
    await GET(buildRequest('/api/transactions', { searchParams: { search: 'makan' } }))
    expect(mockPrisma.transaction.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          description: expect.objectContaining({ contains: 'makan' }),
        }),
      })
    )
  })
})

describe('POST /api/transactions', () => {
  const validBody = {
    amount: 50000, type: 'EXPENSE', categoryId: 'cat-001',
    description: 'Makan siang', date: new Date().toISOString(), isRecurring: false,
  }

  it('returns 401 when not authenticated', async () => {
    mockSession.mockResolvedValueOnce(null)
    const res = await POST(buildRequest('/api/transactions', { method: 'POST', body: {} }))
    expect(res.status).toBe(401)
  })

  it('creates transaction successfully', async () => {
    mockSession.mockResolvedValueOnce(MOCK_SESSION)
    vi.mocked(mockPrisma.transaction.create).mockResolvedValueOnce(MOCK_TRANSACTION)
    const res = await POST(buildRequest('/api/transactions', { method: 'POST', body: validBody }))
    const body = await res.json()
    expect(res.status).toBe(201)
    expect(body.data.id).toBe('tx-001')
    expect(mockPrisma.transaction.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ userId: 'user-test-123' }) })
    )
  })

  it('returns 400 — missing description', async () => {
    mockSession.mockResolvedValueOnce(MOCK_SESSION)
    const { description: _, ...noDesc } = validBody
    const res = await POST(buildRequest('/api/transactions', { method: 'POST', body: noDesc }))
    expect(res.status).toBe(400)
  })

  it('returns 400 — negative amount', async () => {
    mockSession.mockResolvedValueOnce(MOCK_SESSION)
    const res = await POST(buildRequest('/api/transactions', {
      method: 'POST', body: { ...validBody, amount: -1000 }
    }))
    expect(res.status).toBe(400)
  })

  it('returns 400 — invalid type', async () => {
    mockSession.mockResolvedValueOnce(MOCK_SESSION)
    const res = await POST(buildRequest('/api/transactions', {
      method: 'POST', body: { ...validBody, type: 'INVALID' }
    }))
    expect(res.status).toBe(400)
  })

  it('returns 400 — zero amount', async () => {
    mockSession.mockResolvedValueOnce(MOCK_SESSION)
    const res = await POST(buildRequest('/api/transactions', {
      method: 'POST', body: { ...validBody, amount: 0 }
    }))
    expect(res.status).toBe(400)
  })
})

describe('GET /api/transactions/:id', () => {
  it('returns 401 when not authenticated', async () => {
    mockSession.mockResolvedValueOnce(null)
    const res = await GET_ONE(buildRequest('/api/transactions/tx-001'), { params: Promise.resolve({ id: 'tx-001' }) })
    expect(res.status).toBe(401)
  })

  it('returns transaction for owner', async () => {
    mockSession.mockResolvedValueOnce(MOCK_SESSION)
    vi.mocked(mockPrisma.transaction.findUnique).mockResolvedValueOnce(MOCK_TRANSACTION)
    const res = await GET_ONE(buildRequest('/api/transactions/tx-001'), { params: Promise.resolve({ id: 'tx-001' }) })
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.data.id).toBe('tx-001')
  })

  it('returns 404 for non-existent id', async () => {
    mockSession.mockResolvedValueOnce(MOCK_SESSION)
    vi.mocked(mockPrisma.transaction.findUnique).mockResolvedValueOnce(null)
    const res = await GET_ONE(buildRequest('/api/transactions/none'), { params: Promise.resolve({ id: 'none' }) })
    expect(res.status).toBe(404)
  })

  it('returns 404 for other user transaction', async () => {
    mockSession.mockResolvedValueOnce(MOCK_SESSION)
    vi.mocked(mockPrisma.transaction.findUnique).mockResolvedValueOnce({ ...MOCK_TRANSACTION, userId: 'other' })
    const res = await GET_ONE(buildRequest('/api/transactions/tx-001'), { params: Promise.resolve({ id: 'tx-001' }) })
    expect(res.status).toBe(404)
  })
})

describe('PATCH /api/transactions/:id', () => {
  it('returns 401 when not authenticated', async () => {
    mockSession.mockResolvedValueOnce(null)
    const res = await PATCH(buildRequest('/api/transactions/tx-001', { method: 'PATCH' }), { params: Promise.resolve({ id: 'tx-001' }) })
    expect(res.status).toBe(401)
  })

  it('updates transaction successfully', async () => {
    mockSession.mockResolvedValueOnce(MOCK_SESSION)
    vi.mocked(mockPrisma.transaction.findUnique).mockResolvedValueOnce({ userId: 'user-test-123' } as typeof MOCK_TRANSACTION)
    vi.mocked(mockPrisma.transaction.update).mockResolvedValueOnce({ ...MOCK_TRANSACTION, description: 'Makan malam' })
    const res = await PATCH(buildRequest('/api/transactions/tx-001', { method: 'PATCH', body: { description: 'Makan malam' } }), { params: Promise.resolve({ id: 'tx-001' }) })
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.data.description).toBe('Makan malam')
  })

  it('returns 404 for other user transaction', async () => {
    mockSession.mockResolvedValueOnce(MOCK_SESSION)
    vi.mocked(mockPrisma.transaction.findUnique).mockResolvedValueOnce({ userId: 'other' } as typeof MOCK_TRANSACTION)
    const res = await PATCH(buildRequest('/api/transactions/tx-001', { method: 'PATCH', body: { description: 'Hack' } }), { params: Promise.resolve({ id: 'tx-001' }) })
    expect(res.status).toBe(404)
  })
})

describe('DELETE /api/transactions/:id', () => {
  it('returns 401 when not authenticated', async () => {
    mockSession.mockResolvedValueOnce(null)
    const res = await DELETE(buildRequest('/api/transactions/tx-001', { method: 'DELETE' }), { params: Promise.resolve({ id: 'tx-001' }) })
    expect(res.status).toBe(401)
  })

  it('deletes transaction successfully', async () => {
    mockSession.mockResolvedValueOnce(MOCK_SESSION)
    vi.mocked(mockPrisma.transaction.findUnique).mockResolvedValueOnce({ userId: 'user-test-123' } as typeof MOCK_TRANSACTION)
    vi.mocked(mockPrisma.transaction.delete).mockResolvedValueOnce(MOCK_TRANSACTION)
    const res = await DELETE(buildRequest('/api/transactions/tx-001', { method: 'DELETE' }), { params: Promise.resolve({ id: 'tx-001' }) })
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.data.id).toBe('tx-001')
    expect(mockPrisma.transaction.delete).toHaveBeenCalledWith({ where: { id: 'tx-001' } })
  })

  it('returns 404 for non-existent transaction', async () => {
    mockSession.mockResolvedValueOnce(MOCK_SESSION)
    vi.mocked(mockPrisma.transaction.findUnique).mockResolvedValueOnce(null)
    const res = await DELETE(buildRequest('/api/transactions/none', { method: 'DELETE' }), { params: Promise.resolve({ id: 'none' }) })
    expect(res.status).toBe(404)
  })
})
