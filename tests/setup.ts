// tests/setup.ts
import { vi, beforeEach, afterEach } from 'vitest'

vi.mock('next/server', async () => {
  const actual = await vi.importActual<typeof import('next/server')>('next/server')
  return {
    ...actual,
    NextResponse: {
      json: (data: unknown, init?: ResponseInit) => {
        const status = init?.status ?? 200
        return { status, ok: status >= 200 && status < 300, json: async () => data, _data: data }
      },
    },
  }
})

vi.mock('next-auth', () => ({ getServerSession: vi.fn() }))

vi.mock('@/lib/prisma', () => ({
  prisma: {
    transaction: {
      findMany: vi.fn(), findUnique: vi.fn(), create: vi.fn(),
      update: vi.fn(), delete: vi.fn(), count: vi.fn(), groupBy: vi.fn(),
    },
    budget: {
      findMany: vi.fn(), findUnique: vi.fn(), create: vi.fn(),
      update: vi.fn(), delete: vi.fn(), upsert: vi.fn(), count: vi.fn(),
    },
    category: {
      findMany: vi.fn(), findUnique: vi.fn(), create: vi.fn(),
      update: vi.fn(), delete: vi.fn(),
    },
    user: { findUnique: vi.fn(), update: vi.fn() },
    aiInsight: { findUnique: vi.fn(), upsert: vi.fn() },
  },
}))

vi.mock('@google/genai', () => ({
  GoogleGenAI: vi.fn().mockImplementation(() => ({
    models: {
      generateContent: vi.fn().mockResolvedValue({
        text: JSON.stringify([{ title: 'Test insight', description: 'Desc.', type: 'info' }]),
      }),
    },
  })),
}))

beforeEach(() => { vi.clearAllMocks() })
afterEach(() => { vi.restoreAllMocks() })

export const MOCK_SESSION = {
  user: { id: 'user-test-123', email: 'test@example.com', name: 'Test User' },
  expires: new Date(Date.now() + 86400000).toISOString(),
}

export const MOCK_CATEGORY = {
  id: 'cat-001', name: 'Makanan & Minuman', icon: 'utensils', color: '#f59e0b',
  type: 'SYSTEM' as const, forType: 'EXPENSE' as const, userId: null,
  createdAt: new Date(), updatedAt: new Date(),
}

export const MOCK_TRANSACTION = {
  id: 'tx-001', userId: 'user-test-123', categoryId: 'cat-001',
  amount: 50000, type: 'EXPENSE' as const, description: 'Makan siang',
  date: new Date('2026-03-10'), notes: null, isRecurring: false,
  recurringPeriod: null, recurringEndDate: null, parentId: null,
  createdAt: new Date(), updatedAt: new Date(), category: MOCK_CATEGORY,
}

export const MOCK_BUDGET = {
  id: 'budget-001', userId: 'user-test-123', categoryId: 'cat-001',
  amount: 1500000, period: 'MONTHLY' as const, alertThreshold: 80, isActive: true,
  createdAt: new Date(), updatedAt: new Date(), category: MOCK_CATEGORY,
}

export function buildRequest(
  url: string,
  options: { method?: string; body?: unknown; searchParams?: Record<string, string> } = {}
) {
  const fullUrl = new URL(url, 'http://localhost:3000')
  if (options.searchParams) {
    Object.entries(options.searchParams).forEach(([k, v]) => fullUrl.searchParams.set(k, v))
  }
  return {
    nextUrl: fullUrl, url: fullUrl.toString(), method: options.method ?? 'GET',
    json: async () => options.body ?? {},
    headers: new Headers({ 'content-type': 'application/json' }),
  } as unknown as import('next/server').NextRequest
}
