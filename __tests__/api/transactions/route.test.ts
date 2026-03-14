// __tests__/api/transactions/route.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { GET, POST } from '@/app/api/transactions/route'
import {
  mockSession,
  mockTransaction,
  mockIncomeTransaction,
  createMockRequest,
} from '../../mocks/fixtures'

const mockGetSession = vi.mocked(getServerSession)
const mockPrisma = vi.mocked(prisma)

describe('GET /api/transactions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetSession.mockResolvedValue(mockSession)
  })

  it('returns 401 when not authenticated', async () => {
    mockGetSession.mockResolvedValue(null)
    const req = createMockRequest('GET', '/api/transactions')
    const res = await GET(req)
    expect(res.status).toBe(401)
    const data = await res.json()
    expect(data.error).toBe('Unauthorized')
  })

  it('returns paginated transactions for authenticated user', async () => {
    const mockData = [mockTransaction, mockIncomeTransaction]
    mockPrisma.transaction.findMany.mockResolvedValue(mockData)
    mockPrisma.transaction.count.mockResolvedValue(2)

    const req = createMockRequest('GET', '/api/transactions')
    const res = await GET(req)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.data.data).toHaveLength(2)
    expect(body.data.total).toBe(2)
    expect(body.data.page).toBe(1)
    expect(body.data.totalPages).toBe(1)
  })

  it('filters by type=EXPENSE correctly', async () => {
    mockPrisma.transaction.findMany.mockResolvedValue([mockTransaction])
    mockPrisma.transaction.count.mockResolvedValue(1)

    const req = createMockRequest('GET', '/api/transactions', undefined, { type: 'EXPENSE' })
    const res = await GET(req)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(mockPrisma.transaction.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          type: 'EXPENSE',
          userId: mockSession.user.id,
        }),
      })
    )
  })

  it('filters by type=INCOME correctly', async () => {
    mockPrisma.transaction.findMany.mockResolvedValue([mockIncomeTransaction])
    mockPrisma.transaction.count.mockResolvedValue(1)

    const req = createMockRequest('GET', '/api/transactions', undefined, { type: 'INCOME' })
    const res = await GET(req)

    expect(res.status).toBe(200)
    expect(mockPrisma.transaction.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ type: 'INCOME' }),
      })
    )
  })

  it('applies search filter to description', async () => {
    mockPrisma.transaction.findMany.mockResolvedValue([mockTransaction])
    mockPrisma.transaction.count.mockResolvedValue(1)

    const req = createMockRequest('GET', '/api/transactions', undefined, { search: 'makan' })
    await GET(req)

    expect(mockPrisma.transaction.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          description: { contains: 'makan', mode: 'insensitive' },
        }),
      })
    )
  })

  it('handles pagination correctly', async () => {
    mockPrisma.transaction.findMany.mockResolvedValue([mockTransaction])
    mockPrisma.transaction.count.mockResolvedValue(25)

    const req = createMockRequest('GET', '/api/transactions', undefined, {
      page: '2',
      limit: '10',
    })
    const res = await GET(req)
    const body = await res.json()

    expect(body.data.page).toBe(2)
    expect(body.data.totalPages).toBe(3)
    expect(mockPrisma.transaction.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 10, take: 10 })
    )
  })

  it('returns empty array when no transactions found', async () => {
    mockPrisma.transaction.findMany.mockResolvedValue([])
    mockPrisma.transaction.count.mockResolvedValue(0)

    const req = createMockRequest('GET', '/api/transactions')
    const res = await GET(req)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.data.data).toHaveLength(0)
    expect(body.data.total).toBe(0)
  })
})

describe('POST /api/transactions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetSession.mockResolvedValue(mockSession)
  })

  it('returns 401 when not authenticated', async () => {
    mockGetSession.mockResolvedValue(null)
    const req = createMockRequest('POST', '/api/transactions', {})
    const res = await POST(req)
    expect(res.status).toBe(401)
  })

  it('creates a transaction successfully', async () => {
    mockPrisma.transaction.create.mockResolvedValue(mockTransaction)

    const body = {
      amount: 150000,
      type: 'EXPENSE',
      categoryId: 'cat-makanan',
      description: 'Makan siang',
      date: new Date('2026-03-10').toISOString(),
      isRecurring: false,
    }

    const req = createMockRequest('POST', '/api/transactions', body)
    const res = await POST(req)
    const data = await res.json()

    expect(res.status).toBe(201)
    expect(data.message).toBe('Transaksi berhasil ditambahkan')
    expect(mockPrisma.transaction.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: mockSession.user.id,
          amount: 150000,
          type: 'EXPENSE',
        }),
      })
    )
  })

  it('returns 400 for invalid amount (negative)', async () => {
    const req = createMockRequest('POST', '/api/transactions', {
      amount: -100,
      type: 'EXPENSE',
      categoryId: 'cat-makanan',
      description: 'Test',
      date: new Date().toISOString(),
      isRecurring: false,
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toBe('Validasi gagal')
  })

  it('returns 400 when required fields are missing', async () => {
    const req = createMockRequest('POST', '/api/transactions', {
      amount: 100000,
      // missing type, categoryId, description, date
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('returns 400 when description is empty', async () => {
    const req = createMockRequest('POST', '/api/transactions', {
      amount: 100000,
      type: 'EXPENSE',
      categoryId: 'cat-makanan',
      description: '',
      date: new Date().toISOString(),
      isRecurring: false,
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('creates income transaction correctly', async () => {
    mockPrisma.transaction.create.mockResolvedValue(mockIncomeTransaction)

    const req = createMockRequest('POST', '/api/transactions', {
      amount: 5000000,
      type: 'INCOME',
      categoryId: 'cat-gaji',
      description: 'Gaji Maret',
      date: new Date('2026-03-01').toISOString(),
      isRecurring: false,
    })
    const res = await POST(req)
    expect(res.status).toBe(201)
  })
})
