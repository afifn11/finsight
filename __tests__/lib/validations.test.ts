// __tests__/lib/validations.test.ts
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
  it('accepts valid credentials', () => {
    const result = loginSchema.safeParse({
      email: 'user@example.com',
      password: 'password123',
    })
    expect(result.success).toBe(true)
  })

  it('rejects invalid email', () => {
    const result = loginSchema.safeParse({
      email: 'not-an-email',
      password: 'password123',
    })
    expect(result.success).toBe(false)
  })

  it('rejects password shorter than 8 chars', () => {
    const result = loginSchema.safeParse({
      email: 'user@example.com',
      password: 'short',
    })
    expect(result.success).toBe(false)
  })
})

describe('registerSchema', () => {
  const validData = {
    name: 'Test User',
    email: 'test@example.com',
    password: 'Password1',
    confirmPassword: 'Password1',
  }

  it('accepts valid registration data', () => {
    expect(registerSchema.safeParse(validData).success).toBe(true)
  })

  it('rejects when passwords do not match', () => {
    const result = registerSchema.safeParse({
      ...validData,
      confirmPassword: 'DifferentPass1',
    })
    expect(result.success).toBe(false)
  })

  it('rejects password without uppercase', () => {
    const result = registerSchema.safeParse({
      ...validData,
      password: 'password1',
      confirmPassword: 'password1',
    })
    expect(result.success).toBe(false)
  })

  it('rejects password without number', () => {
    const result = registerSchema.safeParse({
      ...validData,
      password: 'PasswordOnly',
      confirmPassword: 'PasswordOnly',
    })
    expect(result.success).toBe(false)
  })

  it('rejects name shorter than 2 chars', () => {
    const result = registerSchema.safeParse({ ...validData, name: 'A' })
    expect(result.success).toBe(false)
  })
})

describe('transactionSchema', () => {
  const validTx = {
    amount: 150000,
    type: 'EXPENSE' as const,
    categoryId: 'cat-001',
    description: 'Test transaction',
    date: new Date(),
    isRecurring: false,
  }

  it('accepts valid transaction', () => {
    expect(transactionSchema.safeParse(validTx).success).toBe(true)
  })

  it('rejects negative amount', () => {
    expect(transactionSchema.safeParse({ ...validTx, amount: -100 }).success).toBe(false)
  })

  it('rejects zero amount', () => {
    expect(transactionSchema.safeParse({ ...validTx, amount: 0 }).success).toBe(false)
  })

  it('rejects empty description', () => {
    expect(transactionSchema.safeParse({ ...validTx, description: '' }).success).toBe(false)
  })

  it('rejects invalid type', () => {
    expect(transactionSchema.safeParse({ ...validTx, type: 'INVALID' }).success).toBe(false)
  })

  it('accepts INCOME type', () => {
    expect(transactionSchema.safeParse({ ...validTx, type: 'INCOME' }).success).toBe(true)
  })

  it('requires recurringPeriod to be valid enum when isRecurring is true', () => {
    const recurringTx = {
      ...validTx,
      isRecurring: true,
      recurringPeriod: 'INVALID',
    }
    expect(transactionSchema.safeParse(recurringTx).success).toBe(false)
  })

  it('accepts valid recurringPeriod values', () => {
    for (const period of ['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'] as const) {
      const result = transactionSchema.safeParse({
        ...validTx,
        isRecurring: true,
        recurringPeriod: period,
      })
      expect(result.success).toBe(true)
    }
  })
})

describe('budgetSchema', () => {
  const validBudget = {
    categoryId: 'cat-001',
    amount: 1000000,
    period: 'MONTHLY' as const,
    alertThreshold: 80,
  }

  it('accepts valid budget', () => {
    expect(budgetSchema.safeParse(validBudget).success).toBe(true)
  })

  it('rejects negative amount', () => {
    expect(budgetSchema.safeParse({ ...validBudget, amount: -100 }).success).toBe(false)
  })

  it('rejects alertThreshold > 100', () => {
    expect(budgetSchema.safeParse({ ...validBudget, alertThreshold: 101 }).success).toBe(false)
  })

  it('rejects alertThreshold < 1', () => {
    expect(budgetSchema.safeParse({ ...validBudget, alertThreshold: 0 }).success).toBe(false)
  })

  it('accepts YEARLY period', () => {
    expect(budgetSchema.safeParse({ ...validBudget, period: 'YEARLY' }).success).toBe(true)
  })

  it('defaults to MONTHLY period', () => {
    const result = budgetSchema.safeParse({
      categoryId: 'cat-001',
      amount: 500000,
      alertThreshold: 80,
    })
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.period).toBe('MONTHLY')
  })
})

describe('categorySchema', () => {
  const validCat = {
    name: 'Hobi',
    icon: 'gamepad-2',
    color: '#8b5cf6',
    forType: 'EXPENSE' as const,
  }

  it('accepts valid category', () => {
    expect(categorySchema.safeParse(validCat).success).toBe(true)
  })

  it('rejects invalid hex color', () => {
    expect(categorySchema.safeParse({ ...validCat, color: 'not-hex' }).success).toBe(false)
    expect(categorySchema.safeParse({ ...validCat, color: '#gg1234' }).success).toBe(false)
    expect(categorySchema.safeParse({ ...validCat, color: '#12345' }).success).toBe(false)
  })

  it('accepts valid 6-char hex colors', () => {
    expect(categorySchema.safeParse({ ...validCat, color: '#000000' }).success).toBe(true)
    expect(categorySchema.safeParse({ ...validCat, color: '#FFFFFF' }).success).toBe(true)
    expect(categorySchema.safeParse({ ...validCat, color: '#10b981' }).success).toBe(true)
  })

  it('rejects empty name', () => {
    expect(categorySchema.safeParse({ ...validCat, name: '' }).success).toBe(false)
  })

  it('accepts INCOME forType', () => {
    expect(categorySchema.safeParse({ ...validCat, forType: 'INCOME' }).success).toBe(true)
  })
})

describe('transactionFiltersSchema', () => {
  it('defaults to ALL type and page 1', () => {
    const result = transactionFiltersSchema.safeParse({})
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.type).toBe('ALL')
      expect(result.data.page).toBe(1)
      expect(result.data.limit).toBe(20)
    }
  })

  it('coerces page string to number', () => {
    const result = transactionFiltersSchema.safeParse({ page: '3' })
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.page).toBe(3)
  })

  it('rejects limit > 100', () => {
    const result = transactionFiltersSchema.safeParse({ limit: '200' })
    expect(result.success).toBe(false)
  })

  it('rejects page < 1', () => {
    const result = transactionFiltersSchema.safeParse({ page: '0' })
    expect(result.success).toBe(false)
  })
})
