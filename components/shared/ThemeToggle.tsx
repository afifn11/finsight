// components/shared/ThemeToggle.tsx
'use client'

import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { Sun, Moon, Monitor } from 'lucide-react'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Avoid hydration mismatch
  useEffect(() => setMounted(true), [])
  if (!mounted) {
    return (
      <div
        className="w-9 h-9 rounded-lg"
        style={{ background: 'var(--bg-muted)' }}
      />
    )
  }

  const options = [
    { value: 'light', icon: Sun, label: 'Light' },
    { value: 'dark', icon: Moon, label: 'Dark' },
    { value: 'system', icon: Monitor, label: 'System' },
  ] as const

  const current = options.find((o) => o.value === theme) ?? options[2]!
  const Icon = current.icon

  function cycle() {
    const idx = options.findIndex((o) => o.value === theme)
    const next = options[(idx + 1) % options.length]!
    setTheme(next.value)
  }

  return (
    <button
      onClick={cycle}
      title={`Tema: ${current.label} — klik untuk ganti`}
      className="flex items-center justify-center w-9 h-9 rounded-lg border transition-colors hover:opacity-80"
      style={{
        borderColor: 'var(--border-default)',
        background: 'var(--bg-card)',
        color: 'var(--text-secondary)',
      }}
    >
      <Icon className="w-4 h-4" />
    </button>
  )
}
