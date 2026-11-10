// lib/rate-limit.ts
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const redis = Redis.fromEnv()

// Auth: batasi percobaan register / login untuk mencegah brute force dan spam akun
export const authRateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '1 m'), // 5 request / menit / IP
  prefix: 'ratelimit:auth',
  analytics: true,
})

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
 * Terapkan rate limit untuk sebuah identifier (IP atau userId) pada limiter tertentu.
 * Jika Redis gagal/offline, fail-open secara graceful agar tidak memblokir pengguna normal.
 */
export async function checkRateLimit(
  limiter: Ratelimit,
  identifier: string
): Promise<RateLimitResult> {
  try {
    const { success, remaining, reset } = await limiter.limit(identifier)
    return { success, remaining, reset }
  } catch (error) {
    console.error('[RateLimit Error] Failed to connect to Redis, failing open:', error)
    // Fail open agar downtime Redis tidak merusak core availability aplikasi
    return {
      success: true,
      remaining: 1,
      reset: Date.now(),
    }
  }
}
