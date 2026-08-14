// lib/rate-limit.ts
// P0.3: Sebelumnya endpoint /api/ai/insight dan /api/ocr (memanggil Gemini
// API berbayar) tidak punya rate limit sama sekali — user yang sudah login
// bisa spam request tanpa batas. Pakai Upstash Redis (bukan in-memory)
// karena Vercel bisa menjalankan banyak instance/edge region sekaligus;
// in-memory counter tidak akan konsisten lintas instance.
//
// Setup: buat database di upstash.com (free tier cukup), lalu isi
// UPSTASH_REDIS_REST_URL & UPSTASH_REDIS_REST_TOKEN di .env.local

import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const redis = Redis.fromEnv()

// OCR scan struk: operasi mahal (vision model), batasi ketat.
export const ocrRateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '1 m'), // 5 scan / menit / user
  prefix: 'ratelimit:ocr',
  analytics: true,
})

// AI insight sudah di-cache per bulan di DB, tapi tetap batasi endpoint-nya
// untuk mencegah abuse sebelum cache ke-set (mis. race condition spam klik).
export const aiInsightRateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '1 h'), // 10 request / jam / user
  prefix: 'ratelimit:ai-insight',
  analytics: true,
})

export interface RateLimitResult {
  success: boolean
  remaining: number
  reset: number
}

/**
 * Terapkan rate limit untuk sebuah user pada limiter tertentu.
 * Mengembalikan objek yang bisa langsung dipakai untuk response 429.
 */
export async function checkRateLimit(
  limiter: Ratelimit,
  identifier: string
): Promise<RateLimitResult> {
  const { success, remaining, reset } = await limiter.limit(identifier)
  return { success, remaining, reset }
}