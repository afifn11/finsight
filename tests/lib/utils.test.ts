// tests/lib/utils.test.ts
import { describe, it, expect } from 'vitest'
import {
  formatCurrency, formatCurrencyShort, calculatePercentage,
  getBudgetStatus, getBudgetStatusColor, getInitials,
  getTransactionSign, truncate,
} from '@/lib/utils'

describe('formatCurrency', () => {
  it('formats IDR correctly', () => {
    expect(formatCurrency(50000)).toContain('50.000')
  })
  it('formats zero', () => {
    expect(formatCurrency(0)).toContain('0')
  })
  it('formats large amount', () => {
    expect(formatCurrency(1000000000)).toContain('1.000.000.000')
  })
})

describe('formatCurrencyShort', () => {
  it('formats millions as jt', () => {
    expect(formatCurrencyShort(1500000)).toContain('jt')
    expect(formatCurrencyShort(1500000)).toContain('1.5')
  })
  it('formats billions as M', () => {
    expect(formatCurrencyShort(2000000000)).toContain('M')
  })
  it('formats thousands as rb', () => {
    expect(formatCurrencyShort(500000)).toContain('rb')
  })
  it('formats small amounts as-is', () => {
    expect(formatCurrencyShort(500)).toBe('Rp 500')
  })
  it('formats negative millions with sign and abbreviation, not raw digits', () => {
    expect(formatCurrencyShort(-1500000)).toBe('-Rp 1.5 jt')
  })
  it('formats negative thousands with sign and abbreviation', () => {
    expect(formatCurrencyShort(-500000)).toBe('-Rp 500 rb')
  })
  it('formats small negative amounts with sign', () => {
    expect(formatCurrencyShort(-500)).toBe('-Rp 500')
  })
})

describe('calculatePercentage', () => {
  it('calculates percentage correctly', () => {
    expect(calculatePercentage(800, 1000)).toBe(80)
  })
  it('returns 0 when total is 0 (no division by zero)', () => {
    expect(calculatePercentage(100, 0)).toBe(0)
  })
  it('rounds to nearest integer', () => {
    expect(calculatePercentage(1, 3)).toBe(33)
  })
  it('returns 100 when value equals total', () => {
    expect(calculatePercentage(1000, 1000)).toBe(100)
  })
})

describe('getBudgetStatus', () => {
  it('returns safe for < 60%', () => {
    expect(getBudgetStatus(50)).toBe('safe')
    expect(getBudgetStatus(0)).toBe('safe')
  })
  it('returns warning for 60–79%', () => {
    expect(getBudgetStatus(60)).toBe('warning')
    expect(getBudgetStatus(79)).toBe('warning')
  })
  it('returns danger for 80–99%', () => {
    expect(getBudgetStatus(80)).toBe('danger')
    expect(getBudgetStatus(99)).toBe('danger')
  })
  it('returns exceeded for 100%+', () => {
    expect(getBudgetStatus(100)).toBe('exceeded')
    expect(getBudgetStatus(150)).toBe('exceeded')
  })
})

describe('getBudgetStatusColor', () => {
  it('returns green for safe', () => {
    expect(getBudgetStatusColor('safe')).toBe('#10b981')
  })
  it('returns amber for warning', () => {
    expect(getBudgetStatusColor('warning')).toBe('#f59e0b')
  })
  it('returns red for danger', () => {
    expect(getBudgetStatusColor('danger')).toBe('#ef4444')
  })
  it('returns dark red for exceeded', () => {
    expect(getBudgetStatusColor('exceeded')).toBe('#dc2626')
  })
})

describe('getInitials', () => {
  it('returns initials from full name', () => {
    expect(getInitials('Muhammad Afif')).toBe('MA')
  })
  it('returns single initial for one word name', () => {
    expect(getInitials('Afif')).toBe('A')
  })
  it('returns U for null', () => {
    expect(getInitials(null)).toBe('U')
  })
  it('returns U for undefined', () => {
    expect(getInitials(undefined)).toBe('U')
  })
  it('only takes first two words', () => {
    expect(getInitials('Muhammad Afif Naufal')).toBe('MA')
  })
})

describe('getTransactionSign', () => {
  it('returns + for INCOME', () => {
    expect(getTransactionSign('INCOME')).toBe('+')
  })
  it('returns - for EXPENSE', () => {
    expect(getTransactionSign('EXPENSE')).toBe('-')
  })
})

describe('truncate', () => {
  it('does not truncate short text', () => {
    expect(truncate('Hello', 10)).toBe('Hello')
  })
  it('truncates long text with ellipsis', () => {
    expect(truncate('Hello World', 5)).toBe('Hello...')
  })
  it('handles exact length', () => {
    expect(truncate('Hello', 5)).toBe('Hello')
  })
})
