// __tests__/lib/utils.test.ts
import { describe, it, expect } from 'vitest'
import {
  cn,
  formatCurrency,
  formatCurrencyShort,
  formatDate,
  calculatePercentage,
  getBudgetStatus,
  getBudgetStatusColor,
  getTransactionSign,
  getTransactionColor,
  getInitials,
  truncate,
} from '@/lib/utils'

describe('cn (class merger)', () => {
  it('merges class strings', () => {
    expect(cn('foo', 'bar')).toBe('foo bar')
  })

  it('handles conditional classes', () => {
    expect(cn('foo', false && 'bar', 'baz')).toBe('foo baz')
  })

  it('deduplicates tailwind classes', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4')
  })

  it('handles undefined and null', () => {
    expect(cn('foo', undefined, null, 'bar')).toBe('foo bar')
  })
})

describe('formatCurrency', () => {
  it('formats IDR correctly', () => {
    const result = formatCurrency(150000)
    expect(result).toContain('150.000')
    expect(result).toContain('Rp')
  })

  it('formats zero correctly', () => {
    const result = formatCurrency(0)
    expect(result).toContain('0')
  })

  it('formats large numbers correctly', () => {
    const result = formatCurrency(1000000)
    expect(result).toContain('1.000.000')
  })
})

describe('formatCurrencyShort', () => {
  it('formats millions with jt suffix', () => {
    expect(formatCurrencyShort(1500000)).toBe('Rp 1.5 jt')
  })

  it('formats billions with M suffix', () => {
    expect(formatCurrencyShort(2000000000)).toBe('Rp 2.0 M')
  })

  it('formats thousands with rb suffix', () => {
    expect(formatCurrencyShort(500000)).toBe('Rp 500 rb')
  })

  it('formats small amounts without suffix', () => {
    expect(formatCurrencyShort(500)).toBe('Rp 500')
  })

  it('handles exactly 1 million', () => {
    expect(formatCurrencyShort(1000000)).toBe('Rp 1.0 jt')
  })
})

describe('calculatePercentage', () => {
  it('calculates percentage correctly', () => {
    expect(calculatePercentage(750, 1000)).toBe(75)
  })

  it('returns 0 when total is 0', () => {
    expect(calculatePercentage(100, 0)).toBe(0)
  })

  it('returns 100 when value equals total', () => {
    expect(calculatePercentage(500, 500)).toBe(100)
  })

  it('rounds to nearest integer', () => {
    expect(calculatePercentage(1, 3)).toBe(33)
  })

  it('returns 0 for 0 value', () => {
    expect(calculatePercentage(0, 1000)).toBe(0)
  })
})

describe('getBudgetStatus', () => {
  it('returns safe for < 60%', () => {
    expect(getBudgetStatus(50)).toBe('safe')
    expect(getBudgetStatus(0)).toBe('safe')
  })

  it('returns warning for 60-79%', () => {
    expect(getBudgetStatus(60)).toBe('warning')
    expect(getBudgetStatus(79)).toBe('warning')
  })

  it('returns danger for 80-99%', () => {
    expect(getBudgetStatus(80)).toBe('danger')
    expect(getBudgetStatus(99)).toBe('danger')
  })

  it('returns exceeded for >= 100%', () => {
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

describe('getTransactionSign', () => {
  it('returns + for INCOME', () => {
    expect(getTransactionSign('INCOME')).toBe('+')
  })

  it('returns - for EXPENSE', () => {
    expect(getTransactionSign('EXPENSE')).toBe('-')
  })
})

describe('getTransactionColor', () => {
  it('returns income class for INCOME', () => {
    expect(getTransactionColor('INCOME')).toBe('text-income')
  })

  it('returns expense class for EXPENSE', () => {
    expect(getTransactionColor('EXPENSE')).toBe('text-expense')
  })
})

describe('getInitials', () => {
  it('returns initials from full name', () => {
    expect(getInitials('Muhammad Afif')).toBe('MA')
  })

  it('returns single initial for one word', () => {
    expect(getInitials('Afif')).toBe('A')
  })

  it('returns U for null', () => {
    expect(getInitials(null)).toBe('U')
  })

  it('returns U for undefined', () => {
    expect(getInitials(undefined)).toBe('U')
  })

  it('returns uppercase initials', () => {
    expect(getInitials('john doe')).toBe('JD')
  })

  it('only uses first two words', () => {
    expect(getInitials('Muhammad Afif Naufal')).toBe('MA')
  })
})

describe('truncate', () => {
  it('returns original text when shorter than max', () => {
    expect(truncate('hello', 10)).toBe('hello')
  })

  it('truncates and adds ellipsis when longer', () => {
    expect(truncate('hello world', 5)).toBe('hello...')
  })

  it('returns text unchanged at exact max length', () => {
    expect(truncate('hello', 5)).toBe('hello')
  })

  it('handles empty string', () => {
    expect(truncate('', 10)).toBe('')
  })
})
