// components/transactions/OcrScanner.tsx
'use client'

import { useState, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Camera, ScanLine, X, Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { IconButton } from '@/components/ui/IconButton'

export interface OcrResult {
  amount: number | null
  date: string | null
  description: string | null
  merchant: string | null
  category: string | null
  type: 'INCOME' | 'EXPENSE'
  confidence: number
}

interface Props {
  onResult: (data: OcrResult) => void
  onClose: () => void
}

export function OcrScanner({ onResult, onClose }: Props) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const [result, setResult] = useState<OcrResult | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)

  // Full-resolution phone camera photos are commonly 3–8MB+, which can exceed
  // Vercel Serverless Functions' platform-level request body limit (~4.5MB) —
  // a limit enforced BEFORE the request even reaches app/api/ocr/route.ts's
  // own (larger) 10MB check. That produces a non-JSON platform error page
  // rather than our API's own JSON error, which is what caused the
  // "Unexpected token" parse errors. Resizing/compressing client-side keeps
  // uploads well under that limit and fixes the failure at the source,
  // rather than just handling it more gracefully after the fact.
  //
  // Uses createImageBitmap (decodes the File/Blob directly) rather than
  // loading into an <img src="blob:..."> — the latter requires `blob:` in
  // the site's img-src CSP directive, which this app deliberately doesn't
  // grant. createImageBitmap never touches img-src at all.
  async function compressImage(file: File, maxDimension = 1600, quality = 0.75): Promise<File> {
    try {
      const bitmap = await createImageBitmap(file)
      let { width, height } = bitmap
      if (width > maxDimension || height > maxDimension) {
        const scale = maxDimension / Math.max(width, height)
        width = Math.round(width * scale)
        height = Math.round(height * scale)
      }

      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      if (!ctx) return file
      ctx.drawImage(bitmap, 0, 0, width, height)
      bitmap.close()

      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, 'image/jpeg', quality)
      )
      if (!blob) return file
      return new File([blob], file.name.replace(/\.\w+$/, '.jpg'), { type: 'image/jpeg' })
    } catch {
      // Decode failed (e.g. unsupported format) — fall back to the original file
      // rather than blocking the scan entirely.
      return file
    }
  }

  async function processImage(rawFile: File) {
    if (!rawFile) return

    // Show preview (of the original file — no need to wait on compression for this)
    const reader = new FileReader()
    reader.onload = (e) => setPreview(e.target?.result as string)
    reader.readAsDataURL(rawFile)

    setIsProcessing(true)
    setResult(null)

    try {
      // PDFs can't be canvas-compressed — send as-is; images get resized/compressed.
      const file = rawFile.type === 'application/pdf' ? rawFile : await compressImage(rawFile)

      const formData = new FormData()
      formData.append('image', file)

      const res = await fetch('/api/ocr', { method: 'POST', body: formData })

      // Don't assume the response is JSON — a platform-level failure (e.g.
      // request too large, gateway timeout) returns a plain-text/HTML error
      // page, and calling res.json() directly on that throws a cryptic
      // "Unexpected token" SyntaxError instead of a useful message.
      const rawText = await res.text()
      let json: { data?: OcrResult; error?: string }
      try {
        json = JSON.parse(rawText)
      } catch {
        throw new Error(
          res.status === 413
            ? 'Ukuran gambar terlalu besar. Coba foto ulang atau gunakan gambar lain.'
            : `Gagal memproses gambar (${res.status}). Coba lagi.`
        )
      }

      if (!res.ok || !json.data) throw new Error(json.error ?? 'Gagal membaca struk')

      setResult(json.data)
      if (json.data.confidence < 0.4) {
        toast.warning('Kualitas gambar kurang baik, periksa hasil kembali')
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal memproses gambar')
    } finally {
      setIsProcessing(false)
    }
  }

  function handleUse() {
    if (!result) return
    onResult(result)
    onClose()
  }

  const confidenceColor =
    !result ? 'var(--text-muted)' :
    result.confidence >= 0.7 ? 'var(--color-income)' :
    result.confidence >= 0.4 ? 'var(--color-warning-text)' :
    'var(--color-danger-text)'

  const confidenceLabel =
    !result ? '' :
    result.confidence >= 0.7 ? 'Akurasi tinggi' :
    result.confidence >= 0.4 ? 'Akurasi sedang' :
    'Akurasi rendah'

  return createPortal(
    <div
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.6)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="card w-full max-w-sm" style={{ background: 'var(--bg-card)' }}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: 'var(--border-default)' }}>
          <div className="flex items-center gap-2">
            <ScanLine className="w-4 h-4" style={{ color: 'var(--color-primary-600)' }} />
            <h2 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
              Scan Struk
            </h2>
          </div>
          <IconButton aria-label="Tutup" onClick={onClose}>
            <X className="w-5 h-5" aria-hidden="true" />
          </IconButton>
        </div>

        <div className="p-4 space-y-4">
          {/* Image preview or upload area */}
          {preview ? (
            <div className="relative rounded-xl overflow-hidden" style={{ maxHeight: 200 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={preview} alt="Struk" className="w-full object-contain" style={{ maxHeight: 200 }} />
              {isProcessing && (
                <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ background: 'rgba(0,0,0,0.5)' }}>
                  <Loader2 className="w-8 h-8 animate-spin text-white mb-2" />
                  <p className="text-white text-sm font-medium">Membaca struk...</p>
                </div>
              )}
            </div>
          ) : (
            <div
              className="rounded-xl border-2 border-dashed flex flex-col items-center justify-center p-8 gap-3"
              style={{ borderColor: 'var(--border-default)', background: 'var(--bg-muted)' }}
            >
              <ScanLine className="w-10 h-10" style={{ color: 'var(--text-muted)' }} />
              <p className="text-sm text-center" style={{ color: 'var(--text-secondary)' }}>
                Foto atau upload struk untuk mengisi form otomatis
              </p>
            </div>
          )}

          {/* Upload buttons */}
          {!result && (
            <div className="flex gap-2">
              <button
                onClick={() => cameraInputRef.current?.click()}
                disabled={isProcessing}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-medium transition-colors hover:opacity-80 disabled:opacity-50"
                style={{ borderColor: 'var(--color-primary-600)', color: 'var(--color-primary-600)' }}
              >
                <Camera className="w-4 h-4" />
                Kamera
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessing}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-medium transition-colors hover:opacity-80 disabled:opacity-50"
                style={{ borderColor: 'var(--border-default)', color: 'var(--text-secondary)' }}
              >
                Upload foto
              </button>
            </div>
          )}

          {/* OCR Result */}
          {result && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                  Hasil scan
                </p>
                <div className="flex items-center gap-1.5">
                  {result.confidence >= 0.7
                    ? <CheckCircle className="w-3.5 h-3.5" style={{ color: confidenceColor }} />
                    : <AlertCircle className="w-3.5 h-3.5" style={{ color: confidenceColor }} />
                  }
                  <span className="text-xs" style={{ color: confidenceColor }}>{confidenceLabel}</span>
                </div>
              </div>

              <div className="rounded-xl p-3 space-y-2" style={{ background: 'var(--bg-muted)' }}>
                {result.merchant && (
                  <Row label="Merchant" value={result.merchant} />
                )}
                {result.description && (
                  <Row label="Deskripsi" value={result.description} />
                )}
                {result.amount && (
                  <Row label="Nominal" value={`Rp ${result.amount.toLocaleString('id-ID')}`} highlight />
                )}
                {result.date && (
                  <Row label="Tanggal" value={new Date(result.date).toLocaleDateString('id-ID')} />
                )}
                {result.category && (
                  <Row label="Kategori" value={result.category} />
                )}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => { setResult(null); setPreview(null) }}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium border transition-colors"
                  style={{ borderColor: 'var(--border-default)', color: 'var(--text-secondary)' }}
                >
                  Ulangi scan
                </button>
                <button
                  onClick={handleUse}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white transition-colors"
                  style={{ background: 'var(--color-primary-800)' }}
                >
                  Gunakan data ini
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Hidden inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) processImage(f); e.target.value = '' }}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) processImage(f); e.target.value = '' }}
      />
    </div>,
    document.body
  )
}

function Row({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-xs shrink-0" style={{ color: 'var(--text-muted)' }}>{label}</span>
      <span
        className="text-xs font-medium truncate text-right"
        style={{ color: highlight ? 'var(--color-primary-700)' : 'var(--text-primary)' }}
      >
        {value}
      </span>
    </div>
  )
}