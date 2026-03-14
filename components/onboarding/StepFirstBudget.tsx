// components/onboarding/StepFirstBudget.tsx
'use client'

import { useState } from 'react'
import { Loader2, Plus, Trash2 } from 'lucide-react'
import type { OnboardingData } from './OnboardingFlow'
import { formatCurrency } from '@/lib/utils'

interface Props {
  data: OnboardingData
  onChange: (partial: Partial<OnboardingData>) => void
  onFinish: (data: OnboardingData) => void
  onBack: () => void
  isSubmitting: boolean
}

// Preset budget suggestions
const BUDGET_PRESETS = [
  { categoryId: 'system-makanan-&-minuman', name: 'Makanan & Minuman', icon: '🍽', suggested: 1500000 },
  { categoryId: 'system-transportasi', name: 'Transportasi', icon: '🚗', suggested: 500000 },
  { categoryId: 'system-hiburan', name: 'Hiburan', icon: '📺', suggested: 300000 },
  { categoryId: 'system-belanja', name: 'Belanja', icon: '🛍', suggested: 700000 },
  { categoryId: 'system-tagihan-&-utilitas', name: 'Tagihan & Utilitas', icon: '⚡', suggested: 600000 },
  { categoryId: 'system-kesehatan', name: 'Kesehatan', icon: '❤️', suggested: 400000 },
]

export function StepFirstBudget({ data, onChange, onFinish, onBack, isSubmitting }: Props) {
  const [selected, setSelected] = useState<Record<string, number>>({})
  const [customAmounts, setCustomAmounts] = useState<Record<string, string>>({})

  function toggleCategory(categoryId: string, suggested: number) {
    setSelected((prev) => {
      if (prev[categoryId] !== undefined) {
        const next = { ...prev }
        delete next[categoryId]
        return next
      }
      return { ...prev, [categoryId]: suggested }
    })
  }

  function updateAmount(categoryId: string, value: string) {
    setCustomAmounts((prev) => ({ ...prev, [categoryId]: value }))
    const num = parseInt(value.replace(/\D/g, ''), 10)
    if (!isNaN(num) && num > 0) {
      setSelected((prev) => ({ ...prev, [categoryId]: num }))
    }
  }

  function handleFinish() {
    const budgets = Object.entries(selected).map(([categoryId, amount]) => ({
      categoryId,
      amount,
    }))
    onFinish({ ...data, budgets })
  }

  const totalBudget = Object.values(selected).reduce((s, a) => s + a, 0)

  return (
    <div>
      <h2 className="text-xl font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
        Set budget awal
      </h2>
      <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
        Pilih kategori dan tentukan batas pengeluaran bulanan. Bisa diubah kapan saja.
      </p>

      {/* Category list */}
      <div className="space-y-2 mb-4">
        {BUDGET_PRESETS.map((preset) => {
          const isSelected = selected[preset.categoryId] !== undefined
          return (
            <div
              key={preset.categoryId}
              className="rounded-xl border transition-all overflow-hidden"
              style={{
                borderColor: isSelected ? 'var(--color-primary-600)' : 'var(--border-default)',
                background: isSelected ? 'var(--color-primary-50)' : 'var(--bg-page)',
              }}
            >
              <div className="flex items-center gap-3 p-3">
                {/* Checkbox */}
                <button
                  type="button"
                  onClick={() => toggleCategory(preset.categoryId, preset.suggested)}
                  className="flex items-center justify-center w-5 h-5 rounded border-2 shrink-0 transition-colors"
                  style={{
                    borderColor: isSelected ? 'var(--color-primary-600)' : 'var(--border-default)',
                    background: isSelected ? 'var(--color-primary-600)' : 'transparent',
                  }}
                >
                  {isSelected && (
                    <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none">
                      <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </button>

                {/* Icon + name */}
                <span className="text-lg">{preset.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                    {preset.name}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    Saran: {formatCurrency(preset.suggested)}
                  </p>
                </div>

                {/* Amount input (shown when selected) */}
                {isSelected && (
                  <div className="flex items-center gap-1 shrink-0">
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Rp</span>
                    <input
                      type="number"
                      value={customAmounts[preset.categoryId] ?? selected[preset.categoryId]}
                      onChange={(e) => updateAmount(preset.categoryId, e.target.value)}
                      className="w-24 px-2 py-1 rounded-lg border text-xs text-right outline-none"
                      style={{
                        background: 'var(--bg-card)',
                        borderColor: 'var(--color-primary-400)',
                        color: 'var(--text-primary)',
                      }}
                      min={1}
                    />
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Total */}
      {Object.keys(selected).length > 0 && (
        <div
          className="flex items-center justify-between p-3 rounded-xl mb-6"
          style={{ background: 'var(--bg-muted)' }}
        >
          <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Total budget bulanan
          </span>
          <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            {formatCurrency(totalBudget)}
          </span>
        </div>
      )}

      {/* Skip note */}
      <p className="text-xs text-center mb-4" style={{ color: 'var(--text-muted)' }}>
        Tidak pilih apapun juga tidak masalah — bisa setup budget nanti dari menu Budget.
      </p>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={onBack}
          disabled={isSubmitting}
          className="flex-1 py-2.5 rounded-lg text-sm font-medium border transition-colors disabled:opacity-50"
          style={{ borderColor: 'var(--border-default)', color: 'var(--text-secondary)' }}
        >
          Kembali
        </button>
        <button
          onClick={handleFinish}
          disabled={isSubmitting}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium text-white transition-colors hover:opacity-90 disabled:opacity-60"
          style={{ background: 'var(--color-primary-800)' }}
        >
          {isSubmitting ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Menyimpan...</>
          ) : (
            'Selesai & mulai →'
          )}
        </button>
      </div>
    </div>
  )
}
