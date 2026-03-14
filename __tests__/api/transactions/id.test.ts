// __tests__/api/transactions/id.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { GET, PATCH, DELETE } from '@/app/api/transactions/[id]/route'
import { mockSession, mockTransaction, createMockRequest } from '../../mocks/fixtures'

const mockGetSession = vi.mocked(getServerSession)
const mockPrisma = vi.mocked(prisma)
const routeParams = { params: Promise.resolve({ id: 'tx-001' }) }

describe('GET /api/transactions/:id', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetSession.mockResolvedValue(mockSession)
  })

  it('returns 401 when not authenticated', async () => {
    mockGetSession.mockResolvedValue(null)
    const req = createMockRequest('GET', '/api/transactions/tx-001')
    const res = await GET(req, routeParams)
    expect(res.status).toBe(401)
  })

  it('returns transaction when found and owned by user', async () => {
    mockPrisma.transaction.findUnique.mockResolvedValue(mockTransaction)
    const req = createMockRequest('GET', '/api/transactions/tx-001')
    const res = await GET(req, routeParams)
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.data.id).toBe('tx-001')
  })

  it('returns 404 when transaction not found', async () => {
    mockPrisma.transaction.findUnique.mockResolvedValue(null)
    const req = createMockRequest('GET', '/api/transactions/nonexistent')
    const params = { params: Promise.resolve({ id: 'nonexistent' }) }
    const res = await GET(req, params)
    expect(res.status).toBe(404)
  })

  it('returns 404 when transaction belongs to another user', async () => {
    mockPrisma.transaction.findUnique.mockResolvedValue({
      ...mockTransaction,
      userId: 'other-user-id',
    })
    const req = createMockRequest('GET', '/api/transactions/tx-001')
    const res = await GET(req, routeParams)
    expect(res.status).toBe(404)
  })
})

describe('PATCH /api/transactions/:id', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetSession.mockResolvedValue(mockSession)
  })

  it('returns 401 when not authenticated', async () => {
    mockGetSession.mockResolvedValue(null)
    const req = createMockRequest('PATCH', '/api/transactions/tx-001', {})
    const res = await PATCH(req, routeParams)
    expect(res.status).toBe(401)
  })

  it('returns 404 when transaction not found', async () => {
    mockPrisma.transaction.findUnique.mockResolvedValue(null)
    const req = createMockRequest('PATCH', '/api/transactions/tx-001', {
      description: 'Updated',
    })
    const res = await PATCH(req, routeParams)
    expect(res.status).toBe(404)
  })

  it('updates transaction successfully', async () => {
    mockPrisma.transaction.findUnique.mockResolvedValue({
      userId: mockSession.user.id,
    })
    mockPrisma.transaction.update.mockResolvedValue({
      ...mockTransaction,
      description: 'Updated description',
    })

    const req = createMockRequest('PATCH', '/api/transactions/tx-001', {
      description: 'Updated description',
    })
    const res = await PATCH(req, routeParams)
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.message).toBe('Transaksi berhasil diperbarui')
  })

  it('returns 404 when updating transaction of another user', async () => {
    mockPrisma.transaction.findUnique.mockResolvedValue({
      userId: 'other-user',
    })
    const req = createMockRequest('PATCH', '/api/transactions/tx-001', {
      description: 'Hack attempt',
    })
    const res = await PATCH(req, routeParams)
    expect(res.status).toBe(404)
  })
})

describe('DELETE /api/transactions/:id', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetSession.mockResolvedValue(mockSession)
  })

  it('returns 401 when not authenticated', async () => {
    mockGetSession.mockResolvedValue(null)
    const req = createMockRequest('DELETE', '/api/transactions/tx-001')
    const res = await DELETE(req, routeParams)
    expect(res.status).toBe(401)
  })

  it('deletes transaction successfully', async () => {
    mockPrisma.transaction.findUnique.mockResolvedValue({
      userId: mockSession.user.id,
    })
    mockPrisma.transaction.delete.mockResolvedValue(mockTransaction)

    const req = createMockRequest('DELETE', '/api/transactions/tx-001')
    const res = await DELETE(req, routeParams)
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.data.id).toBe('tx-001')
    expect(mockPrisma.transaction.delete).toHaveBeenCalledWith({
      where: { id: 'tx-001' },
    })
  })

  it('returns 404 when transaction not found', async () => {
    mockPrisma.transaction.findUnique.mockResolvedValue(null)
    const req = createMockRequest('DELETE', '/api/transactions/nonexistent')
    const params = { params: Promise.resolve({ id: 'nonexistent' }) }
    const res = await DELETE(req, params)
    expect(res.status).toBe(404)
  })

  it('prevents deleting another user transaction', async () => {
    mockPrisma.transaction.findUnique.mockResolvedValue({
      userId: 'attacker-id',
    })
    const req = createMockRequest('DELETE', '/api/transactions/tx-001')
    const res = await DELETE(req, routeParams)
    expect(res.status).toBe(404)
    expect(mockPrisma.transaction.delete).not.toHaveBeenCalled()
  })
})
