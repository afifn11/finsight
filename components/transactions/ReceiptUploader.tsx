// components/transactions/ReceiptUploader.tsx
'use client'

import { useState, useRef } from 'react'
import { Camera, Upload, X, FileText, Eye, Download, Loader2, ImageIcon, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'

interface Props {
  transactionId: string
  receiptName?: string | null
  receiptUrl?: string | null
  onUpdate: (data: { receiptName: string; receiptUrl: string } | null) => void
}

export function ReceiptUploader({ transactionId, receiptName, receiptUrl, onUpdate }: Props) {
  const [isUploading, setIsUploading] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)

  const hasReceipt = !!receiptName
  const isPdf = receiptName?.toLowerCase().endsWith('.pdf')

  async function handleFileSelect(file: File) {
    if (!file) return

    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'application/pdf']
    if (!allowed.includes(file.type)) {
      toast.error('Format tidak didukung. Gunakan JPG, PNG, WEBP, atau PDF.')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Ukuran file maksimal 5MB.')
      return
    }

    if (file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = (e) => setPreviewUrl(e.target?.result as string)
      reader.readAsDataURL(file)
    }

    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append('receipt', file)

      const res = await fetch(`/api/transactions/${transactionId}/receipt`, {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? 'Upload gagal')
      }

      const { data } = await res.json()
      onUpdate({ receiptName: data.receiptName, receiptUrl: data.receiptUrl })
      toast.success('Bukti transaksi berhasil disimpan')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal mengupload bukti')
      setPreviewUrl(null)
    } finally {
      setIsUploading(false)
    }
  }

  async function handleDelete() {
    setIsDeleting(true)
    try {
      const res = await fetch(`/api/transactions/${transactionId}/receipt`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Gagal menghapus')
      onUpdate(null)
      setPreviewUrl(null)
      toast.success('Bukti transaksi dihapus')
    } catch {
      toast.error('Gagal menghapus bukti transaksi')
    } finally {
      setIsDeleting(false)
    }
  }

  async function getFreshSignedUrl(): Promise<string | null> {
    try {
      const res = await fetch(`/api/transactions/${transactionId}/receipt`)
      if (!res.ok) throw new Error()
      const { data } = await res.json()
      return data.url ?? null
    } catch {
      return null
    }
  }

  async function handleView() {
    const url = await getFreshSignedUrl()
    if (url) {
      window.open(url, '_blank')
    } else {
      toast.error('Gagal membuka bukti transaksi')
    }
  }

  // ── Download handler ─────────────────────────────────────────
  // Fetch fresh signed URL → download via <a> element
  async function handleDownload() {
    setIsDownloading(true)
    try {
      const url = await getFreshSignedUrl()
      if (!url) throw new Error('URL tidak tersedia')

      // Fetch the file as blob so browser treats it as download (not navigation)
      const response = await fetch(url)
      if (!response.ok) throw new Error('Gagal mengunduh file')

      const blob = await response.blob()
      const objectUrl = URL.createObjectURL(blob)

      const a = document.createElement('a')
      a.href = objectUrl
      a.download = receiptName ?? `bukti-${transactionId}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(objectUrl)

      toast.success('Bukti berhasil diunduh')
    } catch {
      toast.error('Gagal mengunduh bukti transaksi')
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
        Bukti Transaksi
        <span className="ml-1 text-xs font-normal" style={{ color: 'var(--text-muted)' }}>
          (opsional)
        </span>
      </label>

      {hasReceipt ? (
        // ── Receipt exists ──────────────────────────────────────
        <div
          className="rounded-xl border p-3 space-y-2"
          style={{ borderColor: 'var(--border-default)', background: 'var(--bg-muted)' }}
        >
          {/* File info row */}
          <div className="flex items-center gap-3">
            {/* Thumbnail */}
            <div
              className="w-12 h-12 rounded-lg flex items-center justify-center shrink-0 overflow-hidden"
              style={{ background: 'var(--bg-card)' }}
            >
              {isPdf ? (
                <FileText className="w-6 h-6" style={{ color: 'var(--color-primary-600)' }} />
              ) : previewUrl || receiptUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={previewUrl ?? receiptUrl ?? ''}
                  alt="Receipt preview"
                  className="w-full h-full object-cover rounded-lg"
                  onError={() => setPreviewUrl(null)}
                />
              ) : (
                <ImageIcon className="w-6 h-6" style={{ color: 'var(--text-muted)' }} />
              )}
            </div>

            {/* Filename + type */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                {receiptName}
              </p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {isPdf ? 'PDF Document' : 'Gambar'}
              </p>
            </div>
          </div>

          {/* Action buttons row — full width, easier to tap on mobile */}
          <div className="grid grid-cols-4 gap-1.5">
            <button
              type="button"
              onClick={handleView}
              className="flex flex-col items-center justify-center gap-1 py-2 rounded-lg text-xs transition-colors hover:opacity-80"
              style={{ background: 'var(--bg-card)', color: 'var(--color-primary-600)' }}
              title="Lihat bukti"
            >
              <Eye className="w-4 h-4" />
              <span>Lihat</span>
            </button>

            <button
              type="button"
              onClick={handleDownload}
              disabled={isDownloading}
              className="flex flex-col items-center justify-center gap-1 py-2 rounded-lg text-xs transition-colors hover:opacity-80 disabled:opacity-50"
              style={{ background: 'var(--bg-card)', color: 'var(--color-success-600)' }}
              title="Unduh bukti"
            >
              {isDownloading
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <Download className="w-4 h-4" />
              }
              <span>{isDownloading ? '...' : 'Unduh'}</span>
            </button>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="flex flex-col items-center justify-center gap-1 py-2 rounded-lg text-xs transition-colors hover:opacity-80 disabled:opacity-50"
              style={{ background: 'var(--bg-card)', color: 'var(--text-secondary)' }}
              title="Ganti bukti"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Ganti</span>
            </button>

            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting}
              className="flex flex-col items-center justify-center gap-1 py-2 rounded-lg text-xs transition-colors hover:opacity-80 disabled:opacity-50"
              style={{ background: 'var(--bg-card)', color: 'var(--color-danger-500)' }}
              title="Hapus bukti"
            >
              {isDeleting
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <X className="w-4 h-4" />
              }
              <span>Hapus</span>
            </button>
          </div>
        </div>
      ) : (
        // ── No receipt — upload buttons ─────────────────────────
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-dashed text-sm transition-colors hover:opacity-80"
            style={{
              borderColor: 'var(--border-default)',
              color: 'var(--text-secondary)',
              background: 'var(--bg-muted)',
            }}
          >
            {isUploading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Upload className="w-4 h-4" />
            )}
            {isUploading ? 'Mengupload...' : 'Upload Bukti'}
          </button>

          <button
            type="button"
            onClick={() => cameraInputRef.current?.click()}
            disabled={isUploading}
            className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-dashed text-sm transition-colors hover:opacity-80"
            style={{
              borderColor: 'var(--border-default)',
              color: 'var(--text-secondary)',
              background: 'var(--bg-muted)',
            }}
            title="Foto dengan kamera"
          >
            <Camera className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic,application/pdf"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleFileSelect(file)
          e.target.value = ''
        }}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleFileSelect(file)
          e.target.value = ''
        }}
      />

      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
        JPG, PNG, WEBP, atau PDF • Maks. 5MB
      </p>
    </div>
  )
}