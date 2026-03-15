// app/api/ocr/route.ts
// @ts-nocheck
// OCR struk menggunakan Gemini Vision API
// Mengekstrak: nominal, tanggal, deskripsi, kategori dari foto struk

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { GoogleGenAI } from '@google/genai'

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_AI_API_KEY! })

const OCR_PROMPT = `Kamu adalah asisten keuangan yang menganalisis foto struk/nota/bukti pembayaran.

Ekstrak informasi dari gambar ini dan kembalikan HANYA JSON dengan format:
{
  "amount": number | null,        // nominal dalam angka (tanpa Rp, titik, koma) misal 25000
  "date": "YYYY-MM-DD" | null,    // tanggal transaksi
  "description": string | null,   // deskripsi singkat (maks 60 karakter) misal "Makan siang McDonald's"
  "merchant": string | null,      // nama toko/merchant misal "McDonald's", "Indomaret"
  "category": string | null,      // salah satu dari: Makanan & Minuman, Transportasi, Belanja, Tagihan & Utilitas, Hiburan, Kesehatan, Pendidikan, Lainnya
  "type": "EXPENSE" | "INCOME",   // hampir selalu EXPENSE untuk struk
  "confidence": number            // 0-1, seberapa yakin kamu dengan hasil ekstraksi
}

Jika tidak bisa membaca nilai tertentu, isi null. Kembalikan HANYA JSON, tanpa penjelasan.`

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
      return NextResponse.json({ error: 'Format gambar tidak didukung' }, { status: 400 })
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'Ukuran gambar maksimal 10MB' }, { status: 400 })
    }

    // Convert to base64
    const arrayBuffer = await file.arrayBuffer()
    const base64 = Buffer.from(arrayBuffer).toString('base64')

    // Call Gemini Vision
    const model = ai.models.generateContent
      ? ai.models
      : ai

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
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

    const text = response.candidates?.[0]?.content?.parts?.[0]?.text ?? ''

    // Parse JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return NextResponse.json({
        error: 'Gagal membaca struk. Pastikan gambar jelas dan cukup terang.',
      }, { status: 422 })
    }

    const extracted = JSON.parse(jsonMatch[0])

    return NextResponse.json({
      data: {
        amount: extracted.amount ?? null,
        date: extracted.date ?? null,
        description: extracted.description ?? extracted.merchant ?? null,
        merchant: extracted.merchant ?? null,
        category: extracted.category ?? null,
        type: extracted.type ?? 'EXPENSE',
        confidence: extracted.confidence ?? 0.5,
      },
      message: 'Struk berhasil dibaca',
    })
  } catch (err) {
    console.error('OCR error:', err)
    return NextResponse.json(
      { error: 'Gagal memproses gambar. Coba lagi.' },
      { status: 500 }
    )
  }
}