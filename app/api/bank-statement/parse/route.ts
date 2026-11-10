// app/api/bank-statement/parse/route.ts
// AI-powered Bank Statement Parser using Gemini 2.5 Flash
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { GoogleGenAI } from '@google/genai'
import { ocrRateLimiter, checkRateLimit } from '@/lib/rate-limit'
import { z } from 'zod'
import type { ApiError, ParsedStatementTransaction, BankStatementParseResponse } from '@/types'

const parsedTxSchema = z.object({
  date: z.string(),
  description: z.string(),
  amount: z.number().positive(),
  type: z.enum(['INCOME', 'EXPENSE']),
  categoryName: z.string().default('Lainnya'),
})

const parsedListSchema = z.array(parsedTxSchema)

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json<ApiError>({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = session.user.id

  // Rate Limiting
  const { success, remaining, reset } = await checkRateLimit(ocrRateLimiter, userId)
  if (!success) {
    return NextResponse.json<ApiError>(
      { error: 'Terlalu banyak permintaan parsing. Silakan tunggu beberapa saat.' },
      {
        status: 429,
        headers: {
          'X-RateLimit-Remaining': String(remaining),
          'X-RateLimit-Reset': String(reset),
        },
      }
    )
  }

  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json<ApiError>({ error: 'File mutasi bank wajib diunggah' }, { status: 400 })
    }

    // Max 4.5MB
    if (file.size > 4.5 * 1024 * 1024) {
      return NextResponse.json<ApiError>(
        { error: 'Ukuran file maksimal 4.5MB' },
        { status: 400 }
      )
    }

    const fileName = file.name.toLowerCase()
    const isPdf = file.type === 'application/pdf' || fileName.endsWith('.pdf')
    const isCsv =
      file.type === 'text/csv' ||
      file.type === 'application/vnd.ms-excel' ||
      fileName.endsWith('.csv') ||
      fileName.endsWith('.txt')

    if (!isPdf && !isCsv) {
      return NextResponse.json<ApiError>(
        { error: 'Format file tidak didukung. Harap unggah file PDF atau CSV/TXT mutasi bank.' },
        { status: 400 }
      )
    }

    // Fetch user categories to match IDs
    const categories = await prisma.category.findMany({
      where: { OR: [{ userId }, { type: 'SYSTEM' }] },
      select: { id: true, name: true, forType: true },
    })

    const catMap = new Map<string, string>()
    for (const c of categories) {
      catMap.set(c.name.toLowerCase(), c.id)
    }

    const currentYear = new Date().getFullYear()
    const availableCategoryNames = categories.map((c) => c.name).join(', ')

    const systemInstruction = `Kamu adalah "Financial Data Extraction Engine" spesialis mutasi rekening bank Indonesia (BCA, Mandiri, BRI, BNI, CIMB Niaga, Permata, Bank Jago, SeaBank, Jenius).
Tugas: Ekstrak seluruh baris transaksi rekening menjadi JSON array murni.

ATURAN EKSTRAKSI:
1. Format output WAJIB HANYA JSON array:
[
  {
    "date": "YYYY-MM-DD",
    "description": "nama merchant / pengirim / keterangan transfer yang jelas dan bersih",
    "amount": 150000,
    "type": "INCOME" | "EXPENSE",
    "categoryName": "pilih salah satu dari kategori tersedia"
  }
]
2. Kategori yang tersedia: ${availableCategoryNames}.
3. Aturan Tipe:
   - Kredit (CR), Uang Masuk, Setoran, Bunga Bank, Transfer Masuk = "INCOME"
   - Debet (DB), Uang Keluar, Pembelian, Tarik Tunai, Biaya Admin = "EXPENSE"
4. Tanggal: Konversi ke format ISO "YYYY-MM-DD". Jika tahun tidak tertulis, gunakan ${currentYear}.
5. Amount: Angka positif murni (float/integer), jangan ada tanda minus, titik ribuan, atau huruf Rp.
6. Buang baris saldo awal, saldo akhir, atau total mutasi.`

    const apiKey = process.env.GOOGLE_AI_API_KEY
    if (!apiKey) {
      // Graceful fallback dummy if AI key is unconfigured in dev
      return NextResponse.json<BankStatementParseResponse>({
        transactions: [
          {
            id: 'mock-1',
            date: new Date().toISOString().split('T')[0] ?? '2026-11-10',
            description: 'Contoh Transaksi Mutasi Bank (AI Key Belum Terkonfigurasi)',
            amount: 150000,
            type: 'EXPENSE',
            categoryName: 'Makanan & Minuman',
            categoryId: categories[0]?.id,
            selected: true,
          },
        ],
        count: 1,
        detectedBank: 'Bank Demo',
      })
    }

    const genAI = new GoogleGenAI({ apiKey })
    let promptContent: unknown

    if (isPdf) {
      const arrayBuffer = await file.arrayBuffer()
      const base64Data = Buffer.from(arrayBuffer).toString('base64')

      promptContent = [
        {
          inlineData: {
            mimeType: 'application/pdf',
            data: base64Data,
          },
        },
        'Ekstrak semua transaksi dari dokumen rekening koran PDF ini ke dalam format JSON.',
      ]
    } else {
      const text = await file.text()
      promptContent = `Berikut adalah data mutasi rekening bank format teks/CSV:\n\n${text.slice(0, 45000)}\n\nEkstrak seluruh baris transaksi menjadi format JSON.`
    }

    const aiResult = await genAI.models.generateContent({
      model: 'gemini-2.5-flash',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      contents: promptContent as any,
      config: {
        systemInstruction,
        maxOutputTokens: 4000,
        temperature: 0.1,
      },
    })

    const rawText = aiResult.text?.trim() ?? '[]'
    const cleaned = rawText.replace(/^```json\s*|\s*```$/g, '').trim()
    const parsedData: unknown = JSON.parse(cleaned)
    const validated = parsedListSchema.safeParse(parsedData)

    if (!validated.success) {
      return NextResponse.json<ApiError>(
        { error: 'Gagal mengekstrak data mutasi bank. Format tidak dikenali.' },
        { status: 422 }
      )
    }

    // Map matched categoryId and generate stable row IDs
    const transactions: ParsedStatementTransaction[] = validated.data.map((tx, idx) => {
      const lowerCat = tx.categoryName.toLowerCase()
      let categoryId = catMap.get(lowerCat)

      // Fallback matching
      if (!categoryId) {
        const found = categories.find((c) =>
          lowerCat.includes(c.name.toLowerCase()) || c.name.toLowerCase().includes(lowerCat)
        )
        if (found) categoryId = found.id
        else {
          const typeFallback = categories.find((c) => c.forType === tx.type)
          categoryId = typeFallback?.id ?? categories[0]?.id
        }
      }

      return {
        id: `stmt-${Date.now()}-${idx}`,
        date: tx.date,
        description: tx.description,
        amount: tx.amount,
        type: tx.type,
        categoryName: tx.categoryName,
        categoryId,
        selected: true,
      }
    })

    return NextResponse.json<BankStatementParseResponse>({
      transactions,
      count: transactions.length,
      detectedBank: fileName.includes('bca')
        ? 'BCA'
        : fileName.includes('mandiri')
        ? 'Bank Mandiri'
        : fileName.includes('bri')
        ? 'BRI'
        : fileName.includes('bni')
        ? 'BNI'
        : fileName.includes('jago')
        ? 'Bank Jago'
        : 'Bank Statement',
    })
  } catch (err) {
    console.error('[BANK_STATEMENT_PARSE_ERROR]', err)
    return NextResponse.json<ApiError>(
      { error: err instanceof Error ? err.message : 'Gagal memproses file mutasi bank' },
      { status: 500 }
    )
  }
}
