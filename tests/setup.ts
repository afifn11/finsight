// tests/setup.ts
import { vi } from 'vitest'
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

// ── Mock Prisma client ─────────────────────────────────────────
vi.mock('@/lib/prisma', () => ({
  prisma: {
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
  },
}))

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

// ── Reset semua mock setelah tiap test ────────────────────────
afterEach(() => {
  vi.clearAllMocks()
})
