// tests/api/onboarding.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from '@/app/api/user/onboarding/route'
import { prisma } from '@/lib/prisma'
import {
  mockAuthenticatedSession,
  mockUnauthenticatedSession,
  buildRequest,
  MOCK_USER,
} from '../helpers'

describe('POST /api/user/onboarding', () => {
  const validBody = {
    currency: 'IDR',
    timezone: 'Asia/Jakarta',
    budgets: [
      { categoryId: 'system-makanan-&-minuman', amount: 1500000 },
      { categoryId: 'system-transportasi', amount: 500000 },
    ],
  }

  beforeEach(() => {
    mockAuthenticatedSession()
    vi.mocked(prisma.user.update).mockResolvedValue({} as never)
    vi.mocked(prisma.budget.upsert).mockResolvedValue({} as never)
  })

  it('returns 401 when unauthenticated', async () => {
    mockUnauthenticatedSession()
    const res = await POST(buildRequest('POST', validBody))
    expect(res.status).toBe(401)
  })

  it('completes onboarding and returns success', async () => {
    const res = await POST(buildRequest('POST', validBody))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data.done).toBe(true)
    expect(body.message).toBe('Onboarding selesai')
  })

  it('marks onboardingDone as true on user', async () => {
    await POST(buildRequest('POST', validBody))

    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: MOCK_USER.id },
        data: expect.objectContaining({ onboardingDone: true }),
      })
    )
  })

  it('saves currency preference', async () => {
    await POST(buildRequest('POST', { ...validBody, currency: 'USD' }))

    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ currency: 'USD' }),
      })
    )
  })

  it('saves timezone preference', async () => {
    await POST(buildRequest('POST', { ...validBody, timezone: 'Asia/Makassar' }))

    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ timezone: 'Asia/Makassar' }),
      })
    )
  })

  it('creates budgets for selected categories', async () => {
    await POST(buildRequest('POST', validBody))

    expect(prisma.budget.upsert).toHaveBeenCalledTimes(2)
  })

  it('works with empty budgets array (skip budget step)', async () => {
    const res = await POST(buildRequest('POST', { ...validBody, budgets: [] }))
    expect(res.status).toBe(200)
    expect(prisma.budget.upsert).not.toHaveBeenCalled()
  })

  it('returns 400 for invalid currency (not 3 chars)', async () => {
    const res = await POST(buildRequest('POST', { ...validBody, currency: 'INVALID' }))
    expect(res.status).toBe(400)
  })

  it('uses default values when fields omitted', async () => {
    const res = await POST(buildRequest('POST', {}))
    expect(res.status).toBe(200)

    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          currency: 'IDR',
          timezone: 'Asia/Jakarta',
        }),
      })
    )
  })
})
