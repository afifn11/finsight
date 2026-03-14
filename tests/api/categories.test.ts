// tests/api/categories.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET, POST } from '@/app/api/categories/route'
import { prisma } from '@/lib/prisma'
import {
  mockAuthenticatedSession,
  mockUnauthenticatedSession,
  buildRequest,
  factory,
  MOCK_USER,
} from '../helpers'

describe('GET /api/categories', () => {
  beforeEach(() => mockAuthenticatedSession())

  it('returns 401 when not authenticated', async () => {
    mockUnauthenticatedSession()
    const res = await GET(buildRequest('GET'))
    expect(res.status).toBe(401)
  })

  it('returns categories for user', async () => {
    const cats = [
      factory.category({ userId: null, type: 'SYSTEM' }),
      factory.category({ id: 'cat-002', userId: MOCK_USER.id, type: 'CUSTOM' }),
    ]
    vi.mocked(prisma.category.findMany).mockResolvedValue(cats as never)
    const res = await GET(buildRequest('GET'))
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.data).toHaveLength(2)
  })

  it('filters by forType=EXPENSE', async () => {
    vi.mocked(prisma.category.findMany).mockResolvedValue([])
    await GET(buildRequest('GET', undefined, { forType: 'EXPENSE' }))
    expect(prisma.category.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ forType: 'EXPENSE' }),
      })
    )
  })

  it('filters by forType=INCOME', async () => {
    vi.mocked(prisma.category.findMany).mockResolvedValue([])
    await GET(buildRequest('GET', undefined, { forType: 'INCOME' }))
    expect(prisma.category.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ forType: 'INCOME' }),
      })
    )
  })

  it('queries both system and user categories', async () => {
    vi.mocked(prisma.category.findMany).mockResolvedValue([])
    await GET(buildRequest('GET'))
    expect(prisma.category.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: [{ userId: null }, { userId: MOCK_USER.id }],
        }),
      })
    )
  })
})

describe('POST /api/categories', () => {
  const validBody = {
    name: 'Liburan',
    icon: 'plane',
    color: '#3b82f6',
    forType: 'EXPENSE',
  }

  beforeEach(() => mockAuthenticatedSession())

  it('returns 401 when not authenticated', async () => {
    mockUnauthenticatedSession()
    const res = await POST(buildRequest('POST', {}))
    expect(res.status).toBe(401)
  })

  it('creates custom category', async () => {
    vi.mocked(prisma.category.create).mockResolvedValue(
      factory.category({ name: 'Liburan', type: 'CUSTOM' }) as never
    )
    const res = await POST(buildRequest('POST', validBody))
    const body = await res.json()
    expect(res.status).toBe(201)
    expect(body.message).toBe('Kategori berhasil dibuat')
  })

  it('always sets type to CUSTOM', async () => {
    vi.mocked(prisma.category.create).mockResolvedValue(factory.category() as never)
    await POST(buildRequest('POST', validBody))
    expect(prisma.category.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ type: 'CUSTOM', userId: MOCK_USER.id }),
      })
    )
  })

  it('returns 400 — missing name', async () => {
    const { name: _, ...noName } = validBody
    const res = await POST(buildRequest('POST', noName))
    expect(res.status).toBe(400)
  })

  it('returns 400 — invalid hex color', async () => {
    const res = await POST(buildRequest('POST', { ...validBody, color: 'blue' }))
    expect(res.status).toBe(400)
  })

  it('returns 400 — invalid forType', async () => {
    const res = await POST(buildRequest('POST', { ...validBody, forType: 'INVALID' }))
    expect(res.status).toBe(400)
  })
})
