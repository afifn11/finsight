// app/api/ai/insight/route.ts
// Uses Google Gemini API via @google/genai SDK
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { GoogleGenAI } from '@google/genai'
import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns'
import { id as localeId } from 'date-fns/locale'
import type { ApiResponse, ApiError, AiInsightData, Insight } from '@/types'

const genAI = new GoogleGenAI({ apiKey: process.env.GOOGLE_AI_API_KEY! })

// ── GET /api/ai/insight ────────────────────────────────────────
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json<ApiError>({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = session.user.id
  const now = new Date()
  const currentMonth = now.getMonth() + 1
  const currentYear = now.getFullYear()

  // ── Check cache first ──────────────────────────────────────
  const cached = await prisma.aiInsight.findUnique({
    where: { userId_month_year: { userId, month: currentMonth, year: currentYear } },
  })

  if (cached) {
    return NextResponse.json<ApiResponse<AiInsightData>>({
      data: cached.content as unknown as AiInsightData,
    })
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const txList = currentTxs as any[]
  const totalIncome = txList
    .filter((t) => t.type === 'INCOME')
    .reduce((sum: number, t) => sum + Number(t.amount), 0)

  const totalExpense = txList
    .filter((t) => t.type === 'EXPENSE')
    .reduce((sum: number, t) => sum + Number(t.amount), 0)

  const prevExpense = Number(
    prevMonthAgg.find((r) => r.type === 'EXPENSE')?._sum.amount ?? 0
  )

  const categorySpend: Record<string, { name: string; total: number; count: number }> = {}
  for (const tx of txList.filter((t) => t.type === 'EXPENSE')) {
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

  const prompt = `Kamu adalah asisten keuangan personal yang analitis dan suportif.
Berikan TEPAT 3 insight keuangan personal dalam format JSON berdasarkan data berikut:

${JSON.stringify(contextData, null, 2)}

PENTING:
- Setiap insight harus spesifik dengan angka nyata dari data (bukan generik)
- Gunakan bahasa Indonesia yang natural dan friendly
- Fokus pada insight yang actionable (bisa ditindaklanjuti)
- Variasikan tipe insight: ada yang informatif, ada yang peringatan, ada yang pencapaian/tips

Balas HANYA dengan JSON array berikut, tanpa teks lain, tanpa markdown:
[
  {
    "title": "Judul singkat (max 8 kata)",
    "description": "Penjelasan insight yang spesifik dengan angka (max 2 kalimat)",
    "type": "info|warning|tip|achievement"
  }
]`

  // ── Call Gemini 2.5 Flash ──────────────────────────────────
  const response = await genAI.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      maxOutputTokens: 800,
      temperature: 0.4,
    },
  })

  const rawText = response.text ?? '[]'

  let insights: Insight[] = []
  try {
    const cleaned = rawText.replace(/```json|```/g, '').trim()
    insights = JSON.parse(cleaned) as Insight[]
  } catch {
    insights = [
      {
        title: 'Data keuangan siap dianalisis',
        description:
          'Tambahkan lebih banyak transaksi untuk mendapatkan insight yang lebih akurat.',
        type: 'info',
      },
    ]
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
    update: { content: insightData as unknown as import('@prisma/client').Prisma.InputJsonValue },
    create: {
      userId,
      month: currentMonth,
      year: currentYear,
      content: insightData as unknown as import('@prisma/client').Prisma.InputJsonValue,
    },
  })

  return NextResponse.json<ApiResponse<AiInsightData>>({ data: insightData })
}