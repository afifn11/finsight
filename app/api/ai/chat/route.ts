// app/api/ai/chat/route.ts
// FinSight AI Financial Copilot Chatbot Handler powered by Gemini 2.5 Flash
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { GoogleGenAI } from '@google/genai'
import { startOfMonth, endOfMonth, format } from 'date-fns'
import { id as localeId } from 'date-fns/locale'
import { aiInsightRateLimiter, checkRateLimit } from '@/lib/rate-limit'
import { z } from 'zod'
import type { ApiError } from '@/types'

const chatRequestSchema = z.object({
  message: z.string().min(1, 'Pesan tidak boleh kosong').max(1000),
  history: z
    .array(
      z.object({
        role: z.enum(['user', 'model', 'assistant']),
        text: z.string(),
      })
    )
    .optional(),
})

interface CopilotResponse {
  reply: string
  suggestions: string[]
}

const FALLBACK_ERROR_REPLY: CopilotResponse = {
  reply: 'Maaf, AI Copilot sedang mengalami sedikit kendala koneksi. Silakan coba beberapa saat lagi.',
  suggestions: ['Berapa total saldo saya?', 'Cek pengeluaran bulan ini'],
}

function formatRupiah(num: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(num)
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json<ApiError>({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id

    // Rate Limiting
    const { success, remaining, reset } = await checkRateLimit(aiInsightRateLimiter, userId)
    if (!success) {
      return NextResponse.json<ApiError>(
        { error: 'Terlalu banyak pesan ke Copilot. Silakan tunggu beberapa saat.' },
        {
          status: 429,
          headers: {
            'X-RateLimit-Remaining': String(remaining),
            'X-RateLimit-Reset': String(reset),
          },
        }
      )
    }

    const body = (await req.json()) as unknown
    const parsed = chatRequestSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json<ApiError>(
        { error: parsed.error.issues[0]?.message ?? 'Format pesan tidak valid' },
        { status: 400 }
      )
    }

    const { message, history = [] } = parsed.data

    const now = new Date()
    const monthStart = startOfMonth(now)
    const monthEnd = endOfMonth(now)

    // ── Gather real-time financial context ───────────────────────
    const [wallets, monthlyTxs, budgets, subscriptions] = await Promise.all([
      prisma.wallet.findMany({
        where: { userId },
        select: { name: true, type: true, balance: true, isIncludedInNetWorth: true },
      }),
      prisma.transaction.groupBy({
        by: ['type'],
        where: { userId, date: { gte: monthStart, lte: monthEnd } },
        _sum: { amount: true },
      }),
      prisma.budget.findMany({
        where: { userId, isActive: true },
        include: { category: true },
      }),
      prisma.subscription.findMany({
        where: { userId, status: 'ACTIVE' },
        orderBy: { nextBillingDate: 'asc' },
      }),
    ])

    // Compute Net Worth and balances explicitly with Number(...)
    let totalNetWorth = 0
    const walletList = wallets.map((w) => {
      const bal = Number(w.balance ?? 0)
      if (w.isIncludedInNetWorth) totalNetWorth += bal
      return {
        nama: w.name,
        tipe: w.type,
        saldo: formatRupiah(bal),
        saldoAngka: bal,
        masukNetWorth: Boolean(w.isIncludedInNetWorth),
      }
    })

    // Compute Income & Expense
    let totalIncome = 0
    let totalExpense = 0
    for (const row of monthlyTxs) {
      const amt = Number(row._sum.amount ?? 0)
      if (row.type === 'INCOME') totalIncome = amt
      if (row.type === 'EXPENSE') totalExpense = amt
    }
    const netSavings = totalIncome - totalExpense

    // Category expense breakdown for budget comparison
    const catExpenses = await prisma.transaction.groupBy({
      by: ['categoryId'],
      where: { userId, type: 'EXPENSE', date: { gte: monthStart, lte: monthEnd } },
      _sum: { amount: true },
    })
    const catExpenseMap = new Map(
      catExpenses.map((c) => [c.categoryId, Number(c._sum.amount ?? 0)])
    )

    const budgetSummary = budgets.map((b) => {
      const spent = Number(catExpenseMap.get(b.categoryId) ?? 0)
      const limit = Number(b.amount ?? 0)
      return {
        kategori: b.category.name,
        alokasi: formatRupiah(limit),
        alokasiAngka: limit,
        terpakai: formatRupiah(spent),
        terpakaiAngka: spent,
        sisa: formatRupiah(Math.max(0, limit - spent)),
        persentase: limit > 0 ? Math.round((spent / limit) * 100) : 0,
        status: spent > limit ? 'OVERBUDGET' : spent >= limit * 0.8 ? 'WASPADA' : 'AMAN',
      }
    })

    // Subscriptions summary
    let monthlySubCommitment = 0
    const subscriptionSummary = subscriptions.map((s) => {
      const amt = Number(s.amount ?? 0)
      if (s.billingCycle === 'WEEKLY') monthlySubCommitment += (amt * 52) / 12
      else if (s.billingCycle === 'MONTHLY') monthlySubCommitment += amt
      else if (s.billingCycle === 'YEARLY') monthlySubCommitment += amt / 12

      return {
        nama: s.name,
        biaya: formatRupiah(amt),
        biayaAngka: amt,
        siklus: s.billingCycle,
        jatuhTempoBerikutnya: format(new Date(s.nextBillingDate), 'dd MMMM yyyy', { locale: localeId }),
      }
    })

    const contextData = {
      pengguna: session.user.name ?? 'Pengguna FinSight',
      periode: format(now, 'MMMM yyyy', { locale: localeId }),
      ringkasanKeuangan: {
        totalNetWorth: formatRupiah(totalNetWorth),
        totalNetWorthAngka: totalNetWorth,
        pemasukanBulanIni: formatRupiah(totalIncome),
        pemasukanBulanIniAngka: totalIncome,
        pengeluaranBulanIni: formatRupiah(totalExpense),
        pengeluaranBulanIniAngka: totalExpense,
        sisaTabunganBulanIni: formatRupiah(netSavings),
        sisaTabunganBulanIniAngka: netSavings,
        rasioTabungan: totalIncome > 0 ? `${Math.round((netSavings / totalIncome) * 100)}%` : '0%',
        komitmenLanggananBulanan: formatRupiah(Math.round(monthlySubCommitment)),
      },
      dompetDanAkun: walletList,
      anggaranAktif: budgetSummary,
      langgananAktif: subscriptionSummary,
    }

    const systemInstruction = `Kamu adalah "FinSight Financial Copilot", asisten dan penasihat keuangan pribadi yang empatik, analitis, profesional, dan ramah. Kamu berbicara dalam bahasa Indonesia yang natural, modern, dan mudah dipahami.

PANDUAN & ATURAN UTAMA:
1. Grounding Ketat: Selalu rujuk dan gunakan angka serta kondisi keuangan nyata dari data konteks pengguna yang diberikan. Jangan mengarang angka saldo atau pengeluaran.
2. Keputusan Pembelian: Jika pengguna bertanya apakah mereka mampu membeli suatu barang atau pengeluaran ekstra, evaluasi berdasarkan:
   - Sisa saldo kas/tabungan bulan ini (${formatRupiah(netSavings)}).
   - Total Net Worth (${formatRupiah(totalNetWorth)}).
   - Kategori anggaran yang relevan dan komitmen langganan rutin.
   Berikan pertimbangan bijak dan alternatif rencana jika berisiko mengganggu kestabilan keuangan.
3. Gaya Bahasa: Empatis, solutif, menggunakan bullet points atau paragraf terstruktur jika menjelaskan beberapa poin.
4. Format Jawaban: Berikan output dalam format JSON valid dengan struktur:
{
  "reply": "string jawaban lengkap kamu dalam format markdown (gunakan bold, bullet points jika perlu)",
  "suggestions": ["2-3 pertanyaan tindak lanjut yang pendek dan relevan yang bisa diklik pengguna"]
}
Jangan menambahkan backtick markdown json tambahan di luar JSON jika memungkinkan, balas langsung dengan JSON murni.`

    const conversationHistoryPrompt = history
      .slice(-6)
      .map((h) => `${h.role === 'user' ? 'Pengguna' : 'Copilot'}: ${h.text}`)
      .join('\n')

    const promptContent = `Berikut adalah data keuangan real-time saya:
\`\`\`json
${JSON.stringify(contextData, null, 2)}
\`\`\`

${conversationHistoryPrompt ? `Riwayat percakapan sebelumnya:\n${conversationHistoryPrompt}\n\n` : ''}Pertanyaan saya saat ini: "${message}"`

    // Default fallback if AI service is not configured or errors
    let copilotResponse: CopilotResponse = {
      reply: `Halo ${session.user.name ?? 'Kawan FinSight'}! Berdasarkan catatan keuanganmu di ${format(now, 'MMMM yyyy', { locale: localeId })}:
- **Net Worth:** ${formatRupiah(totalNetWorth)}
- **Pemasukan:** ${formatRupiah(totalIncome)}
- **Pengeluaran:** ${formatRupiah(totalExpense)}
- **Sisa Saldo Kas:** ${formatRupiah(netSavings)}
- **Komitmen Langganan:** ${formatRupiah(Math.round(monthlySubCommitment))}/bulan

${netSavings >= 0 ? 'Kondisi arus kasmu bulan ini masih dalam kondisi sehat (surplus).' : 'Pengeluaranmu saat ini melebihi pemasukan bulan ini (defisit). Perhatikan kategori pengeluaran terbesarmu.'}`,
      suggestions: [
        'Apakah budget bulan ini aman?',
        'Berapa total tagihan berulang saya?',
        'Di mana pengeluaran terbesar saya?',
      ],
    }

    const apiKey = process.env.GOOGLE_AI_API_KEY
    if (apiKey) {
      try {
        const genAI = new GoogleGenAI({ apiKey })
        const aiResult = await genAI.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: promptContent,
          config: {
            systemInstruction,
            maxOutputTokens: 1200,
            temperature: 0.4,
          },
        })

        const rawText = aiResult.text?.trim() ?? ''
        const cleaned = rawText.replace(/^```json\s*|\s*```$/g, '').trim()

        try {
          const parsedJson = JSON.parse(cleaned) as { reply?: string; suggestions?: string[] }
          if (parsedJson.reply) {
            copilotResponse = {
              reply: parsedJson.reply,
              suggestions:
                Array.isArray(parsedJson.suggestions) && parsedJson.suggestions.length > 0
                  ? parsedJson.suggestions
                  : copilotResponse.suggestions,
            }
          }
        } catch {
          // If not strictly JSON, use the raw text as markdown reply
          if (rawText) {
            copilotResponse = {
              reply: rawText,
              suggestions: copilotResponse.suggestions,
            }
          }
        }
      } catch (err) {
        console.error('[AI_COPILOT_CHAT_ERROR] Failed calling Gemini API, returning fallback response:', err)
        return NextResponse.json<CopilotResponse>(FALLBACK_ERROR_REPLY)
      }
    }

    return NextResponse.json<CopilotResponse>(copilotResponse)
  } catch (fatalErr) {
    console.error('[AI_CHAT_ROUTE_FATAL_ERROR]', fatalErr)
    return NextResponse.json<CopilotResponse>(FALLBACK_ERROR_REPLY)
  }
}
