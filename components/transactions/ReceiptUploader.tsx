// components/transactions/ReceiptUploader.tsx
'use client'

import { useState, useRef } from 'react'
import { Camera, Upload, X, FileText, Eye, Loader2, ImageIcon } from 'lucide-react'
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
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)

  const hasReceipt = !!receiptName

  async function handleFileSelect(file: File) {
    if (!file) return

    // Client-side validation
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'application/pdf']
    if (!allowed.includes(file.type)) {
      toast.error('Format tidak didukung. Gunakan JPG, PNG, WEBP, atau PDF.')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Ukuran file maksimal 5MB.')
      return
    }

    // Show local preview for images
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
      const res = await fetch(`/api/transactions/${transactionId}/receipt`, {
        method: 'DELETE',
      })
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

  async function handleView() {
    try {
      const res = await fetch(`/api/transactions/${transactionId}/receipt`)
      if (!res.ok) throw new Error()
      const { data } = await res.json()
      if (data.url) window.open(data.url, '_blank')
    } catch {
      toast.error('Gagal membuka bukti transaksi')
    }
  }

  const isPdf = receiptName?.toLowerCase().endsWith('.pdf')

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
        Bukti Transaksi
        <span className="ml-1 text-xs font-normal" style={{ color: 'var(--text-muted)' }}>
          (opsional)
        </span>
      </label>

      {hasReceipt ? (
        // Receipt exists — show preview + actions
        <div
          className="rounded-xl border p-3 flex items-center gap-3"
          style={{ borderColor: 'var(--border-default)', background: 'var(--bg-muted)' }}
        >
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

          {/* Filename */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
              {receiptName}
            </p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {isPdf ? 'PDF Document' : 'Gambar'}
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={handleView}
              className="p-1.5 rounded-lg transition-colors hover:opacity-70"
              style={{ color: 'var(--color-primary-600)' }}
              title="Lihat bukti"
            >
              <Eye className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-1.5 rounded-lg transition-colors hover:opacity-70"
              style={{ color: 'var(--text-muted)' }}
              title="Ganti bukti"
            >
              <Upload className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting}
              className="p-1.5 rounded-lg transition-colors hover:opacity-70"
              style={{ color: 'var(--color-danger-500)' }}
              title="Hapus bukti"
            >
              {isDeleting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <X className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      ) : (
        // No receipt — upload buttons
        <div className="flex gap-2">
          {/* Upload from file */}
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

          {/* Capture from camera (mobile) */}
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