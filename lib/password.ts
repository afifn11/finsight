// lib/password.ts
// Satu-satunya sumber kebenaran untuk hashing & verifikasi password.
// Dipakai bersama oleh register route dan NextAuth credentials provider.
// Menggunakan asynchronous scrypt via promisify agar tidak memblokir event loop Node.js (mencegah DoS).

import crypto from 'crypto'
import { promisify } from 'util'

const scryptAsync = promisify(crypto.scrypt)
const KEY_LENGTH = 64

/**
 * Hash password secara asynchronous dengan salt acak per-user.
 * Format output: "salt:hash" (keduanya hex-encoded).
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomBytes(16).toString('hex')
  const derivedKey = (await scryptAsync(password, salt, KEY_LENGTH)) as Buffer
  return `${salt}:${derivedKey.toString('hex')}`
}

/**
 * Verifikasi password terhadap hash tersimpan secara asynchronous.
 * Menggunakan timingSafeEqual untuk mencegah timing attack.
 */
export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [salt, hash] = stored.split(':')
  if (!salt || !hash) return false

  const storedHash = Buffer.from(hash, 'hex')
  const testHash = (await scryptAsync(password, salt, KEY_LENGTH)) as Buffer

  // Panjang buffer harus sama sebelum timingSafeEqual, kalau tidak akan throw
  if (testHash.length !== storedHash.length) return false

  return crypto.timingSafeEqual(testHash, storedHash)
}
