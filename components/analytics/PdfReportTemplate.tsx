// components/analytics/PdfReportTemplate.tsx
import { forwardRef } from 'react'
import { formatCurrency, formatPercentage } from '@/lib/utils'
import type { MonthlySummary, CategoryBreakdown } from '@/types'

export interface PdfReportTemplateProps {
  timeRange: '1M' | '3M' | '6M' | 'YTD'
  totalIncome: number
  totalExpense: number
  netSavings: number
  savingsRate: number
  filteredTrend: MonthlySummary[]
  breakdown: CategoryBreakdown[]
}

const TIME_RANGE_LABELS: Record<'1M' | '3M' | '6M' | 'YTD', string> = {
  '1M': '1 Bulan Terakhir (1M)',
  '3M': '3 Bulan Terakhir (3M)',
  '6M': '6 Bulan Terakhir (6M)',
  YTD: 'Tahun Berjalan (Year-to-Date)',
}

export const PdfReportTemplate = forwardRef<HTMLDivElement, PdfReportTemplateProps>(
  function PdfReportTemplate(
    {
      timeRange,
      totalIncome,
      totalExpense,
      netSavings,
      savingsRate,
      filteredTrend,
      breakdown,
    },
    ref
  ) {
    const now = new Date()
    const formattedDate = now.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    })
    const docNumber = `FS-RPT-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(
      now.getDate()
    ).padStart(2, '0')}`

    const totalBreakdownExpense = breakdown.reduce((sum, item) => sum + item.total, 0)
    const totalBreakdownTxCount = breakdown.reduce(
      (sum, item) => sum + item.transactionCount,
      0
    )

    return (
      <div
        ref={ref}
        id="pdf-report-template"
        data-pdf-container="true"
        style={{
          width: '794px', // Standard A4 width at 96 DPI
          backgroundColor: '#ffffff',
          color: '#09090b',
          padding: '44px 48px',
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
          boxSizing: 'border-box',
          lineHeight: 1.45,
        }}
      >
        {/* ── FORMAL DOCUMENT HEADER ── */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            borderBottom: '2px solid #18181b',
            paddingBottom: '20px',
            marginBottom: '24px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '8px',
                backgroundColor: '#18181b',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg
                width="22"
                height="22"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <rect x="2.5" y="2" width="3" height="12" rx="1" fill="#ffffff" />
                <rect x="2.5" y="2" width="10" height="3" rx="1" fill="#ffffff" />
                <rect x="2.5" y="6.5" width="8" height="3" rx="1" fill="#ffffff" />
                <circle cx="13" cy="13" r="2.2" fill="#84cc16" />
              </svg>
            </div>
            <div>
              <div
                style={{
                  fontSize: '10px',
                  fontWeight: 700,
                  letterSpacing: '1.5px',
                  textTransform: 'uppercase',
                  color: '#4d7c0f',
                  marginBottom: '2px',
                }}
              >
                FINSIGHT FINANCIAL INTELLIGENCE
              </div>
              <h1
                style={{
                  fontSize: '20px',
                  fontWeight: 800,
                  color: '#09090b',
                  margin: 0,
                  letterSpacing: '-0.3px',
                }}
              >
                Laporan Analisis Arus Kas &amp; Finansial
              </h1>
              <p
                style={{
                  fontSize: '12px',
                  color: '#52525b',
                  margin: '2px 0 0 0',
                }}
              >
                Dokumen Resmi Rekapitulasi Performa Keuangan Personal
              </p>
            </div>
          </div>

          <div style={{ textAlign: 'right', fontSize: '11px', color: '#3f3f46' }}>
            <div style={{ fontWeight: 700, color: '#09090b', marginBottom: '3px' }}>
              No. Dokumen: {docNumber}
            </div>
            <div>Tanggal Cetak: {formattedDate}</div>
            <div>Periode: {TIME_RANGE_LABELS[timeRange]}</div>
            <div>Mata Uang: IDR (Rupiah)</div>
          </div>
        </div>

        {/* ── SECTION I: EXECUTIVE FINANCIAL SUMMARY ── */}
        <div style={{ marginBottom: '28px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '10px',
            }}
          >
            <h2
              style={{
                fontSize: '12px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.8px',
                color: '#18181b',
                margin: 0,
              }}
            >
              I. Ringkasan Eksekutif (Executive Summary)
            </h2>
            <span
              style={{
                fontSize: '10px',
                fontWeight: 600,
                padding: '2px 8px',
                borderRadius: '4px',
                backgroundColor: netSavings >= 0 ? '#ecfccb' : '#ffe4e6',
                color: netSavings >= 0 ? '#3f6212' : '#9f1239',
                border: `1px solid ${netSavings >= 0 ? '#bef264' : '#fda4af'}`,
              }}
            >
              Status Arus Kas: {netSavings >= 0 ? 'SURPLUS (Positif)' : 'DEFISIT (Negatif)'}
            </span>
          </div>

          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              border: '1px solid #d4d4d8',
            }}
          >
            <thead>
              <tr style={{ backgroundColor: '#f4f4f5' }}>
                <th
                  style={{
                    border: '1px solid #d4d4d8',
                    padding: '8px 12px',
                    textAlign: 'left',
                    fontSize: '10px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    color: '#52525b',
                    width: '25%',
                  }}
                >
                  Total Pemasukan
                </th>
                <th
                  style={{
                    border: '1px solid #d4d4d8',
                    padding: '8px 12px',
                    textAlign: 'left',
                    fontSize: '10px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    color: '#52525b',
                    width: '25%',
                  }}
                >
                  Total Pengeluaran
                </th>
                <th
                  style={{
                    border: '1px solid #d4d4d8',
                    padding: '8px 12px',
                    textAlign: 'left',
                    fontSize: '10px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    color: '#52525b',
                    width: '25%',
                  }}
                >
                  Saldo Bersih (Net Cashflow)
                </th>
                <th
                  style={{
                    border: '1px solid #d4d4d8',
                    padding: '8px 12px',
                    textAlign: 'left',
                    fontSize: '10px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    color: '#52525b',
                    width: '25%',
                  }}
                >
                  Rasio Tabungan (Saving Rate)
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td
                  style={{
                    border: '1px solid #d4d4d8',
                    padding: '12px',
                    fontSize: '15px',
                    fontWeight: 700,
                    color: '#3f6212',
                  }}
                >
                  {formatCurrency(totalIncome)}
                </td>
                <td
                  style={{
                    border: '1px solid #d4d4d8',
                    padding: '12px',
                    fontSize: '15px',
                    fontWeight: 700,
                    color: '#be123c',
                  }}
                >
                  {formatCurrency(totalExpense)}
                </td>
                <td
                  style={{
                    border: '1px solid #d4d4d8',
                    padding: '12px',
                    fontSize: '15px',
                    fontWeight: 700,
                    color: netSavings >= 0 ? '#18181b' : '#be123c',
                  }}
                >
                  {formatCurrency(netSavings)}
                </td>
                <td
                  style={{
                    border: '1px solid #d4d4d8',
                    padding: '12px',
                    fontSize: '15px',
                    fontWeight: 700,
                    color: '#18181b',
                  }}
                >
                  {savingsRate}%
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* ── SECTION II: MONTHLY CASHFLOW STATEMENT TABLE ── */}
        <div style={{ marginBottom: '28px' }}>
          <h2
            style={{
              fontSize: '12px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.8px',
              color: '#18181b',
              margin: '0 0 10px 0',
            }}
          >
            II. Rekapitulasi Arus Kas Bulanan ({timeRange})
          </h2>

          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              border: '1px solid #d4d4d8',
              fontSize: '11px',
            }}
          >
            <thead>
              <tr style={{ backgroundColor: '#18181b', color: '#ffffff' }}>
                <th
                  style={{
                    padding: '8px 12px',
                    textAlign: 'left',
                    fontWeight: 600,
                    border: '1px solid #18181b',
                  }}
                >
                  Periode Bulan
                </th>
                <th
                  style={{
                    padding: '8px 12px',
                    textAlign: 'right',
                    fontWeight: 600,
                    border: '1px solid #18181b',
                  }}
                >
                  Pemasukan (IDR)
                </th>
                <th
                  style={{
                    padding: '8px 12px',
                    textAlign: 'right',
                    fontWeight: 600,
                    border: '1px solid #18181b',
                  }}
                >
                  Pengeluaran (IDR)
                </th>
                <th
                  style={{
                    padding: '8px 12px',
                    textAlign: 'right',
                    fontWeight: 600,
                    border: '1px solid #18181b',
                  }}
                >
                  Selisih Bersih (IDR)
                </th>
                <th
                  style={{
                    padding: '8px 12px',
                    textAlign: 'center',
                    fontWeight: 600,
                    border: '1px solid #18181b',
                    width: '90px',
                  }}
                >
                  Saving Rate
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredTrend.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    style={{
                      padding: '16px',
                      textAlign: 'center',
                      color: '#71717a',
                      border: '1px solid #d4d4d8',
                    }}
                  >
                    Tidak ada data histori arus kas untuk periode ini.
                  </td>
                </tr>
              ) : (
                filteredTrend.map((row, idx) => {
                  const net = row.income - row.expense
                  const rate =
                    row.income > 0
                      ? Math.round(((row.income - row.expense) / row.income) * 100)
                      : 0
                  return (
                    <tr
                      key={`${row.year}-${row.month}-${idx}`}
                      style={{
                        backgroundColor: idx % 2 === 0 ? '#ffffff' : '#fafafa',
                      }}
                    >
                      <td
                        style={{
                          padding: '8px 12px',
                          border: '1px solid #e4e4e7',
                          fontWeight: 600,
                          color: '#18181b',
                        }}
                      >
                        {row.month} {row.year}
                      </td>
                      <td
                        style={{
                          padding: '8px 12px',
                          border: '1px solid #e4e4e7',
                          textAlign: 'right',
                          color: '#3f6212',
                          fontWeight: 500,
                        }}
                      >
                        {formatCurrency(row.income)}
                      </td>
                      <td
                        style={{
                          padding: '8px 12px',
                          border: '1px solid #e4e4e7',
                          textAlign: 'right',
                          color: '#be123c',
                          fontWeight: 500,
                        }}
                      >
                        {formatCurrency(row.expense)}
                      </td>
                      <td
                        style={{
                          padding: '8px 12px',
                          border: '1px solid #e4e4e7',
                          textAlign: 'right',
                          fontWeight: 700,
                          color: net >= 0 ? '#18181b' : '#be123c',
                        }}
                      >
                        {formatCurrency(net)}
                      </td>
                      <td
                        style={{
                          padding: '8px 12px',
                          border: '1px solid #e4e4e7',
                          textAlign: 'center',
                          fontWeight: 600,
                          color: '#3f3f46',
                        }}
                      >
                        {rate}%
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
            {filteredTrend.length > 0 && (
              <tfoot>
                <tr style={{ backgroundColor: '#f4f4f5', fontWeight: 700 }}>
                  <td
                    style={{
                      padding: '9px 12px',
                      border: '1px solid #d4d4d8',
                      color: '#09090b',
                    }}
                  >
                    TOTAL PERIODE ({filteredTrend.length} Bulan)
                  </td>
                  <td
                    style={{
                      padding: '9px 12px',
                      border: '1px solid #d4d4d8',
                      textAlign: 'right',
                      color: '#3f6212',
                    }}
                  >
                    {formatCurrency(totalIncome)}
                  </td>
                  <td
                    style={{
                      padding: '9px 12px',
                      border: '1px solid #d4d4d8',
                      textAlign: 'right',
                      color: '#be123c',
                    }}
                  >
                    {formatCurrency(totalExpense)}
                  </td>
                  <td
                    style={{
                      padding: '9px 12px',
                      border: '1px solid #d4d4d8',
                      textAlign: 'right',
                      color: netSavings >= 0 ? '#09090b' : '#be123c',
                    }}
                  >
                    {formatCurrency(netSavings)}
                  </td>
                  <td
                    style={{
                      padding: '9px 12px',
                      border: '1px solid #d4d4d8',
                      textAlign: 'center',
                      color: '#09090b',
                    }}
                  >
                    {savingsRate}%
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        {/* ── SECTION III: CATEGORY EXPENSE BREAKDOWN TABLE ── */}
        <div style={{ marginBottom: '32px' }}>
          <h2
            style={{
              fontSize: '12px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.8px',
              color: '#18181b',
              margin: '0 0 10px 0',
            }}
          >
            III. Rincian Alokasi Pengeluaran per Kategori (Bulan Berjalan)
          </h2>

          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              border: '1px solid #d4d4d8',
              fontSize: '11px',
            }}
          >
            <thead>
              <tr style={{ backgroundColor: '#f4f4f5', color: '#18181b' }}>
                <th
                  style={{
                    padding: '8px 10px',
                    textAlign: 'center',
                    border: '1px solid #d4d4d8',
                    width: '40px',
                  }}
                >
                  No.
                </th>
                <th
                  style={{
                    padding: '8px 12px',
                    textAlign: 'left',
                    border: '1px solid #d4d4d8',
                  }}
                >
                  Kategori Pengeluaran
                </th>
                <th
                  style={{
                    padding: '8px 12px',
                    textAlign: 'center',
                    border: '1px solid #d4d4d8',
                    width: '110px',
                  }}
                >
                  Frekuensi
                </th>
                <th
                  style={{
                    padding: '8px 12px',
                    textAlign: 'left',
                    border: '1px solid #d4d4d8',
                    width: '180px',
                  }}
                >
                  Proporsi Alokasi
                </th>
                <th
                  style={{
                    padding: '8px 12px',
                    textAlign: 'right',
                    border: '1px solid #d4d4d8',
                    width: '150px',
                  }}
                >
                  Nominal (IDR)
                </th>
              </tr>
            </thead>
            <tbody>
              {breakdown.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    style={{
                      padding: '16px',
                      textAlign: 'center',
                      color: '#71717a',
                      border: '1px solid #d4d4d8',
                    }}
                  >
                    Belum ada transaksi pengeluaran tercatat pada bulan ini.
                  </td>
                </tr>
              ) : (
                breakdown.map((cat, idx) => (
                  <tr
                    key={cat.categoryId}
                    style={{
                      backgroundColor: idx % 2 === 0 ? '#ffffff' : '#fafafa',
                    }}
                  >
                    <td
                      style={{
                        padding: '8px 10px',
                        textAlign: 'center',
                        border: '1px solid #e4e4e7',
                        color: '#52525b',
                      }}
                    >
                      {idx + 1}
                    </td>
                    <td
                      style={{
                        padding: '8px 12px',
                        border: '1px solid #e4e4e7',
                        fontWeight: 600,
                        color: '#18181b',
                      }}
                    >
                      <span
                        style={{
                          display: 'inline-block',
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          backgroundColor: cat.categoryColor || '#84cc16',
                          marginRight: '8px',
                          verticalAlign: 'middle',
                        }}
                      />
                      {cat.categoryName}
                    </td>
                    <td
                      style={{
                        padding: '8px 12px',
                        textAlign: 'center',
                        border: '1px solid #e4e4e7',
                        color: '#3f3f46',
                      }}
                    >
                      {cat.transactionCount} transaksi
                    </td>
                    <td
                      style={{
                        padding: '8px 12px',
                        border: '1px solid #e4e4e7',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                        }}
                      >
                        <div
                          style={{
                            flex: 1,
                            height: '6px',
                            backgroundColor: '#e4e4e7',
                            borderRadius: '3px',
                            overflow: 'hidden',
                          }}
                        >
                          <div
                            style={{
                              width: `${Math.min(cat.percentage, 100)}%`,
                              height: '100%',
                              backgroundColor: cat.categoryColor || '#18181b',
                            }}
                          />
                        </div>
                        <span
                          style={{
                            fontSize: '10px',
                            fontWeight: 600,
                            color: '#3f3f46',
                            minWidth: '34px',
                            textAlign: 'right',
                          }}
                        >
                          {formatPercentage(cat.percentage)}
                        </span>
                      </div>
                    </td>
                    <td
                      style={{
                        padding: '8px 12px',
                        textAlign: 'right',
                        border: '1px solid #e4e4e7',
                        fontWeight: 600,
                        color: '#18181b',
                      }}
                    >
                      {formatCurrency(cat.total)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {breakdown.length > 0 && (
              <tfoot>
                <tr style={{ backgroundColor: '#f4f4f5', fontWeight: 700 }}>
                  <td
                    colSpan={2}
                    style={{
                      padding: '9px 12px',
                      border: '1px solid #d4d4d8',
                      color: '#09090b',
                    }}
                  >
                    TOTAL PENGELUARAN BULAN BERJALAN
                  </td>
                  <td
                    style={{
                      padding: '9px 12px',
                      border: '1px solid #d4d4d8',
                      textAlign: 'center',
                      color: '#09090b',
                    }}
                  >
                    {totalBreakdownTxCount} transaksi
                  </td>
                  <td
                    style={{
                      padding: '9px 12px',
                      border: '1px solid #d4d4d8',
                      textAlign: 'right',
                      color: '#09090b',
                    }}
                  >
                    100%
                  </td>
                  <td
                    style={{
                      padding: '9px 12px',
                      border: '1px solid #d4d4d8',
                      textAlign: 'right',
                      color: '#be123c',
                    }}
                  >
                    {formatCurrency(totalBreakdownExpense)}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        {/* ── DOCUMENT FOOTER ── */}
        <div
          style={{
            borderTop: '1px solid #d4d4d8',
            paddingTop: '14px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '10px',
            color: '#71717a',
          }}
        >
          <div>
            Diterbitkan secara otomatis oleh <strong>FinSight Personal Finance System</strong>.
          </div>
          <div>Dokumen Rahasia &amp; Pribadi • Halaman 1 dari 1</div>
        </div>
      </div>
    )
  }
)
