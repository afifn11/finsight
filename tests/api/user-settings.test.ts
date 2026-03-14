// tests/api/user-settings.test.ts
import { describe, it, expect, vi } from 'vitest'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { MOCK_SESSION, buildRequest } from '../setup'
import { PATCH } from '@/app/api/user/settings/route'

const mockSession = vi.mocked(getServerSession)
const mockPrisma = vi.mocked(prisma)

const MOCK_USER = {
  id: 'user-test-123', name: 'Test User', email: 'test@example.com',
  currency: 'IDR', timezone: 'Asia/Jakarta',
}

describe('PATCH /api/user/settings', () => {
  it('returns 401 when not authenticated', async () => {
    mockSession.mockResolvedValueOnce(null)
    expect((await PATCH(buildRequest('/api/user/settings', { method: 'PATCH', body: {} }))).status).toBe(401)
  })

  it('updates user settings successfully', async () => {
    mockSession.mockResolvedValueOnce(MOCK_SESSION)
    vi.mocked(mockPrisma.user.update).mockResolvedValueOnce(MOCK_USER as never)
    const res = await PATCH(buildRequest('/api/user/settings', {
      method: 'PATCH',
      body: { name: 'Updated Name', currency: 'USD', timezone: 'Asia/Makassar' },
    }))
    expect(res.status).toBe(200)
    expect(mockPrisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'user-test-123' } })
    )
  })

  it('updates only name (partial update)', async () => {
    mockSession.mockResolvedValueOnce(MOCK_SESSION)
    vi.mocked(mockPrisma.user.update).mockResolvedValueOnce({ ...MOCK_USER, name: 'New Name' } as never)
    const res = await PATCH(buildRequest('/api/user/settings', {
      method: 'PATCH', body: { name: 'New Name' },
    }))
    expect(res.status).toBe(200)
  })

  it('returns 400 — currency must be 3 chars', async () => {
    mockSession.mockResolvedValueOnce(MOCK_SESSION)
    expect((await PATCH(buildRequest('/api/user/settings', {
      method: 'PATCH', body: { currency: 'RUPIAH' },
    }))).status).toBe(400)
  })

  it('uses correct userId from session', async () => {
    mockSession.mockResolvedValueOnce(MOCK_SESSION)
    vi.mocked(mockPrisma.user.update).mockResolvedValueOnce(MOCK_USER as never)
    await PATCH(buildRequest('/api/user/settings', {
      method: 'PATCH', body: { name: 'Test' },
    }))
    expect(mockPrisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'user-test-123' } })
    )
  })
})
