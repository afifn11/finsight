// components/dashboard/AnalyticsView.tsx
'use client'

import { useState } from 'react'
import { useDashboard } from '@/hooks'
import { formatCurrencyShort, formatCurrency, formatPercentage } from '@/lib/utils'
import { MonthlyBarChart } from './MonthlyBarChart'
import { ChartSkeleton } from './ChartSkeleton'
import { DataError } from '@/components/ui/DataError'
import { TrendingUp, ArrowDownLeft, ArrowUpRight, DollarSign, Calendar } from 'lucide-react'
import type { MonthlySummary } from '@/types'

type TimeRange = '1M' | '3M' | '6M' | 'YTD'

export function AnalyticsView() {
  const { data, isLoading, error, refresh } = useDashboard()
  const [timeRange, setTimeRange] = useState<TimeRange>('6M')

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
      {/* Time Range Selector & KPI Cards */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-5 rounded-2xl glass-card">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100">
            Rentang Waktu Analisis
          </span>
        </div>

        <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs self-start sm:self-auto">
          {(['1M', '3M', '6M', 'YTD'] as TimeRange[]).map((range) => (
            <button
              key={range}
              type="button"
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                timeRange === range
                  ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Metric Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-card p-4 rounded-xl space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-600" />
            <span>Total Pemasukan</span>
          </div>
          <p className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
            {formatCurrencyShort(totalIncome)}
          </p>
        </div>

        <div className="glass-card p-4 rounded-xl space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <ArrowUpRight className="w-3.5 h-3.5 text-rose-600" />
            <span>Total Pengeluaran</span>
          </div>
          <p className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
            {formatCurrencyShort(totalExpense)}
          </p>
        </div>

        <div className="glass-card p-4 rounded-xl space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
            <span>Saldo Bersih</span>
          </div>
          <p
            className={`text-base sm:text-lg font-bold ${
              netSavings >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
            }`}
          >
            {formatCurrencyShort(netSavings)}
          </p>
        </div>

        <div className="glass-card p-4 rounded-xl space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <TrendingUp className="w-3.5 h-3.5 text-sky-600" />
            <span>Saving Rate</span>
          </div>
          <p className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
            {savingsRate}%
          </p>
        </div>
      </div>

      {/* Charts Bento Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Cashflow Comparison Bar Chart */}
        <div className="lg:col-span-7 glass-card p-5 md:p-6 rounded-2xl">
          <div className="mb-4">
            <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100">
              Arus Kas Bulanan ({timeRange})
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Perbandingan pemasukan vs pengeluaran antar bulan
            </p>
          </div>
          <MonthlyBarChart trend={filteredTrend} />
        </div>

        {/* Category Breakdown Table */}
        <div className="lg:col-span-5 glass-card p-5 md:p-6 rounded-2xl">
          <div className="mb-4">
            <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100">
              Komposisi Pengeluaran
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Alokasi pengeluaran per kategori bulan ini
            </p>
          </div>

          {breakdown.length === 0 ? (
            <p className="text-xs text-center py-8 text-slate-400">
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
                      <span className="font-medium text-slate-900 dark:text-slate-100 truncate">
                        {cat.categoryName}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        ({cat.transactionCount}x)
                      </span>
                    </div>
                    <div className="flex items-center gap-2.5 shrink-0">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        {formatCurrencyShort(cat.total)}
                      </span>
                      <span className="text-[11px] font-medium text-slate-400 w-9 text-right">
                        {formatPercentage(cat.percentage)}
                      </span>
                    </div>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{ width: `${cat.percentage}%`, background: cat.categoryColor }}
                    />
                  </div>
                </div>
              ))}

              <div className="flex items-center justify-between pt-3 mt-2 border-t border-slate-200 dark:border-slate-800 text-xs font-semibold">
                <span className="text-slate-900 dark:text-slate-100">Total Pengeluaran</span>
                <span className="text-rose-600 dark:text-rose-400">
                  {formatCurrency(breakdown.reduce((s, c) => s + c.total, 0))}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
