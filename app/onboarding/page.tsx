// app/onboarding/page.tsx
import type { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { OnboardingFlow } from '@/components/onboarding/OnboardingFlow'

export const metadata: Metadata = { title: 'Selamat Datang — FinSight' }

export default async function OnboardingPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  return <OnboardingFlow user={session.user} />
}
