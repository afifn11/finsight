// tests/api/ai-chat.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from '@/app/api/ai/chat/route'
import { prisma } from '@/lib/prisma'
import {
  mockAuthenticatedSession,
  mockUnauthenticatedSession,
  buildRequest,
  MOCK_USER,
} from '../helpers'

describe('POST /api/ai/chat', () => {
  beforeEach(() => {
    mockAuthenticatedSession()
    vi.mocked(prisma.wallet.findMany).mockResolvedValue([
      {
        id: 'w-1',
        userId: MOCK_USER.id,
        name: 'BCA',
        type: 'BANK',
        balance: 5000000,
        isIncludedInNetWorth: true,
      } as never,
    ])
    vi.mocked(prisma.transaction.groupBy).mockResolvedValue([
      { type: 'INCOME', _sum: { amount: 10000000 } } as never,
      { type: 'EXPENSE', _sum: { amount: 4000000 } } as never,
    ])
    vi.mocked(prisma.budget.findMany).mockResolvedValue([])
    vi.mocked(prisma.subscription.findMany).mockResolvedValue([])
  })

  it('returns 401 when unauthenticated', async () => {
    mockUnauthenticatedSession()
    const req = buildRequest('POST', { message: 'Halo' })
    const res = await POST(req)
    expect(res.status).toBe(401)
  })

  it('returns 400 when message is empty', async () => {
    const req = buildRequest('POST', { message: '' })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('returns copilot reply and suggestions when valid', async () => {
    const req = buildRequest('POST', { message: 'Apakah kondisi keuangan saya aman?' })
    const res = await POST(req)
    expect(res.status).toBe(200)
    const body = (await res.json()) as { reply: string; suggestions: string[] }
    expect(body.reply).toBeDefined()
    expect(body.suggestions).toBeInstanceOf(Array)
  })
})
