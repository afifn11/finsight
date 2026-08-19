// components/ui/Input.tsx
// Shared input primitive with label/error/helper text. Extracted from the
// near-identical input markup repeated across GoalsManager, TransactionFormModal,
// BudgetManager, SettingsForm, Login, and Register.
'use client'

import { forwardRef, useId } from 'react'
import { cn } from '@/lib/utils'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helperText, required, id, ...props }, ref) => {
    const generatedId = useId()
    const inputId = id ?? generatedId
    const errorId = error ? `${inputId}-error` : undefined
    const helperId = helperText ? `${inputId}-helper` : undefined

    return (
      <div>
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium block mb-1"
            style={{ color: 'var(--text-primary)' }}
          >
            {label}
            {required && <span style={{ color: 'var(--color-danger-500)' }}> *</span>}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          required={required}
          aria-invalid={!!error}
          aria-describedby={cn(errorId, helperId) || undefined}
          className={cn('w-full px-3 py-2 rounded-lg border text-sm', className)}
          style={{
            background: 'var(--bg-card)',
            borderColor: error ? 'var(--color-danger-500)' : 'var(--border-default)',
            color: 'var(--text-primary)',
          }}
          {...props}
        />
        {error && (
          <p id={errorId} className="text-xs mt-1" style={{ color: 'var(--color-danger-500)' }}>
            {error}
          </p>
        )}
        {!error && helperText && (
          <p id={helperId} className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
            {helperText}
          </p>
        )}
      </div>
    )
  }
)
Input.displayName = 'Input'
