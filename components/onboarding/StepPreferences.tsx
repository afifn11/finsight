// components/onboarding/StepPreferences.tsx
'use client'

import type { OnboardingData } from './OnboardingFlow'
import { Button } from '@/components/ui/Button'

interface Props {
  data: OnboardingData
  onChange: (partial: Partial<OnboardingData>) => void
  onNext: () => void
  onBack: () => void
}

const CURRENCIES = [
  { value: 'IDR', label: 'IDR — Rupiah Indonesia', flag: '🇮🇩' },
  { value: 'USD', label: 'USD — US Dollar', flag: '🇺🇸' },
  { value: 'SGD', label: 'SGD — Singapore Dollar', flag: '🇸🇬' },
  { value: 'MYR', label: 'MYR — Malaysian Ringgit', flag: '🇲🇾' },
]

const TIMEZONES = [
  { value: 'Asia/Jakarta', label: 'WIB — Jakarta, Sumatera, Kalimantan Barat' },
  { value: 'Asia/Makassar', label: 'WITA — Makassar, Bali, Kalimantan Timur' },
  { value: 'Asia/Jayapura', label: 'WIT — Jayapura, Maluku' },
]

export function StepPreferences({ data, onChange, onNext, onBack }: Props) {
  return (
    <div>
      <h2 className="text-xl font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
        Preferensi kamu
      </h2>
      <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
        Ini akan dipakai untuk menampilkan data keuanganmu dengan benar.
      </p>

      {/* Currency */}
      <div className="mb-5">
        <label className="text-sm font-medium block mb-2" style={{ color: 'var(--text-primary)' }}>
          Mata uang utama
        </label>
        <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Mata uang utama">
          {CURRENCIES.map((c) => (
            <button
              key={c.value}
              type="button"
              role="radio"
              aria-checked={data.currency === c.value}
              onClick={() => onChange({ currency: c.value })}
              className="flex items-center gap-2 p-3 rounded-xl border text-left transition-all"
              style={
                data.currency === c.value
                  ? {
                      borderColor: 'var(--color-primary-600)',
                      background: 'var(--color-primary-50)',
                    }
                  : {
                      borderColor: 'var(--border-default)',
                      background: 'var(--bg-page)',
                    }
              }
            >
              <span className="text-lg">{c.flag}</span>
              <div>
                <p
                  className="text-xs font-semibold"
                  style={{
                    color:
                      data.currency === c.value
                        ? 'var(--color-primary-800)'
                        : 'var(--text-primary)',
                  }}
                >
                  {c.value}
                </p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  {c.label.split('—')[1]?.trim()}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Timezone */}
      <div className="mb-8">
        <label className="text-sm font-medium block mb-2" style={{ color: 'var(--text-primary)' }}>
          Zona waktu
        </label>
        <div className="space-y-2" role="radiogroup" aria-label="Zona waktu">
          {TIMEZONES.map((tz) => (
            <button
              key={tz.value}
              type="button"
              role="radio"
              aria-checked={data.timezone === tz.value}
              onClick={() => onChange({ timezone: tz.value })}
              className="w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all"
              style={
                data.timezone === tz.value
                  ? {
                      borderColor: 'var(--color-primary-600)',
                      background: 'var(--color-primary-50)',
                    }
                  : {
                      borderColor: 'var(--border-default)',
                      background: 'var(--bg-page)',
                    }
              }
            >
              <div
                className="w-2 h-2 rounded-full shrink-0"
                style={{
                  background:
                    data.timezone === tz.value
                      ? 'var(--color-primary-600)'
                      : 'var(--border-default)',
                }}
              />
              <span
                className="text-sm"
                style={{
                  color:
                    data.timezone === tz.value
                      ? 'var(--color-primary-800)'
                      : 'var(--text-primary)',
                  fontWeight: data.timezone === tz.value ? 500 : 400,
                }}
              >
                {tz.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <Button variant="secondary" fullWidth onClick={onBack}>
          Kembali
        </Button>
        <Button fullWidth onClick={onNext}>
          Lanjut →
        </Button>
      </div>
    </div>
  )
}
