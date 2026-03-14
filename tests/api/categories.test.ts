// tests/api/categories.test.ts
import { describe, it, expect, vi } from 'vitest'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { MOCK_SESSION, MOCK_CATEGORY, buildRequest } from '../setup'
import { GET, POST } from '@/app/api/categories/route'

const mockSession = vi.mocked(getServerSession)
const mockPrisma = vi.mocked(prisma)

describe('GET /api/categories', () => {
  it('returns 401 when not authenticated', async () => {
    mockSession.mockResolvedValueOnce(null)
    expect((await GET(buildRequest('/api/categories'))).status).toBe(401)
  })

  it('returns categories for user', async () => {
    mockSession.mockResolvedValueOnce(MOCK_SESSION)
    vi.mocked(mockPrisma.category.findMany).mockResolvedValueOnce([MOCK_CATEGORY])
    const body = await (await GET(buildRequest('/api/categories'))).json()
    expect(body.data).toHaveLength(1)
  })

  it('filters by forType=EXPENSE', async () => {
    mockSession.mockResolvedValueOnce(MOCK_SESSION)
    vi.mocked(mockPrisma.category.findMany).mockResolvedValueOnce([MOCK_CATEGORY])
    await GET(buildRequest('/api/categories', { searchParams: { forType: 'EXPENSE' } }))
    expect(mockPrisma.category.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ forType: 'EXPENSE' }) })
    )
  })

  it('filters by forType=INCOME', async () => {
    mockSession.mockResolvedValueOnce(MOCK_SESSION)
    vi.mocked(mockPrisma.category.findMany).mockResolvedValueOnce([])
    await GET(buildRequest('/api/categories', { searchParams: { forType: 'INCOME' } }))
    expect(mockPrisma.category.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ forType: 'INCOME' }) })
    )
  })
})

describe('POST /api/categories', () => {
  const validBody = { name: 'Hobi', icon: 'music', color: '#8b5cf6', forType: 'EXPENSE' }

  it('returns 401 when not authenticated', async () => {
    mockSession.mockResolvedValueOnce(null)
    expect((await POST(buildRequest('/api/categories', { method: 'POST', body: {} }))).status).toBe(401)
  })

  it('creates custom category', async () => {
    mockSession.mockResolvedValueOnce(MOCK_SESSION)
    vi.mocked(mockPrisma.category.create).mockResolvedValueOnce({ ...MOCK_CATEGORY, name: 'Hobi', type: 'CUSTOM' })
    const res = await POST(buildRequest('/api/categories', { method: 'POST', body: validBody }))
    const body = await res.json()
    expect(res.status).toBe(201)
    expect(mockPrisma.category.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ userId: 'user-test-123', type: 'CUSTOM' }) })
    )
  })

  it('returns 400 — missing name', async () => {
    mockSession.mockResolvedValueOnce(MOCK_SESSION)
    const { name: _, ...b } = validBody
    expect((await POST(buildRequest('/api/categories', { method: 'POST', body: b }))).status).toBe(400)
  })

  it('returns 400 — invalid hex color', async () => {
    mockSession.mockResolvedValueOnce(MOCK_SESSION)
    expect((await POST(buildRequest('/api/categories', { method: 'POST', body: { ...validBody, color: 'purple' } }))).status).toBe(400)
  })

  it('returns 400 — invalid forType', async () => {
    mockSession.mockResolvedValueOnce(MOCK_SESSION)
    expect((await POST(buildRequest('/api/categories', { method: 'POST', body: { ...validBody, forType: 'TRANSFER' } }))).status).toBe(400)
  })
})
