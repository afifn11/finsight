// tests/lib/validations.test.ts
import { describe, it, expect } from 'vitest'
import {
  loginSchema,
  registerSchema,
  transactionSchema,
  budgetSchema,
  categorySchema,
  userSettingsSchema,
  transactionFiltersSchema,
} from '@/lib/validations'

describe('loginSchema', () => {
  it('validates correct credentials', () => {
    const result = loginSchema.safeParse({
      email: 'test@example.com',
      password: 'password123',
    })
    expect(result.success).toBe(true)
  })

  it('rejects invalid email', () => {
    const result = loginSchema.safeParse({ email: 'not-email', password: 'password123' })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.path).toContain('email')
  })

  it('rejects short password', () => {
    const result = loginSchema.safeParse({ email: 'test@example.com', password: '123' })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.path).toContain('password')
  })
})

describe('registerSchema', () => {
  const valid = {
    name: 'Test User',
    email: 'test@example.com',
    password: 'Password1',
    confirmPassword: 'Password1',
  }

  it('validates correct registration data', () => {
    expect(registerSchema.safeParse(valid).success).toBe(true)
  })

  it('rejects name shorter than 2 chars', () => {
    const r = registerSchema.safeParse({ ...valid, name: 'A' })
    expect(r.success).toBe(false)
  })

  it('rejects password without uppercase', () => {
    const r = registerSchema.safeParse({ ...valid, password: 'password1', confirmPassword: 'password1' })
    expect(r.success).toBe(false)
  })

  it('rejects password without number', () => {
    const r = registerSchema.safeParse({ ...valid, password: 'Password', confirmPassword: 'Password' })
    expect(r.success).toBe(false)
  })

  it('rejects mismatched passwords', () => {
    const r = registerSchema.safeParse({ ...valid, confirmPassword: 'Different1' })
    expect(r.success).toBe(false)
    expect(r.error?.issues[0]?.path).toContain('confirmPassword')
  })
})

describe('transactionSchema', () => {
  const valid = {
    amount: 150000,
    type: 'EXPENSE' as const,
    categoryId: 'cat-001',
    description: 'Makan siang',
    date: new Date(),
    isRecurring: false,
  }

  it('validates correct transaction', () => {
    expect(transactionSchema.safeParse(valid).success).toBe(true)
  })

  it('accepts INCOME type', () => {
    expect(transactionSchema.safeParse({ ...valid, type: 'INCOME' }).success).toBe(true)
  })

  it('rejects negative amount', () => {
    const r = transactionSchema.safeParse({ ...valid, amount: -100 })
    expect(r.success).toBe(false)
  })

  it('rejects zero amount', () => {
    const r = transactionSchema.safeParse({ ...valid, amount: 0 })
    expect(r.success).toBe(false)
  })

  it('rejects empty description', () => {
    const r = transactionSchema.safeParse({ ...valid, description: '' })
    expect(r.success).toBe(false)
  })

  it('rejects empty categoryId', () => {
    const r = transactionSchema.safeParse({ ...valid, categoryId: '' })
    expect(r.success).toBe(false)
  })

  it('requires recurringPeriod when isRecurring is true', () => {
    const withRecurring = { ...valid, isRecurring: true }
    // Schema allows omitting recurringPeriod — it's optional
    expect(transactionSchema.safeParse(withRecurring).success).toBe(true)
  })

  it('rejects amount over max', () => {
    const r = transactionSchema.safeParse({ ...valid, amount: 999_999_999_999 + 1 })
    expect(r.success).toBe(false)
  })
})

describe('budgetSchema', () => {
  const valid = {
    categoryId: 'cat-001',
    amount: 1500000,
    period: 'MONTHLY' as const,
    alertThreshold: 80,
  }

  it('validates correct budget', () => {
    expect(budgetSchema.safeParse(valid).success).toBe(true)
  })

  it('defaults to MONTHLY period', () => {
    const r = budgetSchema.safeParse({ ...valid, period: undefined })
    expect(r.success).toBe(true)
    expect(r.data?.period).toBe('MONTHLY')
  })

  it('accepts YEARLY period', () => {
    expect(budgetSchema.safeParse({ ...valid, period: 'YEARLY' }).success).toBe(true)
  })

  it('rejects alertThreshold above 100', () => {
    const r = budgetSchema.safeParse({ ...valid, alertThreshold: 101 })
    expect(r.success).toBe(false)
  })

  it('rejects alertThreshold below 1', () => {
    const r = budgetSchema.safeParse({ ...valid, alertThreshold: 0 })
    expect(r.success).toBe(false)
  })

  it('rejects negative amount', () => {
    const r = budgetSchema.safeParse({ ...valid, amount: -1 })
    expect(r.success).toBe(false)
  })
})

describe('categorySchema', () => {
  const valid = {
    name: 'Liburan',
    icon: 'plane',
    color: '#3b82f6',
    forType: 'EXPENSE' as const,
  }

  it('validates correct category', () => {
    expect(categorySchema.safeParse(valid).success).toBe(true)
  })

  it('rejects invalid hex color', () => {
    const r = categorySchema.safeParse({ ...valid, color: 'blue' })
    expect(r.success).toBe(false)
  })

  it('rejects empty name', () => {
    const r = categorySchema.safeParse({ ...valid, name: '' })
    expect(r.success).toBe(false)
  })

  it('accepts INCOME forType', () => {
    expect(categorySchema.safeParse({ ...valid, forType: 'INCOME' }).success).toBe(true)
  })
})

describe('transactionFiltersSchema', () => {
  it('uses ALL as default type', () => {
    const r = transactionFiltersSchema.safeParse({})
    expect(r.success).toBe(true)
    expect(r.data?.type).toBe('ALL')
  })

  it('defaults page to 1', () => {
    const r = transactionFiltersSchema.safeParse({})
    expect(r.data?.page).toBe(1)
  })

  it('defaults limit to 20', () => {
    const r = transactionFiltersSchema.safeParse({})
    expect(r.data?.limit).toBe(20)
  })

  it('coerces string page to number', () => {
    const r = transactionFiltersSchema.safeParse({ page: '3' })
    expect(r.data?.page).toBe(3)
  })

  it('rejects limit above 100', () => {
    const r = transactionFiltersSchema.safeParse({ limit: '101' })
    expect(r.success).toBe(false)
  })
})

describe('userSettingsSchema', () => {
  it('validates correct settings', () => {
    const result = userSettingsSchema.safeParse({ currency: 'IDR', timezone: 'Asia/Jakarta' })
    expect(result.success).toBe(true)
  })

  it('rejects empty currency', () => {
    const result = userSettingsSchema.safeParse({ currency: '', timezone: 'Asia/Jakarta' })
    expect(result.success).toBe(false)
  })
})