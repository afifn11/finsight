// components/shared/ExportButton.tsx
'use client'

import { useState } from 'react'
import { Download, FileText, Table, Loader2, ChevronDown, Paperclip } from 'lucide-react'
import { toast } from 'sonner'
import { formatCurrency } from '@/lib/utils'

interface ExportTransaction {
  date: string
  description: string
  category: string
  categoryColor: string
  type: string
  amount: number
  receiptName: string | null
  receiptUrl: string | null
}

interface ExportData {
  period: string
  generatedAt: string
  summary: {
    totalIncome: number
    totalExpense: number
    netBalance: number
    transactionCount: number
  }
  transactions: ExportTransaction[]
}

async function loadImageAsBase64(url: string): Promise<string | null> {
  try {
    const res = await fetch(url)
    if (!res.ok) return null
    const blob = await res.blob()
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result as string)
      reader.onerror = () => resolve(null)
      reader.readAsDataURL(blob)
    })
  } catch {
    return null
  }
}

export function ExportButton() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState<string | null>(null)

  async function handleCSV(period: string) {
    setLoading(`csv-${period}`)
    setOpen(false)
    try {
      const res = await fetch(`/api/export?type=csv&period=${period}`)
      if (!res.ok) throw new Error()
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `finsight-export.csv`
      a.click()
      URL.revokeObjectURL(url)
      toast.success('CSV berhasil didownload')
    } catch {
      toast.error('Gagal export CSV')
    } finally {
      setLoading(null)
    }
  }

  async function handlePDF(period: string) {
    setLoading(`pdf-${period}`)
    setOpen(false)
    try {
      const res = await fetch(`/api/export?type=pdf&period=${period}`)
      if (!res.ok) throw new Error()
      const data: ExportData = await res.json() as ExportData

      const { default: jsPDF } = await import('jspdf')
      const { default: autoTable } = await import('jspdf-autotable')

      const doc = new jsPDF()
      const pageWidth = doc.internal.pageSize.getWidth()
      const pageHeight = doc.internal.pageSize.getHeight()

      // ── Header ──────────────────────────────────────────────
      doc.setFillColor(15, 76, 117)
      doc.rect(0, 0, pageWidth, 35, 'F')
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(20)
      doc.setFont('helvetica', 'bold')
      doc.text('FinSight', 14, 15)
      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      doc.text(`Laporan Keuangan — ${data.period}`, 14, 24)
      doc.text(`Dibuat: ${new Date(data.generatedAt).toLocaleDateString('id-ID')}`, 14, 31)

      const receiptCount = data.transactions.filter((t) => t.receiptUrl).length
      if (receiptCount > 0) {
        doc.setFontSize(8)
        doc.text(`${receiptCount} bukti transaksi terlampir`, pageWidth - 14, 31, { align: 'right' })
      }

      // ── Summary ─────────────────────────────────────────────
      doc.setTextColor(30, 41, 59)
      doc.setFontSize(12)
      doc.setFont('helvetica', 'bold')
      doc.text('Ringkasan', 14, 48)

      autoTable(doc, {
        startY: 52,
        body: [
          ['Total Pemasukan', formatCurrency(data.summary.totalIncome)],
          ['Total Pengeluaran', formatCurrency(data.summary.totalExpense)],
          ['Saldo Bersih', formatCurrency(data.summary.netBalance)],
          ['Jumlah Transaksi', `${data.summary.transactionCount} transaksi`],
        ],
        theme: 'plain',
        styles: { fontSize: 10, cellPadding: 3 },
        columnStyles: { 0: { fontStyle: 'bold', cellWidth: 60 }, 1: { halign: 'right' } },
        alternateRowStyles: { fillColor: [241, 245, 249] },
      })

      // ── Transactions table ───────────────────────────────────
      const tableStartY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10
      doc.setFontSize(12)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(30, 41, 59)
      doc.text('Detail Transaksi', 14, tableStartY)

      autoTable(doc, {
        startY: tableStartY + 4,
        head: [['Tanggal', 'Deskripsi', 'Kategori', 'Tipe', 'Nominal', '📎']],
        body: data.transactions.map((tx) => [
          tx.date,
          tx.description,
          tx.category,
          tx.type === 'INCOME' ? 'Pemasukan' : 'Pengeluaran',
          formatCurrency(tx.amount),
          tx.receiptName ? '✓' : '—',
        ]),
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [15, 76, 117], textColor: 255 },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        columnStyles: {
          0: { cellWidth: 24 },
          3: { cellWidth: 22 },
          4: { halign: 'right', cellWidth: 30 },
          5: { halign: 'center', cellWidth: 12 },
        },
        didParseCell: (hookData) => {
          if (hookData.column.index === 3 && hookData.section === 'body') {
            const val = hookData.cell.raw as string
            hookData.cell.styles.textColor = val === 'Pemasukan' ? [5, 150, 105] : [220, 38, 38]
          }
          if (hookData.column.index === 5 && hookData.section === 'body') {
            if ((hookData.cell.raw as string) === '✓') {
              hookData.cell.styles.textColor = [5, 150, 105]
              hookData.cell.styles.fontStyle = 'bold'
            }
          }
        },
      })

      // ── Receipt Appendix ─────────────────────────────────────
      const imgReceipts = data.transactions.filter(
        (tx) => tx.receiptUrl && !tx.receiptName?.toLowerCase().endsWith('.pdf')
      )

      if (imgReceipts.length > 0) {
        toast.loading(`Memuat ${imgReceipts.length} bukti transaksi...`, { id: 'receipt-load' })

        const loaded = await Promise.all(
          imgReceipts.map(async (tx) => ({
            tx,
            base64: tx.receiptUrl ? await loadImageAsBase64(tx.receiptUrl) : null,
          }))
        )
        toast.dismiss('receipt-load')

        const valid = loaded.filter((r) => r.base64 !== null)

        if (valid.length > 0) {
          doc.addPage()
          doc.setFillColor(15, 76, 117)
          doc.rect(0, 0, pageWidth, 20, 'F')
          doc.setTextColor(255, 255, 255)
          doc.setFontSize(14)
          doc.setFont('helvetica', 'bold')
          doc.text('Lampiran — Bukti Transaksi', 14, 13)

          let yPos = 28

          for (const { tx, base64 } of valid) {
            if (!base64) continue

            if (yPos > pageHeight - 115) {
              doc.addPage()
              yPos = 14
            }

            // Transaction info card
            doc.setFillColor(241, 245, 249)
            doc.roundedRect(12, yPos, pageWidth - 24, 16, 2, 2, 'F')
            doc.setTextColor(30, 41, 59)
            doc.setFontSize(9)
            doc.setFont('helvetica', 'bold')
            doc.text(tx.description, 16, yPos + 6)
            doc.setFont('helvetica', 'normal')
            doc.setFontSize(8)
            doc.setTextColor(100, 116, 139)
            doc.text(`${tx.date}  •  ${tx.category}  •  ${formatCurrency(tx.amount)}`, 16, yPos + 12)

            // Type badge
            const isIncome = tx.type === 'INCOME'
            if (isIncome) {
              doc.setFillColor(5, 150, 105)
            } else {
              doc.setFillColor(220, 38, 38)
            }
            doc.roundedRect(pageWidth - 40, yPos + 4, 26, 7, 1, 1, 'F')
            doc.setTextColor(255, 255, 255)
            doc.setFontSize(7)
            doc.text(isIncome ? 'Pemasukan' : 'Pengeluaran', pageWidth - 37, yPos + 8.5)

            yPos += 20

            // Receipt image
            try {
              const imgMaxW = pageWidth - 28
              const imgMaxH = 85

              const imgDims = await new Promise<{ w: number; h: number }>((resolve) => {
                const img = new Image()
                img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight })
                img.onerror = () => resolve({ w: imgMaxW, h: imgMaxH })
                img.src = base64
              })

              const ratio = imgDims.w / imgDims.h
              let imgW = imgMaxW
              let imgH = imgW / ratio
              if (imgH > imgMaxH) { imgH = imgMaxH; imgW = imgH * ratio }

              const imgX = 14 + (imgMaxW - imgW) / 2

              doc.setDrawColor(226, 232, 240)
              doc.setLineWidth(0.3)
              doc.roundedRect(imgX - 1, yPos - 1, imgW + 2, imgH + 2, 2, 2, 'S')
              doc.addImage(base64, 'JPEG', imgX, yPos, imgW, imgH)

              yPos += imgH + 4
              doc.setFontSize(7)
              doc.setTextColor(148, 163, 184)
              doc.text(tx.receiptName ?? '', pageWidth / 2, yPos, { align: 'center' })
              yPos += 10
            } catch {
              doc.setFillColor(248, 250, 252)
              doc.roundedRect(14, yPos, pageWidth - 28, 25, 2, 2, 'F')
              doc.setTextColor(148, 163, 184)
              doc.setFontSize(8)
              doc.text('Gagal memuat gambar bukti', pageWidth / 2, yPos + 14, { align: 'center' })
              yPos += 33
            }
          }
        }
      }

      // ── Footer ───────────────────────────────────────────────
      const pageCount = doc.getNumberOfPages()
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i)
        doc.setFontSize(8)
        doc.setTextColor(148, 163, 184)
        doc.text(
          `FinSight — getfinsight.vercel.app  |  Halaman ${i} dari ${pageCount}`,
          pageWidth / 2,
          pageHeight - 8,
          { align: 'center' }
        )
      }

      doc.save(`finsight-${data.period.replace(/\s/g, '-')}.pdf`)
      toast.success('PDF berhasil didownload')
    } catch (err) {
      console.error(err)
      toast.error('Gagal export PDF')
    } finally {
      setLoading(null)
    }
  }

  const isLoading = loading !== null

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        disabled={isLoading}
        className="flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-colors hover:opacity-80 disabled:opacity-50"
        style={{
          borderColor: 'var(--border-default)',
          background: 'var(--bg-card)',
          color: 'var(--text-secondary)',
        }}
      >
        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
        Export
        <ChevronDown className="w-3.5 h-3.5" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div
            className="absolute right-0 top-full mt-1 z-20 w-56 rounded-xl border overflow-hidden"
            style={{
              background: 'var(--bg-card)',
              borderColor: 'var(--border-default)',
              boxShadow: 'var(--shadow-dropdown)',
            }}
          >
            <div className="px-3 py-2 border-b" style={{ borderColor: 'var(--border-default)' }}>
              <p className="text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>CSV</p>
            </div>
            {(['current', 'last3'] as const).map((period) => (
              <button key={`csv-${period}`} onClick={() => handleCSV(period)}
                className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-left hover:opacity-80"
                style={{ color: 'var(--text-primary)' }}>
                <Table className="w-3.5 h-3.5" style={{ color: 'var(--color-success-600)' }} />
                {period === 'current' ? 'Bulan ini' : '3 bulan terakhir'}
              </button>
            ))}

            <div className="px-3 py-2 border-t border-b" style={{ borderColor: 'var(--border-default)' }}>
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>PDF</p>
                <div className="flex items-center gap-1">
                  <Paperclip className="w-3 h-3" style={{ color: 'var(--color-success-600)' }} />
                  <span className="text-[10px]" style={{ color: 'var(--color-success-600)' }}>incl. bukti</span>
                </div>
              </div>
            </div>
            {(['current', 'last3'] as const).map((period) => (
              <button key={`pdf-${period}`} onClick={() => handlePDF(period)}
                className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-left hover:opacity-80"
                style={{ color: 'var(--text-primary)' }}>
                <FileText className="w-3.5 h-3.5" style={{ color: 'var(--color-danger-500)' }} />
                {period === 'current' ? 'Bulan ini' : '3 bulan terakhir'}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}