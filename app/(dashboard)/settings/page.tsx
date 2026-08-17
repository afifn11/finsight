// app/(dashboard)/settings/page.tsx
import type { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { SettingsForm } from '@/components/settings/SettingsForm'
import { PushNotificationToggle } from '@/components/settings/PushNotificationToggle'

export const metadata: Metadata = { title: 'Pengaturan' }

export default async function SettingsPage() {
  const session = await getServerSession(authOptions)

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>
          Pengaturan
        </h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
          Kelola preferensi akun dan profil kamu
        </p>
      </div>

      <SettingsForm user={session!.user} />

      <div>
        <h2 className="text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
          Notifikasi
        </h2>
        <PushNotificationToggle />
      </div>
    </div>
  )
}