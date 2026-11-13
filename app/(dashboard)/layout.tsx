// app/(dashboard)/layout.tsx
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/shared/Sidebar'
import { Header } from '@/components/shared/Header'
import { BottomNav } from '@/components/shared/BottomNav'
import { ErrorBoundary } from '@/components/shared/ErrorBoundary'
import { QuickAddProvider } from '@/components/transactions/QuickAddProvider'
import { LandingHero } from '@/components/landing/LandingHero'
import { DemoModeBanner } from '@/components/shared/DemoModeBanner'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)

  // Unauthenticated visitors on root '/' see the Landing Page with Interactive Demo CTA
  if (!session) {
    return <LandingHero />
  }

  if (session.user.onboardingDone === false) redirect('/onboarding')

  const isDemoMode = Boolean(
    session.user.isDemo || session.user.email === 'demo@finsight.app'
  )

  return (
    <QuickAddProvider>
      <div className="flex flex-col h-screen overflow-hidden" style={{ background: 'var(--bg-page)' }}>
        {isDemoMode && <DemoModeBanner />}

        <div className="flex flex-1 overflow-hidden min-w-0">
          {/* Sidebar — desktop only */}
          <Sidebar user={session.user} />

          {/* Main content */}
          <div className="flex flex-1 flex-col overflow-hidden min-w-0">
            <Header user={session.user} />
            <main
              className="flex-1 overflow-y-auto px-4 py-6 md:px-6 lg:px-8 pt-[calc(4rem+1.5rem)] md:pt-6"
              style={{ paddingBottom: 'calc(1.5rem + 64px)' }}
            >
              <ErrorBoundary>{children}</ErrorBoundary>
            </main>
          </div>

          {/* Bottom navigation — mobile only */}
          <BottomNav />
        </div>
      </div>
    </QuickAddProvider>
  )
}
