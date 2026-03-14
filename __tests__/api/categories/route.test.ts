// __tests__/api/categories/route.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { GET, POST } from '@/app/api/categories/route'
import { mockSession, mockCategory, mockIncomeCategory, createMockRequest } from '../../mocks/fixtures'

const mockGetSession = vi.mocked(getServerSession)
const mockPrisma = vi.mocked(prisma)

describe('GET /api/categories', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetSession.mockResolvedValue(mockSession)
  })

  it('returns 401 when not authenticated', async () => {
    mockGetSession.mockResolvedValue(null)
    const req = createMockRequest('GET', '/api/categories')
    const res = await GET(req)
    expect(res.status).toBe(401)
  })

  it('returns all system + user categories', async () => {
    mockPrisma.category.findMany.mockResolvedValue([mockCategory, mockIncomeCategory])

    const req = createMockRequest('GET', '/api/categories')
    const res = await GET(req)
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.data).toHaveLength(2)
  })

  it('filters by forType=EXPENSE', async () => {
    mockPrisma.category.findMany.mockResolvedValue([mockCategory])

    const req = createMockRequest('GET', '/api/categories', undefined, {
      forType: 'EXPENSE',
    })
    const res = await GET(req)
    const data = await res.json()

    expect(data.data).toHaveLength(1)
    expect(mockPrisma.category.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ forType: 'EXPENSE' }),
      })
    )
  })

  it('filters by forType=INCOME', async () => {
    mockPrisma.category.findMany.mockResolvedValue([mockIncomeCategory])

    const req = createMockRequest('GET', '/api/categories', undefined, {
      forType: 'INCOME',
    })
    await GET(req)

    expect(mockPrisma.category.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ forType: 'INCOME' }),
      })
    )
  })

  it('includes both null (system) and user categories in query', async () => {
    mockPrisma.category.findMany.mockResolvedValue([])

    const req = createMockRequest('GET', '/api/categories')
    await GET(req)

    expect(mockPrisma.category.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: [
            { userId: null },
            { userId: mockSession.user.id },
          ],
        }),
      })
    )
  })
})

describe('POST /api/categories', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetSession.mockResolvedValue(mockSession)
  })

  it('returns 401 when not authenticated', async () => {
    mockGetSession.mockResolvedValue(null)
    const req = createMockRequest('POST', '/api/categories', {})
    const res = await POST(req)
    expect(res.status).toBe(401)
  })

  it('creates custom category successfully', async () => {
    const newCategory = {
      ...mockCategory,
      id: 'cat-custom-001',
      type: 'CUSTOM' as const,
      userId: mockSession.user.id,
      name: 'Hobi',
    }
    mockPrisma.category.create.mockResolvedValue(newCategory)

    const req = createMockRequest('POST', '/api/categories', {
      name: 'Hobi',
      icon: 'gamepad-2',
      color: '#8b5cf6',
      forType: 'EXPENSE',
    })
    const res = await POST(req)
    const data = await res.json()

    expect(res.status).toBe(201)
    expect(data.message).toBe('Kategori berhasil dibuat')
    expect(mockPrisma.category.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: mockSession.user.id,
          type: 'CUSTOM',
          name: 'Hobi',
        }),
      })
    )
  })

  it('returns 400 for invalid color format', async () => {
    const req = createMockRequest('POST', '/api/categories', {
      name: 'Hobi',
      icon: 'gamepad-2',
      color: 'not-a-hex-color',
      forType: 'EXPENSE',
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('returns 400 when name is empty', async () => {
    const req = createMockRequest('POST', '/api/categories', {
      name: '',
      icon: 'gamepad-2',
      color: '#8b5cf6',
      forType: 'EXPENSE',
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('returns 400 when forType is invalid', async () => {
    const req = createMockRequest('POST', '/api/categories', {
      name: 'Test',
      icon: 'star',
      color: '#8b5cf6',
      forType: 'INVALID',
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })
})
