// tests/api/transactions-id.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET, PATCH, DELETE } from '@/app/api/transactions/[id]/route'
import { prisma } from '@/lib/prisma'
import {
  mockAuthenticatedSession,
  mockUnauthenticatedSession,
  buildRequest,
  factory,
  MOCK_USER,
} from '../helpers'

const ROUTE_PARAMS = { params: Promise.resolve({ id: 'tx-001' }) }
const OTHER_USER_PARAMS = { params: Promise.resolve({ id: 'tx-other' }) }

describe('GET /api/transactions/:id', () => {
  beforeEach(() => mockAuthenticatedSession())

  it('returns 401 when unauthenticated', async () => {
    mockUnauthenticatedSession()
    const res = await GET(buildRequest('GET'), ROUTE_PARAMS)
    expect(res.status).toBe(401)
  })

  it('returns transaction when found and owned by user', async () => {
    vi.mocked(prisma.transaction.findUnique).mockResolvedValue(factory.transaction() as never)
    const res = await GET(buildRequest('GET'), ROUTE_PARAMS)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data.id).toBe('tx-001')
  })

  it('returns 404 when transaction not found', async () => {
    vi.mocked(prisma.transaction.findUnique).mockResolvedValue(null)
    const res = await GET(buildRequest('GET'), ROUTE_PARAMS)
    expect(res.status).toBe(404)
  })

  it('returns 404 when transaction belongs to another user', async () => {
    vi.mocked(prisma.transaction.findUnique).mockResolvedValue(
      factory.transaction({ userId: 'other-user-id' }) as never
    )
    const res = await GET(buildRequest('GET'), ROUTE_PARAMS)
    expect(res.status).toBe(404)
  })
})

describe('PATCH /api/transactions/:id', () => {
  beforeEach(() => mockAuthenticatedSession())

  it('returns 401 when unauthenticated', async () => {
    mockUnauthenticatedSession()
    const res = await PATCH(buildRequest('PATCH', { amount: 200000 }), ROUTE_PARAMS)
    expect(res.status).toBe(401)
  })

  it('updates transaction successfully', async () => {
    vi.mocked(prisma.transaction.findUnique).mockResolvedValue(
      { userId: MOCK_USER.id } as never
    )
    const updated = factory.transaction({ amount: '200000' })
    vi.mocked(prisma.transaction.update).mockResolvedValue(updated as never)

    const res = await PATCH(buildRequest('PATCH', { amount: 200000 }), ROUTE_PARAMS)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.message).toBe('Transaksi berhasil diperbarui')
  })

  it('returns 404 when transaction not found', async () => {
    vi.mocked(prisma.transaction.findUnique).mockResolvedValue(null)
    const res = await PATCH(buildRequest('PATCH', { amount: 200000 }), ROUTE_PARAMS)
    expect(res.status).toBe(404)
  })

  it('returns 404 when transaction belongs to another user', async () => {
    vi.mocked(prisma.transaction.findUnique).mockResolvedValue(
      { userId: 'other-user' } as never
    )
    const res = await PATCH(buildRequest('PATCH', { amount: 200000 }), ROUTE_PARAMS)
    expect(res.status).toBe(404)
  })

  it('returns 400 for invalid update data', async () => {
    vi.mocked(prisma.transaction.findUnique).mockResolvedValue(
      { userId: MOCK_USER.id } as never
    )
    const res = await PATCH(buildRequest('PATCH', { amount: -999 }), ROUTE_PARAMS)
    expect(res.status).toBe(400)
  })
})

describe('DELETE /api/transactions/:id', () => {
  beforeEach(() => mockAuthenticatedSession())

  it('returns 401 when unauthenticated', async () => {
    mockUnauthenticatedSession()
    const res = await DELETE(buildRequest('DELETE'), ROUTE_PARAMS)
    expect(res.status).toBe(401)
  })

  it('deletes transaction successfully', async () => {
    vi.mocked(prisma.transaction.findUnique).mockResolvedValue(
      { userId: MOCK_USER.id } as never
    )
    vi.mocked(prisma.transaction.delete).mockResolvedValue({} as never)

    const res = await DELETE(buildRequest('DELETE'), ROUTE_PARAMS)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data.id).toBe('tx-001')
    expect(body.message).toBe('Transaksi berhasil dihapus')
  })

  it('returns 404 when transaction not found', async () => {
    vi.mocked(prisma.transaction.findUnique).mockResolvedValue(null)
    const res = await DELETE(buildRequest('DELETE'), ROUTE_PARAMS)
    expect(res.status).toBe(404)
  })

  it('returns 404 when owned by another user', async () => {
    vi.mocked(prisma.transaction.findUnique).mockResolvedValue(
      { userId: 'another-user' } as never
    )
    const res = await DELETE(buildRequest('DELETE'), ROUTE_PARAMS)
    expect(res.status).toBe(404)
  })

  it('calls delete with correct id', async () => {
    vi.mocked(prisma.transaction.findUnique).mockResolvedValue(
      { userId: MOCK_USER.id } as never
    )
    vi.mocked(prisma.transaction.delete).mockResolvedValue({} as never)

    await DELETE(buildRequest('DELETE'), ROUTE_PARAMS)

    expect(prisma.transaction.delete).toHaveBeenCalledWith({
      where: { id: 'tx-001' },
    })
  })
})
