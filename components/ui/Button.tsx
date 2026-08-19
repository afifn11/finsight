// components/ui/Button.tsx
// Shared button primitive. Extracted from the primary-CTA markup that was
// already hand-duplicated identically across Login, Register, Settings,
// Budget, and Transaction forms — this makes that consistency structural
// instead of a matter of copy-paste discipline.
'use client'

import { forwardRef } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
  {
    variants: {
      variant: {
        primary: 'text-white hover:opacity-90',
        secondary: 'border hover:opacity-80',
        outline: 'border hover:opacity-80',
        ghost: 'hover:opacity-80',
        danger: 'text-white hover:opacity-90',
      },
      size: {
        sm: 'px-3 py-1.5 text-xs min-h-9',
        md: 'px-4 py-2 text-sm min-h-11',
        lg: 'px-5 py-2.5 text-sm min-h-12',
      },
      fullWidth: {
        true: 'w-full',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
)

// Style values that come from design tokens rather than Tailwind utility classes
// (the token system uses CSS variables, so these are applied via `style`, not `class`).
function tokenStyle(variant: NonNullable<VariantProps<typeof buttonVariants>['variant']>) {
  switch (variant) {
    case 'primary':
      return { background: 'var(--color-primary-800)' }
    case 'danger':
      return { background: 'var(--color-danger-500)' }
    case 'secondary':
      return {
        borderColor: 'var(--border-default)',
        color: 'var(--text-secondary)',
        background: 'var(--bg-card)',
      }
    case 'outline':
      return { borderColor: 'var(--color-danger-500)', color: 'var(--color-danger-500)' }
    case 'ghost':
      return { color: 'var(--text-secondary)' }
    default:
      return {}
  }
}

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', fullWidth, loading, disabled, children, style, ...props }, ref) => {
    return (
      <button
        ref={ref}
        type={props.type ?? 'button'}
        disabled={disabled || loading}
        className={cn(buttonVariants({ variant, size, fullWidth }), className)}
        style={{ ...tokenStyle(variant ?? 'primary'), ...style }}
        {...props}
      >
        {loading && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
        {children}
      </button>
    )
  }
)
Button.displayName = 'Button'
