// components/ui/Modal.tsx
// Shared modal/dialog primitive.
// - Mobile: bottom sheet (matches existing Goals/Transaction modal pattern)
// - Desktop: centered dialog
// - Focus trap, Escape to close, overlay click to close, aria-labelledby/aria-describedby
'use client'

import { useEffect, useId, useRef } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/utils'

interface ModalProps {
  open: boolean
  onClose: () => void
  children: React.ReactNode
  /** Visually hidden accessible title if you're not rendering a visible <h2> yourself via ModalHeader */
  ariaLabel?: string
  /** id of the element that labels this dialog (usually rendered by ModalHeader) */
  labelledBy?: string
  /** id of the element that describes this dialog */
  describedBy?: string
  maxWidth?: 'sm' | 'md' | 'lg'
  /** Disable closing on overlay click / Escape — use for in-progress destructive actions if needed */
  disableClose?: boolean
}

const MAX_WIDTH: Record<NonNullable<ModalProps['maxWidth']>, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
}

export function Modal({
  open,
  onClose,
  children,
  ariaLabel,
  labelledBy,
  describedBy,
  maxWidth = 'sm',
  disableClose = false,
}: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null)
  const previouslyFocused = useRef<HTMLElement | null>(null)

  // Focus trap + initial focus + restore focus on close
  useEffect(() => {
    if (!open) return

    previouslyFocused.current = document.activeElement as HTMLElement | null

    const dialog = dialogRef.current
    const focusables = dialog?.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    const first = focusables?.[0]
    first?.focus()

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && !disableClose) {
        e.preventDefault()
        onClose()
        return
      }
      if (e.key === 'Tab' && focusables && focusables.length > 0) {
        const firstEl = focusables[0]
        const lastEl = focusables[focusables.length - 1]
        if (!firstEl || !lastEl) return
        if (e.shiftKey && document.activeElement === firstEl) {
          e.preventDefault()
          lastEl.focus()
        } else if (!e.shiftKey && document.activeElement === lastEl) {
          e.preventDefault()
          firstEl.focus()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
      previouslyFocused.current?.focus()
    }
  }, [open, onClose, disableClose])

  if (!open) return null

  const modal = (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: 'rgba(0,0,0,0.5)' }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !disableClose) onClose()
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={labelledBy ? undefined : ariaLabel}
        aria-labelledby={labelledBy}
        aria-describedby={describedBy}
        className={cn(
          'card w-full overflow-y-auto max-h-[90vh]',
          'rounded-b-none sm:rounded-b-lg rounded-t-2xl sm:rounded-t-lg',
          MAX_WIDTH[maxWidth]
        )}
        style={{ background: 'var(--bg-card)', boxShadow: 'var(--shadow-modal)' }}
      >
        {children}
      </div>
    </div>
  )

  if (typeof document === 'undefined') return null
  return createPortal(modal, document.body)
}

// ── Header helper — provides the id ModalHeader's <h2> gets, for aria-labelledby ──
export function ModalHeader({
  title,
  description,
  icon,
  iconColor,
  iconBg,
  titleId,
  descriptionId,
}: {
  title: string
  description?: string
  icon?: React.ReactNode
  iconColor?: string
  iconBg?: string
  titleId: string
  descriptionId?: string
}) {
  return (
    <div className="flex items-center gap-3 px-5 pt-5">
      {icon && (
        <div
          className="flex items-center justify-center w-10 h-10 rounded-full shrink-0"
          style={{ background: iconBg }}
        >
          <span style={{ color: iconColor }}>{icon}</span>
        </div>
      )}
      <div className="min-w-0">
        <h2 id={titleId} className="font-semibold" style={{ color: 'var(--text-primary)' }}>
          {title}
        </h2>
        {description && (
          <p id={descriptionId} className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {description}
          </p>
        )}
      </div>
    </div>
  )
}

// ── Convenience hook for the id pairs Modal + ModalHeader need ──
export function useModalIds() {
  const base = useId()
  return { titleId: `${base}-title`, descriptionId: `${base}-desc` }
}
