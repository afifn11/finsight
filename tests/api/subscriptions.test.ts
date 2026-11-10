// tests/api/subscriptions.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET, POST } from '@/app/api/subscriptions/route'
import { GET as getById, PATCH, DELETE } from '@/app/api/subscriptions/[id]/route'
import { prisma } from '@/lib/prisma'
import {
  mockAuthenticatedSession,
  mockUnauthenticatedSession,
  buildRequest,
  MOCK_USER,
} from '../helpers'

const mockSub = {
  id: 'sub-001',
  userId: MOCK_USER.id,
  name: 'Netflix Premium',
  amount: 186000,
  billingCycle: 'MONTHLY',
  nextBillingDate: new Date('2026-11-20'),
  category: 'Langganan',
  color: '#8b5cf6',
  icon: 'credit-card',
  status: 'ACTIVE',
  notes: 'Bayar pakai GoPay',
  createdAt: new Date(),
  updatedAt: new Date(),
}

describe('/api/subscriptions', () => {
  beforeEach(() => {
    mockAuthenticatedSession()
    vi.mocked(prisma.subscription.findMany).mockResolvedValue([mockSub as never])
    vi.mocked(prisma.subscription.findUnique).mockResolvedValue(mockSub as never)
    vi.mocked(prisma.subscription.create).mockResolvedValue(mockSub as never)
    vi.mocked(prisma.subscription.update).mockResolvedValue(mockSub as never)
    vi.mocked(prisma.subscription.delete).mockResolvedValue(mockSub as never)
  })

  describe('GET /api/subscriptions', () => {
    it('returns 401 when unauthenticated', async () => {
      mockUnauthenticatedSession()
      const res = await GET()
      expect(res.status).toBe(401)
    })

    it('returns subscriptions and computes monthly commitment', async () => {
      const res = await GET()
      expect(res.status).toBe(200)
      const body = (await res.json()) as {
        data: {
          subscriptions: typeof mockSub[]
          monthlyCommitment: number
          activeCount: number
        }
      }
      expect(body.data.subscriptions).toHaveLength(1)
      expect(body.data.monthlyCommitment).toBe(186000)
      expect(body.data.activeCount).toBe(1)
    })
  })

  describe('POST /api/subscriptions', () => {
    it('returns 401 when unauthenticated', async () => {
      mockUnauthenticatedSession()
      const req = buildRequest('POST', {
        name: 'Spotify',
        amount: 54990,
        nextBillingDate: '2026-12-01',
      })
      const res = await POST(req)
      expect(res.status).toBe(401)
    })

    it('returns 400 when body is invalid', async () => {
      const req = buildRequest('POST', { name: '' })
      const res = await POST(req)
      expect(res.status).toBe(400)
    })

    it('creates a new subscription', async () => {
      const req = buildRequest('POST', {
        name: 'Indihome 50Mbps',
        amount: 350000,
        billingCycle: 'MONTHLY',
        nextBillingDate: '2026-12-05',
        category: 'Internet',
      })
      const res = await POST(req)
      expect(res.status).toBe(201)
      expect(prisma.subscription.create).toHaveBeenCalled()
    })
  })

  describe('GET /api/subscriptions/:id', () => {
    it('returns 404 when not found or different user', async () => {
      vi.mocked(prisma.subscription.findUnique).mockResolvedValueOnce(null)
      const res = await getById(buildRequest('GET'), {
        params: Promise.resolve({ id: 'sub-001' }),
      })
      expect(res.status).toBe(404)
    })

    it('returns subscription data', async () => {
      const res = await getById(buildRequest('GET'), {
        params: Promise.resolve({ id: 'sub-001' }),
      })
      expect(res.status).toBe(200)
    })
  })

  describe('PATCH /api/subscriptions/:id', () => {
    it('returns 404 when subscription not owned by user', async () => {
      vi.mocked(prisma.subscription.findUnique).mockResolvedValueOnce({
        ...mockSub,
        userId: 'other-user',
      } as never)

      const req = buildRequest('PATCH', { name: 'Updated' })
      const res = await PATCH(req, { params: Promise.resolve({ id: 'sub-001' }) })
      expect(res.status).toBe(404)
    })

    it('advances cycle when advanceCycle: true', async () => {
      const req = buildRequest('PATCH', { advanceCycle: true })
      const res = await PATCH(req, { params: Promise.resolve({ id: 'sub-001' }) })
      expect(res.status).toBe(200)
      expect(prisma.subscription.update).toHaveBeenCalled()
    })
  })

  describe('DELETE /api/subscriptions/:id', () => {
    it('deletes subscription with ownership check', async () => {
      const req = buildRequest('DELETE')
      const res = await DELETE(req, { params: Promise.resolve({ id: 'sub-001' }) })
      expect(res.status).toBe(200)
      expect(prisma.subscription.delete).toHaveBeenCalledWith({
        where: { id: 'sub-001' },
      })
    })
  })
})
