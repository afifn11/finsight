// app/api/transactions/[id]/receipt/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { supabaseAdmin, RECEIPTS_BUCKET, deleteReceiptFile } from '@/lib/supabase'
import type { ApiError } from '@/types'

const MAX_SIZE = 5 * 1024 * 1024 // 5MB

// P1.4: derive ekstensi dari MIME type yang sudah divalidasi server,
// bukan dari file.name (yang sepenuhnya dikontrol client).
const MIME_TO_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/heic': 'heic',
  'application/pdf': 'pdf',
}

type RouteParams = { params: Promise<{ id: string }> }

// ── POST /api/transactions/[id]/receipt — Upload receipt ───────
export async function POST(req: NextRequest, { params }: RouteParams) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json<ApiError>({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  // Verify transaction belongs to user
  const transaction = await prisma.transaction.findFirst({
    where: { id, userId: session.user.id },
  })
  if (!transaction) {
    return NextResponse.json<ApiError>({ error: 'Transaksi tidak ditemukan' }, { status: 404 })
  }

  const formData = await req.formData()
  const file = formData.get('receipt') as File | null

  if (!file) {
    return NextResponse.json<ApiError>({ error: 'File tidak ditemukan' }, { status: 400 })
  }

  const ext = MIME_TO_EXT[file.type]
  if (!ext) {
    return NextResponse.json<ApiError>(
      { error: 'Format file tidak didukung. Gunakan JPG, PNG, WEBP, atau PDF.' },
      { status: 400 }
    )
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json<ApiError>({ error: 'Ukuran file maksimal 5MB.' }, { status: 400 })
  }

  // Delete old receipt if exists
  if (transaction.receiptPath) {
    await deleteReceiptFile(transaction.receiptPath)
  }

  // Upload to Supabase Storage
  const filename = `receipt-${Date.now()}.${ext}`
  const storagePath = `${session.user.id}/${id}/${filename}`

  const arrayBuffer = await file.arrayBuffer()
  const { error: uploadError } = await supabaseAdmin.storage
    .from(RECEIPTS_BUCKET)
    .upload(storagePath, arrayBuffer, {
      contentType: file.type,
      upsert: true,
    })

  if (uploadError) {
    console.error('Upload error:', uploadError)
    return NextResponse.json<ApiError>({ error: 'Gagal mengupload file.' }, { status: 500 })
  }

  // Generate signed URL (1 hour)
  const { data: signedData } = await supabaseAdmin.storage
    .from(RECEIPTS_BUCKET)
    .createSignedUrl(storagePath, 3600)

  // Save path to DB
  const updated = await prisma.transaction.update({
    where: { id },
    data: {
      receiptPath: storagePath,
      receiptName: file.name,
      receiptUrl: signedData?.signedUrl ?? null,
    },
  })

  return NextResponse.json({
    data: {
      receiptPath: updated.receiptPath,
      receiptName: updated.receiptName,
      receiptUrl: signedData?.signedUrl,
    },
    message: 'Bukti transaksi berhasil diupload',
  })
}

// ── DELETE /api/transactions/[id]/receipt — Remove receipt ─────
export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json<ApiError>({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  const transaction = await prisma.transaction.findFirst({
    where: { id, userId: session.user.id },
  })
  if (!transaction) {
    return NextResponse.json<ApiError>({ error: 'Transaksi tidak ditemukan' }, { status: 404 })
  }

  if (transaction.receiptPath) {
    await deleteReceiptFile(transaction.receiptPath)
  }

  await prisma.transaction.update({
    where: { id },
    data: { receiptPath: null, receiptName: null, receiptUrl: null },
  })

  return NextResponse.json({ message: 'Bukti transaksi berhasil dihapus' })
}

// ── GET /api/transactions/[id]/receipt — Get signed URL ────────
export async function GET(_req: NextRequest, { params }: RouteParams) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json<ApiError>({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  const transaction = await prisma.transaction.findFirst({
    where: { id, userId: session.user.id },
    select: { receiptPath: true, receiptName: true },
  })

  if (!transaction?.receiptPath) {
    return NextResponse.json<ApiError>({ error: 'Tidak ada bukti transaksi' }, { status: 404 })
  }

  const { data } = await supabaseAdmin.storage
    .from(RECEIPTS_BUCKET)
    .createSignedUrl(transaction.receiptPath, 3600)

  return NextResponse.json({
    data: {
      url: data?.signedUrl,
      name: transaction.receiptName,
    },
  })
}