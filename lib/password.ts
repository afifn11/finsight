// lib/password.ts
// Satu-satunya sumber kebenaran untuk hashing & verifikasi password.
// Dipakai bersama oleh register route dan NextAuth credentials provider —
// sebelumnya ada 2 implementasi berbeda (fixed salt vs random salt) yang
// menyebabkan login credentials tidak pernah berhasil untuk user manapun.

import crypto from 'crypto'

const KEY_LENGTH = 64

/**
 * Hash password dengan salt acak per-user.
 * Format output: "salt:hash" (keduanya hex-encoded).
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex')
  const hash = crypto.scryptSync(password, salt, KEY_LENGTH).toString('hex')
  return `${salt}:${hash}`
}

/**
 * Verifikasi password terhadap hash tersimpan.
 * Menggunakan timing-safe comparison untuk mencegah timing attack.
 */
export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(':')
  if (!salt || !hash) return false

  const testHash = crypto.scryptSync(password, salt, KEY_LENGTH)
  const storedHash = Buffer.from(hash, 'hex')

  // Panjang buffer harus sama sebelum timingSafeEqual, kalau tidak akan throw
  if (testHash.length !== storedHash.length) return false

  return crypto.timingSafeEqual(testHash, storedHash)
}