// app/api/ocr/route.ts
// @ts-nocheck
// OCR struk menggunakan Gemini Vision API
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { GoogleGenAI } from '@google/genai'

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

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const formData = await req.formData()
    const file = formData.get('image') as File | null

    if (!file) {
      return NextResponse.json({ error: 'Gambar tidak ditemukan' }, { status: 400 })
    }

    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/heic']
    if (!allowed.includes(file.type)) {
      return NextResponse.json({ error: 'Format gambar tidak didukung. Gunakan JPG, PNG, atau WEBP.' }, { status: 400 })
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'Ukuran gambar maksimal 10MB.' }, { status: 400 })
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
                mimeType: file.type as 'image/jpeg' | 'image/png' | 'image/webp',
                data: base64,
              },
            },
            { text: OCR_PROMPT },
          ],
        },
      ],
    })

    // Use response.text like working insight route
    const text = response.text ?? ''

    if (!text) {
      return NextResponse.json({
        error: 'Gagal membaca struk. Pastikan gambar jelas dan cukup terang.',
      }, { status: 422 })
    }

    // Parse JSON — strip markdown if present
    const cleaned = text.replace(/```json|```/g, '').trim()
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/)

    if (!jsonMatch) {
      return NextResponse.json({
        error: 'Gagal membaca struk. Pastikan gambar jelas dan cukup terang.',
      }, { status: 422 })
    }

    const extracted = JSON.parse(jsonMatch[0])

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
    return NextResponse.json(
      { error: `Gagal memproses gambar: ${message}` },
      { status: 500 }
    )
  }
}