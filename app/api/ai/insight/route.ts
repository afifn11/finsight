// app/api/ai/insight/route.ts
// Uses Google Gemini API via @google/genai SDK
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { GoogleGenAI } from '@google/genai'
import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns'
import { id as localeId } from 'date-fns/locale'
import { aiInsightRateLimiter, checkRateLimit } from '@/lib/rate-limit'
import { z } from 'zod'
import type { ApiResponse, ApiError, AiInsightData, Insight } from '@/types'

const insightSchema = z.array(
  z.object({
    title: z.string().min(1).max(100),
    description: z.string().min(1).max(300),
    type: z.enum(['info', 'warning', 'tip', 'achievement']),
  })
)

const FALLBACK_INSIGHTS: Insight[] = [
  {
    title: 'Data keuangan siap dianalisis',
    description:
      'Tambahkan lebih banyak transaksi untuk mendapatkan insight yang lebih akurat.',
    type: 'info',
  },
]

const genAI = new GoogleGenAI({ apiKey: process.env.GOOGLE_AI_API_KEY! })

interface TypeAggRow {
  type: 'INCOME' | 'EXPENSE'
  _sum: { amount: number | null }
}

// ── GET /api/ai/insight ────────────────────────────────────────
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json<ApiError>({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id
    const now = new Date()
    const currentMonth = now.getMonth() + 1
    const currentYear = now.getFullYear()

    const buildRateLimitPayload = () => {
      const fallbackMessage =
        'Analisis AI sementara tidak tersedia (kuota terlampaui). Silakan coba beberapa saat lagi.'
      const fallbackData: AiInsightData = {
        insights: [
          {
            title: 'Analisis AI Sementara Tidak Tersedia',
            description: fallbackMessage,
            type: 'info',
          },
        ],
        generatedAt: now.toISOString(),
        month: currentMonth,
        year: currentYear,
      }
      return NextResponse.json({
        insight: fallbackMessage,
        status: 'rate_limited',
        data: fallbackData,
      })
    }

    // ── Check cache first ──────────────────────────────────────
    const cached = await prisma.aiInsight.findUnique({
      where: { userId_month_year: { userId, month: currentMonth, year: currentYear } },
    })

    if (cached) {
      return NextResponse.json<ApiResponse<AiInsightData>>({
        data: cached.content as unknown as AiInsightData,
      })
    }

    // P0.3: rate limit sebelum melakukan query berat / panggilan Gemini.
    const { success } = await checkRateLimit(aiInsightRateLimiter, userId)
    if (!success) {
      return buildRateLimitPayload()
    }

  // ── Gather real user data ──────────────────────────────────
  const monthStart = startOfMonth(now)
  const monthEnd = endOfMonth(now)
  const prevMonthStart = startOfMonth(subMonths(now, 1))
  const prevMonthEnd = endOfMonth(subMonths(now, 1))

  const [currentTxs, prevMonthAgg, budgets] = await Promise.all([
    prisma.transaction.findMany({
      where: { userId, date: { gte: monthStart, lte: monthEnd } },
      include: { category: true },
      orderBy: { date: 'desc' },
    }),
    prisma.transaction.groupBy({
      by: ['type'],
      where: { userId, date: { gte: prevMonthStart, lte: prevMonthEnd } },
      _sum: { amount: true },
    }),
    prisma.budget.findMany({
      where: { userId, isActive: true },
      include: { category: true },
    }),
  ])

  // ── Aggregate context data ─────────────────────────────────
  const totalIncome = currentTxs
    .filter((t) => t.type === 'INCOME')
    .reduce((sum, t) => sum + Number(t.amount), 0)

  const totalExpense = currentTxs
    .filter((t) => t.type === 'EXPENSE')
    .reduce((sum, t) => sum + Number(t.amount), 0)

  const prevAggList = prevMonthAgg as unknown as TypeAggRow[]
  const prevExpense = Number(
    prevAggList.find((r) => r.type === 'EXPENSE')?._sum.amount ?? 0
  )

  const categorySpend: Record<string, { name: string; total: number; count: number }> = {}
  for (const tx of currentTxs.filter((t) => t.type === 'EXPENSE')) {
    const key = tx.category.name
    if (!categorySpend[key]) categorySpend[key] = { name: key, total: 0, count: 0 }
    categorySpend[key]!.total += Number(tx.amount)
    categorySpend[key]!.count += 1
  }

  const topCategories = Object.values(categorySpend)
    .sort((a, b) => b.total - a.total)
    .slice(0, 5)

  const budgetStatus = budgets.map((b) => {
    const spent = categorySpend[b.category.name]?.total ?? 0
    const percentage = Math.round((spent / Number(b.amount)) * 100)
    return { category: b.category.name, budget: Number(b.amount), spent, percentage }
  })

  const fmt = (n: number) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(n)

  const contextData = {
    periode: format(now, 'MMMM yyyy', { locale: localeId }),
    ringkasan: {
      totalPemasukan: fmt(totalIncome),
      totalPengeluaran: fmt(totalExpense),
      saldoBersih: fmt(totalIncome - totalExpense),
      tabunganPersen:
        totalIncome > 0
          ? Math.round(((totalIncome - totalExpense) / totalIncome) * 100)
          : 0,
      jumlahTransaksi: currentTxs.length,
    },
    perbandinganBulanLalu: {
      pengeluaranBulanIni: fmt(totalExpense),
      pengeluaranBulanLalu: fmt(prevExpense),
      selisihPersen:
        prevExpense > 0
          ? Math.round(((totalExpense - prevExpense) / prevExpense) * 100)
          : null,
    },
    kategoriTeratas: topCategories.map((c) => ({
      kategori: c.name,
      total: fmt(c.total),
      jumlahTransaksi: c.count,
      persentaseDariTotal:
        totalExpense > 0 ? Math.round((c.total / totalExpense) * 100) : 0,
    })),
    statusBudget: budgetStatus,
  }

  // ── Call Gemini 2.5 Flash dengan systemInstruction & error boundary ──
  let insights: Insight[] = FALLBACK_INSIGHTS

  try {
    const response = await genAI.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: JSON.stringify(contextData, null, 2),
      config: {
        systemInstruction: `Kamu adalah asisten keuangan personal yang analitis dan suportif.
Analisis data ringkasan keuangan berikut dan berikan TEPAT 3 insight personal.
PENTING:
- Setiap insight harus spesifik dengan angka nyata dari data (bukan generik)
- Gunakan bahasa Indonesia yang natural dan ramah
- Fokus pada insight yang actionable (bisa ditindaklanjuti)
- Variasikan tipe insight: info, warning, tip, atau achievement
- Balas HANYA dengan JSON array: [{"title": string, "description": string, "type": "info"|"warning"|"tip"|"achievement"}], tanpa markdown, tanpa teks lain.`,
        maxOutputTokens: 800,
        temperature: 0.3,
      },
    })

    const rawText = response.text ?? '[]'
    const cleaned = rawText.replace(/```json|```/g, '').trim()
    const parsed: unknown = JSON.parse(cleaned)
    const validation = insightSchema.safeParse(parsed)

    if (validation.success && validation.data.length > 0) {
      insights = validation.data
    }
  } catch (err) {
    console.error('[AI_INSIGHT_ERROR] Gagal memanggil Gemini API atau validasi output:', err)
    return buildRateLimitPayload()
  }

  const insightData: AiInsightData = {
    insights,
    generatedAt: new Date().toISOString(),
    month: currentMonth,
    year: currentYear,
  }

  // ── Cache result ───────────────────────────────────────────
  await prisma.aiInsight.upsert({
    where: { userId_month_year: { userId, month: currentMonth, year: currentYear } },
    update: { content: insightData as unknown as object },
    create: {
      userId,
      month: currentMonth,
      year: currentYear,
      content: insightData as unknown as object,
    },
  })

  return NextResponse.json<ApiResponse<AiInsightData>>({ data: insightData })
  } catch (fatalErr) {
    console.error('[AI_INSIGHT_FATAL_ERROR]', fatalErr)
    const now = new Date()
    const fallbackMessage =
      'Analisis AI sementara tidak tersedia (kuota terlampaui). Silakan coba beberapa saat lagi.'
    return NextResponse.json({
      insight: fallbackMessage,
      status: 'rate_limited',
      data: {
        insights: [
          {
            title: 'Analisis AI Sementara Tidak Tersedia',
            description: fallbackMessage,
            type: 'info',
          },
        ],
        generatedAt: now.toISOString(),
        month: now.getMonth() + 1,
        year: now.getFullYear(),
      },
    })
  }
}