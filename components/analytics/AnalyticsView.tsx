// components/analytics/AnalyticsView.tsx
'use client'

import { useState, useRef } from 'react'
import html2canvas from 'html2canvas-pro'
import { jsPDF } from 'jspdf'
import { toast } from 'sonner'
import { useDashboard } from '@/hooks'
import { formatCurrencyShort, formatCurrency, formatPercentage } from '@/lib/utils'
import { MonthlyBarChart } from '@/components/dashboard/MonthlyBarChart'
import { ChartSkeleton } from '@/components/dashboard/ChartSkeleton'
import { DataError } from '@/components/ui/DataError'
import { PdfReportTemplate } from './PdfReportTemplate'
import {
  TrendingUp,
  ArrowDownLeft,
  ArrowUpRight,
  DollarSign,
  Calendar,
  Download,
  Loader2,
} from 'lucide-react'
import type { MonthlySummary } from '@/types'

type TimeRange = '1M' | '3M' | '6M' | 'YTD'

export function AnalyticsView() {
  const { data, isLoading, error, refresh } = useDashboard()
  const [timeRange, setTimeRange] = useState<TimeRange>('6M')
  const [isExporting, setIsExporting] = useState(false)
  const pdfTemplateRef = useRef<HTMLDivElement>(null)

  const handleDownloadPDF = async () => {
    if (!pdfTemplateRef.current || isExporting) return
    setIsExporting(true)

    try {
      const canvas = await html2canvas(pdfTemplateRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        windowWidth: 850,
        onclone: (clonedDoc) => {
          const wrapper = clonedDoc.getElementById('pdf-offscreen-wrapper')
          if (wrapper) {
            wrapper.style.position = 'static'
            wrapper.style.left = '0'
            wrapper.style.top = '0'
            wrapper.style.opacity = '1'
            wrapper.style.visibility = 'visible'
            wrapper.style.display = 'block'
          }

          const pdfContainer = clonedDoc.getElementById('pdf-report-template')
          if (pdfContainer) {
            pdfContainer.style.color = '#09090b'
            pdfContainer.style.backgroundColor = '#ffffff'
          }

          // Sanitize <style> tags to prevent any unsupported modern color syntax issues
          const styleTags = clonedDoc.querySelectorAll('style')
          styleTags.forEach((style) => {
            try {
              if (
                style.innerHTML.includes('lab(') ||
                style.innerHTML.includes('oklch(') ||
                style.innerHTML.includes('oklab(') ||
                style.innerHTML.includes('lch(') ||
                style.innerHTML.includes('hwb(')
              ) {
                style.innerHTML = style.innerHTML
                  .replace(/oklch\([^)]+\)/gi, '#64748b')
                  .replace(/oklab\([^)]+\)/gi, '#64748b')
                  .replace(/lab\([^)]+\)/gi, '#64748b')
                  .replace(/lch\([^)]+\)/gi, '#64748b')
                  .replace(/hwb\([^)]+\)/gi, '#64748b')
              }
            } catch (e) {}
          })
        },
      })

      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF('p', 'mm', 'a4')
      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = pdf.internal.pageSize.getHeight()
      const imgWidth = canvas.width
      const imgHeight = canvas.height

      // Fit to full A4 width
      const printWidth = pdfWidth
      const printHeight = (imgHeight * printWidth) / imgWidth

      let heightLeft = printHeight
      let position = 0

      pdf.addImage(imgData, 'PNG', 0, position, printWidth, printHeight)
      heightLeft -= pdfHeight

      // Multi-page handling if document exceeds one A4 page
      while (heightLeft > 0) {
        position = heightLeft - printHeight
        pdf.addPage()
        pdf.addImage(imgData, 'PNG', 0, position, printWidth, printHeight)
        heightLeft -= pdfHeight
      }

      pdf.save(`FinSight-Laporan-${new Date().toISOString().slice(0, 10)}.pdf`)
      toast.success('Laporan PDF berhasil diunduh!')
    } catch (err) {
      console.error('[PDF_EXPORT_ERROR]', err)
      toast.error('Gagal mengunduh laporan PDF')
    } finally {
      setIsExporting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <ChartSkeleton height={260} titleWidth={176} />
        <ChartSkeleton height={260} titleWidth={176} />
      </div>
    )
  }

  if (error) {
    return (
      <div className="glass-card p-5">
        <DataError message={error} onRetry={refresh} />
      </div>
    )
  }

  const rawTrend = data?.monthlyTrend ?? []
  const breakdown = data?.categoryBreakdown ?? []

  // Filter trend by selected time range
  let filteredTrend: MonthlySummary[] = rawTrend
  if (timeRange === '1M') {
    filteredTrend = rawTrend.slice(-1)
  } else if (timeRange === '3M') {
    filteredTrend = rawTrend.slice(-3)
  } else if (timeRange === '6M') {
    filteredTrend = rawTrend.slice(-6)
  } else if (timeRange === 'YTD') {
    const currentYear = new Date().getFullYear()
    filteredTrend = rawTrend.filter((t) => t.year === currentYear)
    if (filteredTrend.length === 0) filteredTrend = rawTrend.slice(-6)
  }

  // Aggregate metrics for the filtered period
  const totalIncome = filteredTrend.reduce((sum, item) => sum + item.income, 0)
  const totalExpense = filteredTrend.reduce((sum, item) => sum + item.expense, 0)
  const netSavings = totalIncome - totalExpense
  const savingsRate =
    totalIncome > 0 ? Math.round(((totalIncome - totalExpense) / totalIncome) * 100) : 0

  return (
    <div className="space-y-6">
      {/* Time Range Selector & Download PDF Action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/80">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-lime-600 dark:text-lime-400" />
          <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            Rentang Waktu Analisis
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-3 self-start sm:self-auto">
          <div className="flex items-center p-1 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs">
            {(['1M', '3M', '6M', 'YTD'] as TimeRange[]).map((range) => (
              <button
                key={range}
                type="button"
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                  timeRange === range
                    ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
                }`}
              >
                {range}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={handleDownloadPDF}
            disabled={isExporting}
            className="bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {isExporting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            <span>Download PDF</span>
          </button>
        </div>
      </div>

      {/* KPI Metric Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/80 p-4 rounded-xl space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
            <ArrowDownLeft className="w-3.5 h-3.5 text-lime-600" />
            <span>Total Pemasukan</span>
          </div>
          <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            {formatCurrencyShort(totalIncome)}
          </p>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/80 p-4 rounded-xl space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
            <ArrowUpRight className="w-3.5 h-3.5 text-rose-600" />
            <span>Total Pengeluaran</span>
          </div>
          <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            {formatCurrencyShort(totalExpense)}
          </p>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/80 p-4 rounded-xl space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
            <DollarSign className="w-3.5 h-3.5 text-lime-600" />
            <span>Saldo Bersih</span>
          </div>
          <p
            className={`text-2xl font-bold ${
              netSavings >= 0 ? 'text-lime-600 dark:text-lime-400' : 'text-rose-600 dark:text-rose-400'
            }`}
          >
            {formatCurrencyShort(netSavings)}
          </p>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/80 p-4 rounded-xl space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
            <TrendingUp className="w-3.5 h-3.5 text-lime-600" />
            <span>Saving Rate</span>
          </div>
          <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            {savingsRate}%
          </p>
        </div>
      </div>

      {/* Charts Bento Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Cashflow Comparison Bar Chart */}
        <div className="lg:col-span-7 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/80 p-5 md:p-6 rounded-2xl">
          <div className="mb-4">
            <h3 className="font-semibold text-sm sm:text-base text-zinc-900 dark:text-zinc-100">
              Arus Kas Bulanan ({timeRange})
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Perbandingan pemasukan vs pengeluaran antar bulan
            </p>
          </div>
          <MonthlyBarChart trend={filteredTrend} />
        </div>

        {/* Category Breakdown Table */}
        <div className="lg:col-span-5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/80 p-5 md:p-6 rounded-2xl">
          <div className="mb-4">
            <h3 className="font-semibold text-sm sm:text-base text-zinc-900 dark:text-zinc-100">
              Komposisi Pengeluaran
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Alokasi pengeluaran per kategori bulan ini
            </p>
          </div>

          {breakdown.length === 0 ? (
            <p className="text-xs text-center py-8 text-zinc-400">
              Belum ada data pengeluaran tercatat
            </p>
          ) : (
            <div className="space-y-3">
              {breakdown.map((cat) => (
                <div key={cat.categoryId} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 truncate">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ background: cat.categoryColor }}
                      />
                      <span className="font-medium text-zinc-900 dark:text-zinc-100 truncate">
                        {cat.categoryName}
                      </span>
                      <span className="text-[10px] text-zinc-400">
                        ({cat.transactionCount}x)
                      </span>
                    </div>
                    <div className="flex items-center gap-2.5 shrink-0">
                      <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                        {formatCurrencyShort(cat.total)}
                      </span>
                      <span className="text-[11px] font-medium text-zinc-400 w-9 text-right">
                        {formatPercentage(cat.percentage)}
                      </span>
                    </div>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{ width: `${cat.percentage}%`, background: cat.categoryColor }}
                    />
                  </div>
                </div>
              ))}

              <div className="flex items-center justify-between pt-3 mt-2 border-t border-zinc-200 dark:border-zinc-800/80 text-xs font-semibold">
                <span className="text-zinc-900 dark:text-zinc-100">Total Pengeluaran</span>
                <span className="text-rose-600 dark:text-rose-400">
                  {formatCurrency(breakdown.reduce((s, c) => s + c.total, 0))}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Off-screen Dedicated Executive PDF Document Render Container */}
      <div
        id="pdf-offscreen-wrapper"
        aria-hidden="true"
        className="fixed -left-[9999px] top-0 pointer-events-none select-none overflow-hidden"
      >
        <PdfReportTemplate
          ref={pdfTemplateRef}
          timeRange={timeRange}
          totalIncome={totalIncome}
          totalExpense={totalExpense}
          netSavings={netSavings}
          savingsRate={savingsRate}
          filteredTrend={filteredTrend}
          breakdown={breakdown}
        />
      </div>
    </div>
  )
}
