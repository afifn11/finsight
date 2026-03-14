// components/ui/Skeleton.tsx
// Reusable skeleton loading components used across the app

import { cn } from '@/lib/utils'

// ── Base skeleton pulse ────────────────────────────────────────
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn('animate-pulse rounded-md', className)}
      style={{ background: 'var(--bg-muted)' }}
    />
  )
}

// ── Transaction row skeleton ───────────────────────────────────
export function TransactionRowSkeleton() {
  return (
    <div
      className="flex items-center gap-3 px-3 py-3 rounded-xl border"
      style={{ background: 'var(--bg-card)', borderColor: 'var(--border-default)' }}
    >
      <Skeleton className="w-9 h-9 rounded-lg shrink-0" />
      <div className="flex-1 space-y-2 min-w-0">
        <Skeleton className="h-3.5 w-3/5 rounded" />
        <Skeleton className="h-3 w-2/5 rounded" />
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Skeleton className="h-3.5 w-20 rounded" />
        <Skeleton className="h-6 w-6 rounded-md" />
        <Skeleton className="h-6 w-6 rounded-md" />
      </div>
    </div>
  )
}

// ── Budget card skeleton ───────────────────────────────────────
export function BudgetCardSkeleton() {
  return (
    <div
      className="card p-5 space-y-4"
      style={{ background: 'var(--bg-card)' }}
    >
      <div className="flex items-center gap-3">
        <Skeleton className="w-10 h-10 rounded-xl shrink-0" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-32 rounded" />
          <Skeleton className="h-3 w-16 rounded" />
        </div>
        <div className="flex gap-1">
          <Skeleton className="h-7 w-7 rounded-md" />
          <Skeleton className="h-7 w-7 rounded-md" />
        </div>
      </div>
      <div className="flex justify-between">
        <Skeleton className="h-7 w-24 rounded" />
        <Skeleton className="h-4 w-16 rounded" />
      </div>
      <Skeleton className="h-2.5 w-full rounded-full" />
      <div className="flex justify-between">
        <Skeleton className="h-3 w-20 rounded" />
        <Skeleton className="h-3 w-20 rounded" />
      </div>
    </div>
  )
}

// ── Summary card skeleton (dashboard) ─────────────────────────
export function SummaryCardSkeleton() {
  return (
    <div className="card p-5 space-y-3" style={{ background: 'var(--bg-card)' }}>
      <div className="flex items-start justify-between">
        <Skeleton className="h-3.5 w-28 rounded" />
        <Skeleton className="w-9 h-9 rounded-lg" />
      </div>
      <Skeleton className="h-8 w-36 rounded" />
      <Skeleton className="h-3 w-24 rounded" />
    </div>
  )
}

// ── Generic card skeleton ──────────────────────────────────────
export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn('card p-5 animate-pulse', className)}
      style={{ background: 'var(--bg-muted)' }}
    />
  )
}