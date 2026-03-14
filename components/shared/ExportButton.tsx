// components/shared/ExportButton.tsx
'use client'

import { useState } from 'react'
import { Download, FileText, Table, Loader2, ChevronDown } from 'lucide-react'
import { toast } from 'sonner'
import { formatCurrency } from '@/lib/utils'

interface ExportData {
  period: string
  generatedAt: string
  summary: {
    totalIncome: number
    totalExpense: number
    netBalance: number
    transactionCount: number
  }
  transactions: Array<{
    date: string
    description: string
    category: string
    type: string
    amount: number
  }>
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

      // Dynamically import jsPDF (client-side only)
      const { default: jsPDF } = await import('jspdf')
      const { default: autoTable } = await import('jspdf-autotable')

      const doc = new jsPDF()
      const pageWidth = doc.internal.pageSize.getWidth()

      // Header
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

      // Summary cards
      doc.setTextColor(30, 41, 59)
      doc.setFontSize(12)
      doc.setFont('helvetica', 'bold')
      doc.text('Ringkasan', 14, 48)

      const summaryData = [
        ['Total Pemasukan', formatCurrency(data.summary.totalIncome)],
        ['Total Pengeluaran', formatCurrency(data.summary.totalExpense)],
        ['Saldo Bersih', formatCurrency(data.summary.netBalance)],
        ['Jumlah Transaksi', `${data.summary.transactionCount} transaksi`],
      ]

      autoTable(doc, {
        startY: 52,
        body: summaryData,
        theme: 'plain',
        styles: { fontSize: 10, cellPadding: 3 },
        columnStyles: {
          0: { fontStyle: 'bold', cellWidth: 60 },
          1: { halign: 'right' },
        },
        alternateRowStyles: { fillColor: [241, 245, 249] },
      })

      // Transactions table
      const finalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10
      doc.setFontSize(12)
      doc.setFont('helvetica', 'bold')
      doc.text('Detail Transaksi', 14, finalY)

      autoTable(doc, {
        startY: finalY + 4,
        head: [['Tanggal', 'Deskripsi', 'Kategori', 'Tipe', 'Nominal']],
        body: data.transactions.map((tx) => [
          tx.date,
          tx.description,
          tx.category,
          tx.type === 'INCOME' ? 'Pemasukan' : 'Pengeluaran',
          formatCurrency(tx.amount),
        ]),
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [15, 76, 117], textColor: 255 },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        columnStyles: {
          0: { cellWidth: 24 },
          4: { halign: 'right' },
        },
        didDrawCell: (hookData) => {
          // Color income/expense rows
          if (hookData.column.index === 3 && hookData.section === 'body') {
            const val = hookData.cell.text[0]
            doc.setTextColor(val === 'Pemasukan' ? '#059669' : '#dc2626')
          }
        },
      })

      // Footer
      const pageCount = doc.getNumberOfPages()
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i)
        doc.setFontSize(8)
        doc.setTextColor(148, 163, 184)
        doc.text(
          `FinSight — finsight.vercel.app | Halaman ${i} dari ${pageCount}`,
          pageWidth / 2,
          doc.internal.pageSize.getHeight() - 8,
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
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Download className="w-4 h-4" />
        )}
        Export
        <ChevronDown className="w-3.5 h-3.5" />
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setOpen(false)}
          />
          {/* Dropdown */}
          <div
            className="absolute right-0 top-full mt-1 z-20 w-52 rounded-xl border shadow-lg overflow-hidden"
            style={{ background: 'var(--bg-card)', borderColor: 'var(--border-default)' }}
          >
            {/* CSV section */}
            <div className="px-3 py-2 border-b" style={{ borderColor: 'var(--border-default)' }}>
              <p className="text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
                CSV
              </p>
            </div>
            <button
              onClick={() => handleCSV('current')}
              className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-left hover:opacity-80"
              style={{ color: 'var(--text-primary)' }}
            >
              <Table className="w-3.5 h-3.5" style={{ color: 'var(--color-success-600)' }} />
              Bulan ini
            </button>
            <button
              onClick={() => handleCSV('last3')}
              className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-left hover:opacity-80"
              style={{ color: 'var(--text-primary)' }}
            >
              <Table className="w-3.5 h-3.5" style={{ color: 'var(--color-success-600)' }} />
              3 bulan terakhir
            </button>

            {/* PDF section */}
            <div
              className="px-3 py-2 border-t border-b"
              style={{ borderColor: 'var(--border-default)' }}
            >
              <p className="text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
                PDF
              </p>
            </div>
            <button
              onClick={() => handlePDF('current')}
              className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-left hover:opacity-80"
              style={{ color: 'var(--text-primary)' }}
            >
              <FileText className="w-3.5 h-3.5" style={{ color: 'var(--color-danger-500)' }} />
              Bulan ini
            </button>
            <button
              onClick={() => handlePDF('last3')}
              className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-left hover:opacity-80"
              style={{ color: 'var(--text-primary)' }}
            >
              <FileText className="w-3.5 h-3.5" style={{ color: 'var(--color-danger-500)' }} />
              3 bulan terakhir
            </button>
          </div>
        </>
      )}
    </div>
  )
}
