// app/(dashboard)/layout.tsx
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/shared/Sidebar'
import { Header } from '@/components/shared/Header'
import { BottomNav } from '@/components/shared/BottomNav'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg-page)' }}>
      {/* Sidebar — desktop only */}
      <Sidebar user={session.user} />

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header user={session.user} />
        <main
          className="flex-1 overflow-y-auto px-4 py-6 md:px-6 lg:px-8"
          style={{ paddingBottom: 'calc(1.5rem + 64px)' }} // extra space for bottom nav on mobile
        >
          {children}
        </main>
      </div>

      {/* Bottom navigation — mobile only */}
      <BottomNav />
    </div>
  )
}
