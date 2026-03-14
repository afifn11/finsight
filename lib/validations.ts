// lib/validations.ts
import { z } from 'zod'

// ── Auth ───────────────────────────────────────────────────────
export const loginSchema = z.object({
  email: z.string().email('Email tidak valid'),
  password: z.string().min(8, 'Password minimal 8 karakter'),
})

export const registerSchema = z.object({
  name: z.string().min(2, 'Nama minimal 2 karakter').max(50),
  email: z.string().email('Email tidak valid'),
  password: z
    .string()
    .min(8, 'Password minimal 8 karakter')
    .regex(/[A-Z]/, 'Harus ada huruf kapital')
    .regex(/[0-9]/, 'Harus ada angka'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Password tidak cocok',
  path: ['confirmPassword'],
})

// ── Transaction ────────────────────────────────────────────────
export const transactionSchema = z.object({
  amount: z
    .number({ invalid_type_error: 'Nominal harus angka' })
    .positive('Nominal harus lebih dari 0')
    .max(999_999_999_999, 'Nominal terlalu besar'),
  type: z.enum(['INCOME', 'EXPENSE']),
  categoryId: z.string().min(1, 'Pilih kategori'),
  description: z.string().min(1, 'Deskripsi wajib diisi').max(100),
  date: z.coerce.date(),
  notes: z.string().max(500).optional(),
  isRecurring: z.boolean().default(false),
  recurringPeriod: z
    .enum(['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'])
    .optional(),
  recurringEndDate: z.coerce.date().optional(),
})

export const updateTransactionSchema = transactionSchema.partial().extend({
  id: z.string().min(1),
})

// ── Budget ─────────────────────────────────────────────────────
export const budgetSchema = z.object({
  categoryId: z.string().min(1, 'Pilih kategori'),
  amount: z
    .number({ invalid_type_error: 'Budget harus angka' })
    .positive('Budget harus lebih dari 0'),
  period: z.enum(['MONTHLY', 'YEARLY']).default('MONTHLY'),
  alertThreshold: z.number().min(1).max(100).default(80),
})

// ── Category ───────────────────────────────────────────────────
export const categorySchema = z.object({
  name: z.string().min(1, 'Nama kategori wajib diisi').max(30),
  icon: z.string().min(1, 'Pilih icon'),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Format warna tidak valid'),
  forType: z.enum(['INCOME', 'EXPENSE']),
})

// ── User Settings ──────────────────────────────────────────────
export const userSettingsSchema = z.object({
  name: z.string().min(2).max(50).optional(),
  currency: z.string().length(3).default('IDR'),
  timezone: z.string().default('Asia/Jakarta'),
})

// ── Filters ────────────────────────────────────────────────────
export const transactionFiltersSchema = z.object({
  type: z.enum(['INCOME', 'EXPENSE', 'ALL']).default('ALL'),
  categoryId: z.string().optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  search: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
})

// ── Type exports ───────────────────────────────────────────────
export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>
export type TransactionInput = z.infer<typeof transactionSchema>
export type UpdateTransactionInput = z.infer<typeof updateTransactionSchema>
export type BudgetInput = z.infer<typeof budgetSchema>
export type CategoryInput = z.infer<typeof categorySchema>
export type UserSettingsInput = z.infer<typeof userSettingsSchema>
export type TransactionFiltersInput = z.infer<typeof transactionFiltersSchema>
