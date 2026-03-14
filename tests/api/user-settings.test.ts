// tests/api/user-settings.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { PATCH } from '@/app/api/user/settings/route'
import { prisma } from '@/lib/prisma'
import {
  mockAuthenticatedSession,
  mockUnauthenticatedSession,
  buildRequest,
  MOCK_USER,
} from '../helpers'

describe('PATCH /api/user/settings', () => {
  const validBody = {
    name: 'Afif Updated',
    currency: 'IDR',
    timezone: 'Asia/Jakarta',
  }

  beforeEach(() => mockAuthenticatedSession())

  it('returns 401 when not authenticated', async () => {
    mockUnauthenticatedSession()
    const res = await PATCH(buildRequest('PATCH', {}))
    expect(res.status).toBe(401)
  })

  it('updates user settings successfully', async () => {
    vi.mocked(prisma.user.update).mockResolvedValue({
      id: MOCK_USER.id,
      name: 'Afif Updated',
      email: MOCK_USER.email,
      currency: 'IDR',
      timezone: 'Asia/Jakarta',
    } as never)

    const res = await PATCH(buildRequest('PATCH', validBody))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.message).toBe('Pengaturan disimpan')
  })

  it('updates only name (partial update)', async () => {
    vi.mocked(prisma.user.update).mockResolvedValue({
      ...MOCK_USER, name: 'New Name',
    } as never)
    const res = await PATCH(buildRequest('PATCH', { name: 'New Name' }))
    expect(res.status).toBe(200)
  })

  it('returns 400 — currency must be 3 chars', async () => {
    const res = await PATCH(buildRequest('PATCH', { ...validBody, currency: 'RUPIAH' }))
    expect(res.status).toBe(400)
  })

  it('uses correct userId from session', async () => {
    vi.mocked(prisma.user.update).mockResolvedValue({} as never)
    await PATCH(buildRequest('PATCH', { name: 'Test' }))
    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: MOCK_USER.id } })
    )
  })
})
