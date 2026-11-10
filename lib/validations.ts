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
})

export const registerFormSchema = registerSchema
  .extend({
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Password tidak cocok',
    path: ['confirmPassword'],
  })

// ── Transaction ────────────────────────────────────────────────
export const transactionSchema = z.object({
  amount: z
    .number({ error: 'Nominal harus angka' })
    .positive('Nominal harus lebih dari 0')
    .max(999_999_999_999, 'Nominal terlalu besar'),
  type: z.enum(['INCOME', 'EXPENSE']),
  categoryId: z.string().min(1, 'Pilih kategori'),
  walletId: z.string().optional().nullable(),
  description: z.string().min(1, 'Deskripsi wajib diisi').max(100),
  date: z.coerce.date(),
  notes: z.string().max(500).optional().nullable(),
  isRecurring: z.boolean().default(false),
  recurringPeriod: z
    .enum(['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'])
    .optional(),
  recurringEndDate: z.coerce.date().optional(),
})

export const updateTransactionSchema = transactionSchema.partial().extend({
  id: z.string().min(1),
})

// ── Wallet ─────────────────────────────────────────────────────
export const walletSchema = z.object({
  name: z.string().min(1, 'Nama dompet wajib diisi').max(50),
  type: z.enum(['BANK', 'E_WALLET', 'CASH', 'INVESTMENT', 'OTHER']),
  balance: z.number().default(0),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Format warna tidak valid')
    .default('#0891b2'),
  icon: z.string().default('wallet'),
  accountNumber: z.string().max(50).optional().nullable(),
  isIncludedInNetWorth: z.boolean().default(true),
})

export const updateWalletSchema = walletSchema.partial()

export const walletTransferSchema = z
  .object({
    fromWalletId: z.string().min(1, 'Pilih dompet asal'),
    toWalletId: z.string().min(1, 'Pilih dompet tujuan'),
    amount: z.number().positive('Nominal transfer harus lebih dari 0'),
    fee: z.number().min(0, 'Biaya admin tidak boleh negatif').default(0),
    notes: z.string().max(200).optional().nullable(),
    date: z.coerce.date().default(() => new Date()),
  })
  .refine((data) => data.fromWalletId !== data.toWalletId, {
    message: 'Dompet tujuan tidak boleh sama dengan dompet asal',
    path: ['toWalletId'],
  })

// ── Budget ─────────────────────────────────────────────────────
export const budgetSchema = z.object({
  categoryId: z.string().min(1, 'Pilih kategori'),
  amount: z
    .number({ error: 'Budget harus angka' })
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
export type RegisterInput = z.infer<typeof registerFormSchema>
export type TransactionInput = z.infer<typeof transactionSchema>
export type UpdateTransactionInput = z.infer<typeof updateTransactionSchema>
export type BudgetInput = z.infer<typeof budgetSchema>
export type CategoryInput = z.infer<typeof categorySchema>
export type UserSettingsInput = z.infer<typeof userSettingsSchema>
export type TransactionFiltersInput = z.infer<typeof transactionFiltersSchema>
export type WalletInput = z.infer<typeof walletSchema>
export type UpdateWalletInput = z.infer<typeof updateWalletSchema>
export type WalletTransferInputType = z.infer<typeof walletTransferSchema>