// components/emails/MonthlyReportEmail.tsx
import * as React from 'react'
import {
  Html,
  Head,
  Preview,
  Body,
  Container,
  Section,
  Heading,
  Text,
  Hr,
} from '@react-email/components'

export interface MonthlyReportEmailProps {
  userName?: string
  monthLabel: string
  totalIncome: string
  totalExpense: string
  netCashflow: string
  isPositiveCashflow: boolean
  topCategoryName: string
  topCategoryAmount: string
}

export function MonthlyReportEmail({
  userName = 'Pengguna FinSight',
  monthLabel,
  totalIncome,
  totalExpense,
  netCashflow,
  isPositiveCashflow,
  topCategoryName,
  topCategoryAmount,
}: MonthlyReportEmailProps) {
  return (
    <Html lang="id">
      <Head />
      <Preview>{`Laporan Keuangan Bulanan FinSight — Ringkasan ${monthLabel}`}</Preview>
      <Body style={mainStyle}>
        <Container style={containerStyle}>
          {/* Header */}
          <Section style={headerStyle}>
            <Text style={brandBadgeStyle}>FINSIGHT MONTHLY REPORT</Text>
            <Heading style={headingStyle}>Ringkasan Keuangan {monthLabel}</Heading>
            <Text style={subHeadingStyle}>
              Halo {userName}, berikut adalah rekapitulasi performa arus kas dan pengeluaranmu selama bulan{' '}
              <strong>{monthLabel}</strong>.
            </Text>
          </Section>

          {/* Summary KPI Cards */}
          <Section style={kpiContainerStyle}>
            <Section style={kpiCardStyle}>
              <Text style={kpiLabelStyle}>Total Pemasukan</Text>
              <Text style={incomeValueStyle}>{totalIncome}</Text>
            </Section>

            <Section style={kpiCardStyle}>
              <Text style={kpiLabelStyle}>Total Pengeluaran</Text>
              <Text style={expenseValueStyle}>{totalExpense}</Text>
            </Section>

            <Section style={kpiCardHighlightStyle}>
              <Text style={kpiLabelStyle}>Arus Kas Bersih (Net Cashflow)</Text>
              <Text style={isPositiveCashflow ? netPositiveStyle : netNegativeStyle}>
                {netCashflow}
              </Text>
            </Section>
          </Section>

          {/* Top Spending Category */}
          <Section style={topCategoryBoxStyle}>
            <Heading as="h2" style={sectionTitleStyle}>
              📊 Kategori Pengeluaran Terbesar
            </Heading>
            <Text style={topCategoryTextStyle}>
              <strong>{topCategoryName}</strong> dengan total pengeluaran sebesar{' '}
              <span style={highlightLimeStyle}>{topCategoryAmount}</span>.
            </Text>
          </Section>

          <Hr style={hrStyle} />

          {/* Footer */}
          <Section style={footerStyle}>
            <Text style={footerTextStyle}>
              Tetap konsisten mencatat transaksi dan pantau alokasi budgetmu di FinSight.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

const mainStyle: React.CSSProperties = {
  backgroundColor: '#09090b',
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif',
  padding: '32px 16px',
}

const containerStyle: React.CSSProperties = {
  backgroundColor: '#18181b',
  border: '1px solid #27272a',
  borderRadius: '16px',
  maxWidth: '560px',
  margin: '0 auto',
  padding: '32px',
}

const headerStyle: React.CSSProperties = {
  marginBottom: '24px',
}

const brandBadgeStyle: React.CSSProperties = {
  color: '#a3e635',
  fontSize: '11px',
  fontWeight: 700,
  letterSpacing: '1.2px',
  textTransform: 'uppercase',
  margin: '0 0 8px 0',
}

const headingStyle: React.CSSProperties = {
  color: '#ffffff',
  fontSize: '24px',
  fontWeight: 700,
  margin: '0 0 8px 0',
}

const subHeadingStyle: React.CSSProperties = {
  color: '#a1a1aa',
  fontSize: '14px',
  lineHeight: '22px',
  margin: 0,
}

const kpiContainerStyle: React.CSSProperties = {
  marginBottom: '20px',
}

const kpiCardStyle: React.CSSProperties = {
  backgroundColor: '#09090b',
  border: '1px solid #27272a',
  borderRadius: '12px',
  padding: '16px 20px',
  marginBottom: '12px',
}

const kpiCardHighlightStyle: React.CSSProperties = {
  backgroundColor: '#09090b',
  border: '1px solid #3f6212',
  borderRadius: '12px',
  padding: '16px 20px',
  marginBottom: '12px',
}

const kpiLabelStyle: React.CSSProperties = {
  color: '#a1a1aa',
  fontSize: '12px',
  textTransform: 'uppercase',
  letterSpacing: '0.6px',
  margin: '0 0 4px 0',
}

const incomeValueStyle: React.CSSProperties = {
  color: '#a3e635',
  fontSize: '22px',
  fontWeight: 700,
  margin: 0,
}

const expenseValueStyle: React.CSSProperties = {
  color: '#f43f5e',
  fontSize: '22px',
  fontWeight: 700,
  margin: 0,
}

const netPositiveStyle: React.CSSProperties = {
  color: '#a3e635',
  fontSize: '24px',
  fontWeight: 700,
  margin: 0,
}

const netNegativeStyle: React.CSSProperties = {
  color: '#fb7185',
  fontSize: '24px',
  fontWeight: 700,
  margin: 0,
}

const topCategoryBoxStyle: React.CSSProperties = {
  backgroundColor: '#09090b',
  border: '1px solid #27272a',
  borderRadius: '12px',
  padding: '20px',
}

const sectionTitleStyle: React.CSSProperties = {
  color: '#fafafa',
  fontSize: '15px',
  fontWeight: 600,
  margin: '0 0 8px 0',
}

const topCategoryTextStyle: React.CSSProperties = {
  color: '#d4d4d8',
  fontSize: '14px',
  lineHeight: '20px',
  margin: 0,
}

const highlightLimeStyle: React.CSSProperties = {
  color: '#a3e635',
  fontWeight: 700,
}

const hrStyle: React.CSSProperties = {
  borderColor: '#27272a',
  margin: '24px 0',
}

const footerStyle: React.CSSProperties = {
  textAlign: 'center',
}

const footerTextStyle: React.CSSProperties = {
  color: '#71717a',
  fontSize: '12px',
  lineHeight: '18px',
  margin: 0,
}

export default MonthlyReportEmail
