// app/(dashboard)/settings/page.tsx
import type { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { SettingsForm } from '@/components/settings/SettingsForm'
import { PushNotificationToggle } from '@/components/settings/PushNotificationToggle'
import { WalletSettingsCard } from '@/components/settings/WalletSettingsCard'

export const metadata: Metadata = { title: 'Pengaturan' }

export default async function SettingsPage() {
  const session = await getServerSession(authOptions)

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="p-5 md:p-6 rounded-2xl glass-card">
        <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-slate-100">
          Pengaturan
        </h1>
        <p className="text-xs sm:text-sm mt-0.5 text-slate-500 dark:text-slate-400">
          Kelola profil pengguna, preferensi aplikasi, dan integrasi rekening
        </p>
      </div>

      {/* Wallet Management Section */}
      <WalletSettingsCard />

      {/* User Preferences Form */}
      <SettingsForm user={session!.user} />

      {/* Push Notification Controls */}
      <div className="glass-card p-5 rounded-2xl space-y-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            Notifikasi & Peringatan Budget
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Dapatkan peringatan instan saat pengeluaran mendekati ambang batas anggaran
          </p>
        </div>
        <PushNotificationToggle />
      </div>
    </div>
  )
}