// components/ui/IconButton.tsx
// Shared icon-only button primitive — e.g. modal close buttons. Guarantees a
// 44px touch target regardless of the icon's visual size, same principle as
// the ActionButton touch-target fix.
'use client'

import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  'aria-label': string // required — icon-only buttons must have an accessible name
  variant?: 'default' | 'ghost'
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ className, variant = 'ghost', style, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        type="button"
        className={cn(
          'inline-flex items-center justify-center rounded-lg min-h-11 min-w-11 transition-colors hover:opacity-80 disabled:opacity-40 disabled:cursor-not-allowed',
          className
        )}
        style={{
          color: 'var(--text-secondary)',
          background: variant === 'default' ? 'var(--bg-muted)' : 'transparent',
          ...style,
        }}
        {...props}
      >
        {children}
      </button>
    )
  }
)
IconButton.displayName = 'IconButton'
