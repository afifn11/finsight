// components/onboarding/OnboardingFlow.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { CheckCircle, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { StepWelcome } from './StepWelcome'
import { StepPreferences } from './StepPreferences'
import { StepFirstBudget } from './StepFirstBudget'

export interface OnboardingData {
  currency: string
  timezone: string
  budgets: Array<{ categoryId: string; amount: number }>
}

interface Props {
  user: { name?: string | null; email: string }
}

const STEPS = ['Selamat datang', 'Preferensi', 'Budget awal']

export function OnboardingFlow({ user }: Props) {
  const router = useRouter()
  const { update: updateSession } = useSession()
  const [step, setStep] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [data, setData] = useState<OnboardingData>({
    currency: 'IDR',
    timezone: 'Asia/Jakarta',
    budgets: [],
  })

  function next() {
    setStep((s) => Math.min(s + 1, STEPS.length - 1))
  }

  function back() {
    setStep((s) => Math.max(s - 1, 0))
  }

  function updateData(partial: Partial<OnboardingData>) {
    setData((prev) => ({ ...prev, ...partial }))
  }

  async function finish(finalData: OnboardingData) {
    setIsSubmitting(true)
    try {
      const res = await fetch('/api/user/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(finalData),
      })
      if (!res.ok) throw new Error()
      toast.success('Selamat datang di FinSight!')
      // Trigger session update agar token.onboardingDone diperbarui
      await updateSession()
      router.push('/')
      router.refresh()
    } catch {
      toast.error('Terjadi kesalahan, coba lagi.')
      setIsSubmitting(false)
    }
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-4"
      style={{ background: 'var(--bg-page)' }}
    >
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div
            className="flex items-center justify-center w-9 h-9 rounded-xl shrink-0"
            style={{ background: 'var(--color-primary-800)' }}
          >
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="3" y="2.5" width="4" height="15" rx="1.5" fill="white"/>
              <rect x="3" y="2.5" width="13" height="4" rx="1.5" fill="white"/>
              <rect x="3" y="8.5" width="10" height="4" rx="1.5" fill="white"/>
              <circle cx="17" cy="17" r="2.8" fill="#4ade80"/>
            </svg>
          </div>
          <div>
            <span className="text-lg font-bold leading-none" style={{ color: 'var(--color-primary-800)' }}>
              FinSight
            </span>
            <p className="text-xs leading-none mt-0.5" style={{ color: 'var(--text-muted)' }}>
              Personal Finance
            </p>
          </div>
        </div>

        {/* Step indicators */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {STEPS.map((label, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                <div
                  className="flex items-center justify-center w-7 h-7 rounded-full text-xs font-semibold transition-all"
                  style={
                    i < step
                      ? { background: 'var(--color-success-500)', color: '#fff' }
                      : i === step
                      ? { background: 'var(--color-primary-800)', color: '#fff' }
                      : { background: 'var(--bg-muted)', color: 'var(--text-muted)' }
                  }
                >
                  {i < step ? <CheckCircle className="w-4 h-4" /> : i + 1}
                </div>
                <span
                  className="text-xs hidden sm:block"
                  style={{
                    color: i === step ? 'var(--text-primary)' : 'var(--text-muted)',
                    fontWeight: i === step ? 500 : 400,
                  }}
                >
                  {label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className="w-8 h-px"
                  style={{
                    background: i < step ? 'var(--color-success-500)' : 'var(--border-default)',
                  }}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step content */}
        <div className="card p-6 sm:p-8">
          {step === 0 && (
            <StepWelcome user={user} onNext={next} />
          )}
          {step === 1 && (
            <StepPreferences
              data={data}
              onChange={updateData}
              onNext={next}
              onBack={back}
            />
          )}
          {step === 2 && (
            <StepFirstBudget
              data={data}
              onChange={updateData}
              onFinish={finish}
              onBack={back}
              isSubmitting={isSubmitting}
            />
          )}
        </div>

        {/* Progress bar */}
        <div
          className="mt-4 h-1 rounded-full overflow-hidden"
          style={{ background: 'var(--bg-muted)' }}
        >
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${((step + 1) / STEPS.length) * 100}%`,
              background: 'var(--color-primary-800)',
            }}
          />
        </div>
        <p className="text-center text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
          Langkah {step + 1} dari {STEPS.length}
        </p>
      </div>
    </div>
  )
}