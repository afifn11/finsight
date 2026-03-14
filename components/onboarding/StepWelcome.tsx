// components/onboarding/StepWelcome.tsx
'use client'

import { Sparkles, BarChart3, PiggyBank, Brain } from 'lucide-react'

interface Props {
  user: { name?: string | null; email: string }
  onNext: () => void
}

const FEATURES = [
  {
    icon: BarChart3,
    color: 'var(--color-primary-600)',
    bg: 'var(--color-primary-50)',
    title: 'Dashboard Analytics',
    desc: 'Visualisasi pemasukan & pengeluaran secara real-time',
  },
  {
    icon: PiggyBank,
    color: 'var(--color-success-600)',
    bg: 'var(--color-success-50)',
    title: 'Budget Management',
    desc: 'Set batas pengeluaran per kategori dengan alert otomatis',
  },
  {
    icon: Brain,
    color: '#7c3aed',
    bg: '#f5f3ff',
    title: 'AI Spending Insight',
    desc: 'Insight personal dari Google Gemini berdasarkan data kamu',
  },
]

export function StepWelcome({ user, onNext }: Props) {
  const firstName = user.name?.split(' ')[0] ?? 'kamu'

  return (
    <div className="text-center">
      {/* Greeting */}
      <div
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium mb-4"
        style={{ background: 'var(--color-primary-50)', color: 'var(--color-primary-800)' }}
      >
        <Sparkles className="w-3.5 h-3.5" />
        Akun berhasil dibuat
      </div>

      <h1 className="text-2xl font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
        Halo, {firstName}!
      </h1>
      <p className="text-sm mb-8" style={{ color: 'var(--text-secondary)' }}>
        Selamat datang di FinSight. Yuk setup akun kamu dalam 2 menit.
      </p>

      {/* Features */}
      <div className="space-y-3 mb-8 text-left">
        {FEATURES.map((f) => {
          const Icon = f.icon
          return (
            <div
              key={f.title}
              className="flex items-center gap-3 p-3 rounded-xl border"
              style={{ borderColor: 'var(--border-default)', background: 'var(--bg-page)' }}
            >
              <div
                className="flex items-center justify-center w-9 h-9 rounded-lg shrink-0"
                style={{ background: f.bg }}
              >
                <Icon className="w-4 h-4" style={{ color: f.color }} />
              </div>
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                  {f.title}
                </p>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                  {f.desc}
                </p>
              </div>
            </div>
          )
        })}
      </div>

      <button
        onClick={onNext}
        className="w-full py-2.5 rounded-lg text-sm font-medium text-white transition-colors hover:opacity-90"
        style={{ background: 'var(--color-primary-800)' }}
      >
        Mulai setup →
      </button>
    </div>
  )
}
