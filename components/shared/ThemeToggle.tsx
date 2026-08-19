// components/shared/ThemeToggle.tsx
'use client'

import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { Sun, Moon, Monitor } from 'lucide-react'
import { IconButton } from '@/components/ui/IconButton'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Avoid hydration mismatch
  useEffect(() => setMounted(true), [])
  if (!mounted) {
    return (
      <div
        className="w-11 h-11 rounded-lg"
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
    <IconButton
      onClick={cycle}
      title={`Tema: ${current.label} — klik untuk ganti`}
      aria-label={`Ganti tema, saat ini: ${current.label}`}
      style={{
        borderWidth: 1,
        borderColor: 'var(--border-default)',
        borderStyle: 'solid',
        background: 'var(--bg-card)',
      }}
    >
      <Icon className="w-4 h-4" aria-hidden="true" />
    </IconButton>
  )
}
