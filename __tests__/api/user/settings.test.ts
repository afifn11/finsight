// __tests__/api/user/settings.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { PATCH } from '@/app/api/user/settings/route'
import { mockSession, mockUser, createMockRequest } from '../../mocks/fixtures'

const mockGetSession = vi.mocked(getServerSession)
const mockPrisma = vi.mocked(prisma)

describe('PATCH /api/user/settings', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetSession.mockResolvedValue(mockSession)
  })

  it('returns 401 when not authenticated', async () => {
    mockGetSession.mockResolvedValue(null)
    const req = createMockRequest('PATCH', '/api/user/settings', {})
    const res = await PATCH(req)
    expect(res.status).toBe(401)
  })

  it('updates user settings successfully', async () => {
    const updatedUser = {
      ...mockUser,
      currency: 'USD',
      timezone: 'Asia/Makassar',
    }
    mockPrisma.user.update.mockResolvedValue(updatedUser)

    const req = createMockRequest('PATCH', '/api/user/settings', {
      name: 'Updated Name',
      currency: 'USD',
      timezone: 'Asia/Makassar',
    })
    const res = await PATCH(req)
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.message).toBe('Pengaturan disimpan')
    expect(mockPrisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: mockSession.user.id },
        data: expect.objectContaining({ currency: 'USD' }),
      })
    )
  })

  it('returns 400 for invalid currency code (not 3 chars)', async () => {
    const req = createMockRequest('PATCH', '/api/user/settings', {
      currency: 'INVALID',
      timezone: 'Asia/Jakarta',
    })
    const res = await PATCH(req)
    expect(res.status).toBe(400)
  })

  it('accepts partial update (only name)', async () => {
    mockPrisma.user.update.mockResolvedValue({ ...mockUser, name: 'New Name' })

    const req = createMockRequest('PATCH', '/api/user/settings', {
      name: 'New Name',
    })
    const res = await PATCH(req)
    expect(res.status).toBe(200)
  })

  it('only updates the authenticated user', async () => {
    mockPrisma.user.update.mockResolvedValue(mockUser)

    const req = createMockRequest('PATCH', '/api/user/settings', {
      currency: 'IDR',
    })
    await PATCH(req)

    expect(mockPrisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: mockSession.user.id },
      })
    )
  })
})
