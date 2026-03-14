// tests/helpers.ts
import { vi } from 'vitest'
import { getServerSession } from 'next-auth'
import type { Category } from '@/types'

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

// ── Request builder — pakai NextRequest agar nextUrl tersedia ──
export function buildRequest(
  method: string,
  body?: unknown,
  searchParams?: Record<string, string>
): import('next/server').NextRequest {
  const url = new URL('http://localhost:3000/api/test')
  if (searchParams) {
    Object.entries(searchParams).forEach(([k, v]) => url.searchParams.set(k, v))
  }

  // Gunakan NextRequest agar .nextUrl tersedia
  const { NextRequest } = require('next/server') as typeof import('next/server')
  return new NextRequest(url.toString(), {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body && method !== 'GET' ? JSON.stringify(body) : undefined,
  })
}

// ── Response parser ────────────────────────────────────────────
export async function parseResponse<T>(res: Response): Promise<T> {
  return res.json() as Promise<T>
}

// ── Data factories ─────────────────────────────────────────────
export const factory = {
  transaction: (overrides: Record<string, unknown> = {}) => ({
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

  budget: (overrides: Record<string, unknown> = {}) => ({
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

  category: (overrides: Record<string, unknown> = {}): Category => ({
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
  } as Category),
}
