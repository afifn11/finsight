// tests/setup.ts
import { afterEach, vi } from 'vitest'
import '@testing-library/jest-dom'

// ── Mock Next.js server utilities ─────────────────────────────
vi.mock('next/server', async () => {
  const actual = await vi.importActual<typeof import('next/server')>('next/server')
  return {
    ...actual,
    NextResponse: {
      ...actual.NextResponse,
      json: (data: unknown, init?: ResponseInit) => ({
        json: async () => data,
        status: init?.status ?? 200,
        headers: new Headers(init?.headers),
        ok: (init?.status ?? 200) < 400,
      }),
    },
  }
})

// ── Mock next-auth ─────────────────────────────────────────────
vi.mock('next-auth', () => ({
  default: vi.fn(),
  getServerSession: vi.fn(),
}))

vi.mock('@/lib/auth', () => ({
  authOptions: {},
}))

// ── Mock Rate Limiting ─────────────────────────────────────────
vi.mock('@/lib/rate-limit', () => ({
  checkRateLimit: vi.fn().mockResolvedValue({ success: true, remaining: 10, reset: Date.now() + 60000 }),
  authRateLimiter: { limit: vi.fn().mockResolvedValue({ success: true, remaining: 10, reset: Date.now() + 60000 }) },
  ocrRateLimiter: { limit: vi.fn().mockResolvedValue({ success: true, remaining: 10, reset: Date.now() + 60000 }) },
  aiInsightRateLimiter: { limit: vi.fn().mockResolvedValue({ success: true, remaining: 10, reset: Date.now() + 60000 }) },
}))

// ── Mock Prisma client ─────────────────────────────────────────
vi.mock('@/lib/prisma', () => {
  const mockPrisma = {
    $transaction: vi.fn((input: unknown) => {
      if (Array.isArray(input)) return Promise.all(input)
      if (typeof input === 'function') return input(mockPrisma)
      return Promise.resolve(input)
    }),
    transaction: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
      groupBy: vi.fn(),
    },
    budget: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      upsert: vi.fn(),
      delete: vi.fn(),
    },
    category: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn().mockResolvedValue({ id: 'cat-001' }),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
      create: vi.fn(),
    },
    aiInsight: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
    },
    wallet: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn().mockResolvedValue({ id: 'wallet-001', name: 'BCA', balance: 5000000 }),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn().mockResolvedValue(2),
    },
    walletTransfer: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
    },
    subscription: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  }
  return { prisma: mockPrisma }
})

// ── Mock Google AI SDK — pakai function biasa agar bisa di-new ─
vi.mock('@google/genai', () => {
  const mockGenerateContent = vi.fn().mockResolvedValue({
    text: JSON.stringify([
      { title: 'Test insight', description: 'Test description', type: 'info' },
    ]),
  })

  // Regular function (bukan arrow) agar bisa dipanggil dengan `new`
  function MockGoogleGenAI(this: unknown) {
    return {
      models: { generateContent: mockGenerateContent },
    }
  }

  return { GoogleGenAI: MockGoogleGenAI }
})

// ── Mock Supabase Storage ──────────────────────────────────────
vi.mock('@/lib/supabase', () => ({
  RECEIPTS_BUCKET: 'receipts',
  supabaseAdmin: {
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn().mockResolvedValue({ error: null }),
        createSignedUrl: vi.fn().mockResolvedValue({
          data: { signedUrl: 'https://supabase.example.com/signed' },
          error: null,
        }),
        remove: vi.fn().mockResolvedValue({ error: null }),
      })),
    },
  },
  getSignedReceiptUrl: vi.fn().mockResolvedValue('https://supabase.example.com/signed'),
  deleteReceiptFile: vi.fn().mockResolvedValue(true),
}))

// ── Reset semua mock setelah tiap test ────────────────────────
afterEach(() => {
  vi.clearAllMocks()
})
