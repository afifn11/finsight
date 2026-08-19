// components/ui/ActionButton.tsx
// Responsive action button: icon + label di mobile, icon + tooltip di desktop
// Dipakai konsisten di Budget, Goals, Transaksi, dan halaman lain

'use client'

import { useState } from 'react'

interface ActionButtonProps {
  icon: React.ReactNode
  label: string
  onClick: () => void
  disabled?: boolean
  variant?: 'default' | 'danger' | 'success' | 'primary'
  title?: string
  size?: 'sm' | 'md'
}

const VARIANT_STYLES: Record<
  NonNullable<ActionButtonProps['variant']>,
  { color: string; bg: string; hoverBg: string }
> = {
  default: {
    color: 'var(--text-secondary)',
    bg: 'var(--bg-muted)',
    hoverBg: 'var(--bg-muted)',
  },
  danger: {
    color: 'var(--color-danger-600)',
    bg: 'var(--color-danger-50)',
    hoverBg: 'var(--color-danger-100)',
  },
  success: {
    color: 'var(--color-success-600)',
    bg: 'var(--color-success-50)',
    hoverBg: 'var(--color-success-100)',
  },
  primary: {
    color: 'var(--color-primary-700)',
    bg: 'var(--color-primary-50)',
    hoverBg: 'var(--color-primary-100)',
  },
}

export function ActionButton({
  icon,
  label,
  onClick,
  disabled = false,
  variant = 'default',
  title,
  size = 'sm',
}: ActionButtonProps) {
  const [showTooltip, setShowTooltip] = useState(false)
  const styles = VARIANT_STYLES[variant]
  const padding = size === 'sm' ? 'px-2.5 py-1.5' : 'px-3 py-2'
  const textSize = size === 'sm' ? 'text-xs' : 'text-sm'

  return (
    <div className="relative inline-flex">
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onFocus={() => setShowTooltip(true)}
        onBlur={() => setShowTooltip(false)}
        title={title ?? label}
        className={`
          flex items-center justify-center gap-1.5 rounded-lg font-medium
          min-h-11 min-w-11
          transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed
          ${padding} ${textSize}
        `}
        style={{ color: styles.color, background: styles.bg }}
        onMouseDown={(e) => {
          // Small press feedback
          e.currentTarget.style.opacity = '0.7'
        }}
        onMouseUp={(e) => {
          e.currentTarget.style.opacity = '1'
        }}
      >
        {/* Icon — always visible */}
        <span className="flex items-center">{icon}</span>

        {/* Label — visible on mobile (< md), hidden on desktop */}
        <span className="md:hidden">{label}</span>
      </button>

      {/* Tooltip — visible on desktop only when hovered/focused */}
      {showTooltip && (
        <div
          className="
            hidden md:block
            absolute bottom-full left-1/2 -translate-x-1/2 mb-2
            px-2 py-1 rounded-md text-xs font-medium text-white whitespace-nowrap
            pointer-events-none z-50
            animate-in fade-in duration-100
          "
          style={{ background: 'rgba(15, 23, 42, 0.9)' }}
          role="tooltip"
        >
          {label}
          {/* Arrow */}
          <div
            className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent"
            style={{ borderTopColor: 'rgba(15, 23, 42, 0.9)' }}
          />
        </div>
      )}
    </div>
  )
}

// ── Action group — wraps multiple ActionButtons with consistent spacing ──
export function ActionGroup({
  children,
  align = 'end',
}: {
  children: React.ReactNode
  align?: 'start' | 'end' | 'center'
}) {
  const alignClass = align === 'end' ? 'justify-end' : align === 'start' ? 'justify-start' : 'justify-center'
  return (
    <div className={`flex items-center gap-1 ${alignClass}`}>
      {children}
    </div>
  )
}