// lib/supabase.ts
// Supabase client for Storage operations only
// Database operations still use Prisma

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Server-side client with service role (bypasses RLS — used in API routes)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false },
})

// Bucket name
export const RECEIPTS_BUCKET = 'receipts'

// Generate signed URL for private file access (expires in 1 hour)
export async function getSignedReceiptUrl(path: string): Promise<string | null> {
  const { data, error } = await supabaseAdmin.storage
    .from(RECEIPTS_BUCKET)
    .createSignedUrl(path, 3600)

  if (error || !data) return null
  return data.signedUrl
}

// Delete a receipt file
export async function deleteReceiptFile(path: string): Promise<boolean> {
  const { error } = await supabaseAdmin.storage
    .from(RECEIPTS_BUCKET)
    .remove([path])

  return !error
}