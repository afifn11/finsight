// app/api/ocr/route.ts
// OCR struk menggunakan Gemini Vision API
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { GoogleGenAI } from '@google/genai'
import { ocrRateLimiter, checkRateLimit } from '@/lib/rate-limit'
import type { ApiError } from '@/types'

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_AI_API_KEY! })

const OCR_PROMPT = `Kamu adalah asisten keuangan yang menganalisis foto struk/nota/bukti pembayaran.

Ekstrak informasi dari gambar ini dan kembalikan HANYA JSON dengan format:
{
  "amount": number | null,
  "date": "YYYY-MM-DD" | null,
  "description": string | null,
  "merchant": string | null,
  "category": string | null,
  "type": "EXPENSE" | "INCOME",
  "confidence": number
}

Pilihan category: Makanan & Minuman, Transportasi, Belanja, Tagihan & Utilitas, Hiburan, Kesehatan, Pendidikan, Lainnya.
Kembalikan HANYA JSON, tanpa penjelasan, tanpa markdown.`

interface OcrExtractedRaw {
  amount?: number | string | null
  date?: string | null
  description?: string | null
  merchant?: string | null
  category?: string | null
  type?: 'EXPENSE' | 'INCOME'
  confidence?: number | string
}

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'] as const
type AllowedMimeType = (typeof ALLOWED_MIME_TYPES)[number]

function isAllowedMimeType(type: string): type is AllowedMimeType {
  return (ALLOWED_MIME_TYPES as readonly string[]).includes(type)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json<ApiError>({ error: 'Unauthorized' }, { status: 401 })
  }

  // P0.3: rate limit — OCR memanggil Gemini Vision, operasi mahal & lambat.
  const { success, remaining, reset } = await checkRateLimit(ocrRateLimiter, session.user.id)
  if (!success) {
    return NextResponse.json<ApiError>(
      { error: 'Terlalu banyak scan struk. Coba lagi dalam beberapa menit.' },
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
    const file = formData.get('image') as File | null

    if (!file) {
      return NextResponse.json<ApiError>({ error: 'Gambar tidak ditemukan' }, { status: 400 })
    }

    if (!isAllowedMimeType(file.type)) {
      return NextResponse.json<ApiError>(
        { error: 'Format gambar tidak didukung. Gunakan JPG, PNG, atau WEBP.' },
        { status: 400 }
      )
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json<ApiError>({ error: 'Ukuran gambar maksimal 10MB.' }, { status: 400 })
    }

    // Convert to base64
    const arrayBuffer = await file.arrayBuffer()
    const base64 = Buffer.from(arrayBuffer).toString('base64')

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          parts: [
            {
              inlineData: {
                mimeType: file.type,
                data: base64,
              },
            },
            { text: OCR_PROMPT },
          ],
        },
      ],
    })

    const text = response.text ?? ''

    if (!text) {
      return NextResponse.json<ApiError>(
        { error: 'Gagal membaca struk. Pastikan gambar jelas dan cukup terang.' },
        { status: 422 }
      )
    }

    // Parse JSON — strip markdown fences kalau ada
    const cleaned = text.replace(/```json|```/g, '').trim()
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/)

    if (!jsonMatch) {
      return NextResponse.json<ApiError>(
        { error: 'Gagal membaca struk. Pastikan gambar jelas dan cukup terang.' },
        { status: 422 }
      )
    }

    const extracted = JSON.parse(jsonMatch[0]) as OcrExtractedRaw

    return NextResponse.json({
      data: {
        amount: extracted.amount ? Number(extracted.amount) : null,
        date: extracted.date ?? null,
        description: extracted.description ?? extracted.merchant ?? null,
        merchant: extracted.merchant ?? null,
        category: extracted.category ?? null,
        type: extracted.type ?? 'EXPENSE',
        confidence: Number(extracted.confidence) || 0.5,
      },
      message: 'Struk berhasil dibaca',
    })
  } catch (err) {
    console.error('OCR error:', err)
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json<ApiError>(
      { error: `Gagal memproses gambar: ${message}` },
      { status: 500 }
    )
  }
}