// tests/api/wallets.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET, POST } from '@/app/api/wallets/route'
import { PATCH, DELETE } from '@/app/api/wallets/[id]/route'
import { POST as transferPOST } from '@/app/api/wallets/transfer/route'
import { prisma } from '@/lib/prisma'
import {
  mockAuthenticatedSession,
  mockUnauthenticatedSession,
  buildRequest,
  MOCK_USER,
} from '../helpers'

const mockWallet = {
  id: 'wallet-001',
  userId: MOCK_USER.id,
  name: 'BCA Utama',
  type: 'BANK',
  balance: 5000000,
  color: '#0891b2',
  icon: 'wallet',
  accountNumber: '1234567890',
  isIncludedInNetWorth: true,
  createdAt: new Date(),
  updatedAt: new Date(),
}

describe('/api/wallets', () => {
  beforeEach(() => {
    mockAuthenticatedSession()
    vi.mocked(prisma.wallet.findMany).mockResolvedValue([mockWallet as never])
    vi.mocked(prisma.wallet.findFirst).mockResolvedValue(mockWallet as never)
    vi.mocked(prisma.wallet.create).mockResolvedValue(mockWallet as never)
    vi.mocked(prisma.wallet.update).mockResolvedValue(mockWallet as never)
    vi.mocked(prisma.wallet.delete).mockResolvedValue(mockWallet as never)
    vi.mocked(prisma.wallet.count).mockResolvedValue(2)
  })

  describe('GET /api/wallets', () => {
    it('returns 401 when unauthenticated', async () => {
      mockUnauthenticatedSession()
      const res = await GET()
      expect(res.status).toBe(401)
    })

    it('returns wallets and computed net worth', async () => {
      const res = await GET()
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.data.wallets).toHaveLength(1)
      expect(body.data.netWorth).toBe(5000000)
      expect(body.data.breakdownByType.BANK).toBe(5000000)
    })

    it('auto-creates default wallet if user has 0 wallets', async () => {
      vi.mocked(prisma.wallet.findMany).mockResolvedValueOnce([])
      const defaultWallet = { ...mockWallet, name: 'Dompet Tunai', type: 'CASH', balance: 0 }
      vi.mocked(prisma.wallet.create).mockResolvedValueOnce(defaultWallet as never)

      const res = await GET()
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.data.wallets[0]?.name).toBe('Dompet Tunai')
    })
  })

  describe('POST /api/wallets', () => {
    it('returns 401 when unauthenticated', async () => {
      mockUnauthenticatedSession()
      const req = buildRequest('POST', { name: 'GoPay', type: 'E_WALLET', balance: 200000 })
      const res = await POST(req)
      expect(res.status).toBe(401)
    })

    it('creates wallet successfully with valid data', async () => {
      const payload = {
        name: 'GoPay',
        type: 'E_WALLET',
        balance: 200000,
        color: '#10b981',
        icon: 'wallet',
        isIncludedInNetWorth: true,
      }
      const req = buildRequest('POST', payload)
      const res = await POST(req)
      expect(res.status).toBe(201)
    })

    it('rejects invalid color hex format', async () => {
      const req = buildRequest('POST', {
        name: 'GoPay',
        type: 'E_WALLET',
        balance: 100000,
        color: 'invalid-hex',
      })
      const res = await POST(req)
      expect(res.status).toBe(400)
    })
  })

  describe('PATCH /api/wallets/:id', () => {
    it('updates wallet successfully', async () => {
      const req = buildRequest('PATCH', { name: 'BCA Prioritas', balance: 7500000 })
      const res = await PATCH(req, { params: Promise.resolve({ id: 'wallet-001' }) })
      expect(res.status).toBe(200)
    })

    it('returns 404 when wallet does not exist', async () => {
      vi.mocked(prisma.wallet.findFirst).mockResolvedValueOnce(null)
      const req = buildRequest('PATCH', { name: 'Test' })
      const res = await PATCH(req, { params: Promise.resolve({ id: 'non-existent' }) })
      expect(res.status).toBe(404)
    })
  })

  describe('DELETE /api/wallets/:id', () => {
    it('prevents deleting last remaining wallet', async () => {
      vi.mocked(prisma.wallet.count).mockResolvedValueOnce(1)
      const req = buildRequest('DELETE')
      const res = await DELETE(req, { params: Promise.resolve({ id: 'wallet-001' }) })
      expect(res.status).toBe(400)
    })

    it('deletes wallet when user has multiple wallets', async () => {
      vi.mocked(prisma.wallet.count).mockResolvedValueOnce(3)
      const req = buildRequest('DELETE')
      const res = await DELETE(req, { params: Promise.resolve({ id: 'wallet-001' }) })
      expect(res.status).toBe(200)
    })
  })

  describe('POST /api/wallets/transfer', () => {
    it('rejects transfer when source and target are identical', async () => {
      const req = buildRequest('POST', {
        fromWalletId: 'wallet-001',
        toWalletId: 'wallet-001',
        amount: 50000,
      })
      const res = await transferPOST(req)
      expect(res.status).toBe(400)
    })

    it('rejects transfer when source balance is insufficient', async () => {
      vi.mocked(prisma.wallet.findFirst)
        .mockResolvedValueOnce({ ...mockWallet, balance: 10000 } as never) // fromWallet
        .mockResolvedValueOnce({ ...mockWallet, id: 'wallet-002', balance: 50000 } as never) // toWallet

      const req = buildRequest('POST', {
        fromWalletId: 'wallet-001',
        toWalletId: 'wallet-002',
        amount: 25000,
        fee: 2500,
      })
      const res = await transferPOST(req)
      expect(res.status).toBe(400)
    })

    it('executes transfer successfully when balance is sufficient', async () => {
      vi.mocked(prisma.wallet.findFirst)
        .mockResolvedValueOnce({ ...mockWallet, balance: 500000 } as never)
        .mockResolvedValueOnce({ ...mockWallet, id: 'wallet-002', balance: 100000 } as never)
      vi.mocked(prisma.walletTransfer.create).mockResolvedValueOnce({
        id: 'transfer-001',
        amount: 100000,
      } as never)

      const req = buildRequest('POST', {
        fromWalletId: 'wallet-001',
        toWalletId: 'wallet-002',
        amount: 100000,
        fee: 0,
      })
      const res = await transferPOST(req)
      expect(res.status).toBe(201)
    })
  })
})
