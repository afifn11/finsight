// components/emails/AlertEmail.tsx
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

export interface BudgetWarningItem {
  categoryName: string
  spent: string
  limit: string
  percentage: number
}

export interface SubscriptionReminderItem {
  name: string
  amount: string
  dueDate: string
  billingCycle: string
}

export interface AlertEmailProps {
  userName?: string
  budgetWarnings?: BudgetWarningItem[]
  subscriptionReminders?: SubscriptionReminderItem[]
}

export function AlertEmail({
  userName = 'Pengguna FinSight',
  budgetWarnings = [],
  subscriptionReminders = [],
}: AlertEmailProps) {
  return (
    <Html lang="id">
      <Head />
      <Preview>Peringatan Keuangan Harian FinSight — Cek Budget & Tagihanmu</Preview>
      <Body style={mainStyle}>
        <Container style={containerStyle}>
          {/* Header Badge */}
          <Section style={headerStyle}>
            <Text style={brandBadgeStyle}>FINSIGHT PROACTIVE ASSISTANT</Text>
            <Heading style={headingStyle}>Halo, {userName}</Heading>
            <Text style={subHeadingStyle}>
              Berikut adalah pembaruan penting terkait anggaran dan jadwal tagihan rutinmu hari ini.
            </Text>
          </Section>

          {/* Budget Warnings Section */}
          {budgetWarnings.length > 0 && (
            <Section style={cardSectionStyle}>
              <Heading as="h2" style={sectionTitleStyle}>
                ⚠️ Peringatan Batas Budget (&gt;80%)
              </Heading>
              <Text style={mutedTextStyle}>
                Beberapa kategori pengeluaranmu bulan ini telah melewati ambang batas aman:
              </Text>
              {budgetWarnings.map((item, idx) => (
                <Section key={idx} style={alertItemBoxStyle}>
                  <Text style={itemTitleStyle}>
                    {item.categoryName} — <span style={highlightLimeStyle}>{item.percentage}% Terpakai</span>
                  </Text>
                  <Text style={itemDetailStyle}>
                    Terpakai: <strong>{item.spent}</strong> dari batas <strong>{item.limit}</strong>
                  </Text>
                </Section>
              ))}
            </Section>
          )}

          {/* Subscription Reminders Section */}
          {subscriptionReminders.length > 0 && (
            <Section style={cardSectionStyle}>
              <Heading as="h2" style={sectionTitleStyle}>
                📅 Pengingat Tagihan Rutin (Jatuh Tempo 3 Hari Lagi)
              </Heading>
              <Text style={mutedTextStyle}>
                Pastikan saldo dompetmu mencukupi untuk tagihan berulang berikut:
              </Text>
              {subscriptionReminders.map((sub, idx) => (
                <Section key={idx} style={subItemBoxStyle}>
                  <Text style={itemTitleStyle}>{sub.name}</Text>
                  <Text style={itemDetailStyle}>
                    Nominal: <strong>{sub.amount}</strong> ({sub.billingCycle}) • Jatuh Tempo:{' '}
                    <strong>{sub.dueDate}</strong>
                  </Text>
                </Section>
              ))}
            </Section>
          )}

          <Hr style={hrStyle} />

          {/* Footer */}
          <Section style={footerStyle}>
            <Text style={footerTextStyle}>
              Email ini dikirim secara otomatis oleh FinSight Personal Finance Assistant.
            </Text>
            <Text style={footerTextStyle}>
              Kelola budget dan tagihanmu langsung melalui dashboard FinSight.
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

const cardSectionStyle: React.CSSProperties = {
  backgroundColor: '#09090b',
  border: '1px solid #27272a',
  borderRadius: '12px',
  padding: '20px',
  marginBottom: '20px',
}

const sectionTitleStyle: React.CSSProperties = {
  color: '#fafafa',
  fontSize: '16px',
  fontWeight: 600,
  margin: '0 0 6px 0',
}

const mutedTextStyle: React.CSSProperties = {
  color: '#a1a1aa',
  fontSize: '13px',
  margin: '0 0 14px 0',
}

const alertItemBoxStyle: React.CSSProperties = {
  backgroundColor: '#18181b',
  borderLeft: '3px solid #f59e0b',
  borderRadius: '8px',
  padding: '12px 14px',
  marginBottom: '10px',
}

const subItemBoxStyle: React.CSSProperties = {
  backgroundColor: '#18181b',
  borderLeft: '3px solid #84cc16',
  borderRadius: '8px',
  padding: '12px 14px',
  marginBottom: '10px',
}

const itemTitleStyle: React.CSSProperties = {
  color: '#ffffff',
  fontSize: '14px',
  fontWeight: 600,
  margin: '0 0 4px 0',
}

const highlightLimeStyle: React.CSSProperties = {
  color: '#a3e635',
}

const itemDetailStyle: React.CSSProperties = {
  color: '#d4d4d8',
  fontSize: '13px',
  margin: 0,
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
  margin: '4px 0',
}

export default AlertEmail
