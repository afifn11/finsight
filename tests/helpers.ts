// tests/helpers.ts
// Shared test utilities, factories, and request builders

import { vi } from 'vitest'
import { getServerSession } from 'next-auth'

// ── Mock session ───────────────────────────────────────────────
export const MOCK_USER = {
  id: 'user-test-123',
  email: 'test@finsight.app',
  name: 'Test User',
  image: null,
}

export const MOCK_SESSION = {
  user: MOCK_USER,
  expires: new Date(Date.now() + 86400000).toISOString(),
}

export function mockAuthenticatedSession() {
  vi.mocked(getServerSession).mockResolvedValue(MOCK_SESSION)
}

export function mockUnauthenticatedSession() {
  vi.mocked(getServerSession).mockResolvedValue(null)
}

// ── Request builder ────────────────────────────────────────────
export function buildRequest(
  method: string,
  body?: unknown,
  searchParams?: Record<string, string>
): Request {
  const url = new URL('http://localhost:3000/api/test')
  if (searchParams) {
    Object.entries(searchParams).forEach(([k, v]) => url.searchParams.set(k, v))
  }

  return new Request(url.toString(), {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  })
}

// ── Response parser ────────────────────────────────────────────
export async function parseResponse<T>(res: Response): Promise<T> {
  return res.json() as Promise<T>
}

// ── Data factories ─────────────────────────────────────────────
export const factory = {
  transaction: (overrides = {}) => ({
    id: 'tx-001',
    userId: MOCK_USER.id,
    categoryId: 'cat-001',
    amount: '150000',
    type: 'EXPENSE' as const,
    description: 'Makan siang',
    date: new Date('2026-03-10'),
    notes: null,
    isRecurring: false,
    recurringPeriod: null,
    recurringEndDate: null,
    parentId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    category: {
      id: 'cat-001',
      name: 'Makanan & Minuman',
      icon: 'utensils',
      color: '#f59e0b',
      type: 'SYSTEM',
      forType: 'EXPENSE',
      userId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    ...overrides,
  }),

  budget: (overrides = {}) => ({
    id: 'budget-001',
    userId: MOCK_USER.id,
    categoryId: 'cat-001',
    amount: '1500000',
    period: 'MONTHLY' as const,
    alertThreshold: 80,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    category: {
      id: 'cat-001',
      name: 'Makanan & Minuman',
      icon: 'utensils',
      color: '#f59e0b',
      type: 'SYSTEM',
      forType: 'EXPENSE',
      userId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    ...overrides,
  }),

  category: (overrides = {}) => ({
    id: 'cat-001',
    name: 'Makanan & Minuman',
    icon: 'utensils',
    color: '#f59e0b',
    type: 'SYSTEM' as const,
    forType: 'EXPENSE' as const,
    userId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }),

  paginatedResult: <T>(data: T[], total = 1) => ({
    data,
    total,
    page: 1,
    limit: 20,
    totalPages: Math.ceil(total / 20),
  }),
}
