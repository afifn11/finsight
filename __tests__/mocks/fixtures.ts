// __tests__/mocks/fixtures.ts
// Reusable mock data for all tests

import type { TransactionWithCategory, BudgetWithCategory } from '@/types'

export const mockUser = {
  id: 'user-test-123',
  name: 'Test User',
  email: 'test@finsight.app',
  image: null,
}

export const mockSession = {
  user: mockUser,
  expires: '2099-01-01',
}

export const mockCategory = {
  id: 'cat-makanan',
  userId: null,
  name: 'Makanan & Minuman',
  icon: 'utensils',
  color: '#f59e0b',
  type: 'SYSTEM' as const,
  forType: 'EXPENSE' as const,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
}

export const mockIncomeCategory = {
  id: 'cat-gaji',
  userId: null,
  name: 'Gaji',
  icon: 'briefcase',
  color: '#10b981',
  type: 'SYSTEM' as const,
  forType: 'INCOME' as const,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
}

export const mockTransaction: TransactionWithCategory = {
  id: 'tx-001',
  userId: mockUser.id,
  categoryId: mockCategory.id,
  amount: 150000 as unknown as import('@prisma/client').Prisma.Decimal,
  type: 'EXPENSE',
  description: 'Makan siang',
  date: new Date('2026-03-10'),
  notes: null,
  isRecurring: false,
  recurringPeriod: null,
  recurringEndDate: null,
  parentId: null,
  createdAt: new Date('2026-03-10'),
  updatedAt: new Date('2026-03-10'),
  category: mockCategory,
}

export const mockIncomeTransaction: TransactionWithCategory = {
  id: 'tx-002',
  userId: mockUser.id,
  categoryId: mockIncomeCategory.id,
  amount: 5000000 as unknown as import('@prisma/client').Prisma.Decimal,
  type: 'INCOME',
  description: 'Gaji Maret',
  date: new Date('2026-03-01'),
  notes: null,
  isRecurring: false,
  recurringPeriod: null,
  recurringEndDate: null,
  parentId: null,
  createdAt: new Date('2026-03-01'),
  updatedAt: new Date('2026-03-01'),
  category: mockIncomeCategory,
}

export const mockBudget: BudgetWithCategory = {
  id: 'budget-001',
  userId: mockUser.id,
  categoryId: mockCategory.id,
  amount: 1500000 as unknown as import('@prisma/client').Prisma.Decimal,
  period: 'MONTHLY',
  alertThreshold: 80,
  isActive: true,
  createdAt: new Date('2026-03-01'),
  updatedAt: new Date('2026-03-01'),
  category: mockCategory,
  spent: 450000,
  percentage: 30,
}

// Helper: create a mock NextRequest
export function createMockRequest(
  method: string,
  url: string,
  body?: unknown,
  searchParams?: Record<string, string>
) {
  const fullUrl = new URL(url, 'http://localhost:3000')
  if (searchParams) {
    Object.entries(searchParams).forEach(([k, v]) => fullUrl.searchParams.set(k, v))
  }

  return {
    method,
    nextUrl: fullUrl,
    url: fullUrl.toString(),
    json: async () => body ?? {},
    headers: new Headers({ 'content-type': 'application/json' }),
  } as unknown as import('next/server').NextRequest
}
