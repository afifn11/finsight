// components/budgets/BudgetAlerts.tsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import { Bell, BellRing, X, AlertTriangle, TrendingUp } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface BudgetAlert {
  id: string
  categoryName: string
  categoryColor: string
  budgetAmount: number
  spent: number
  percentage: number
  threshold: number
  triggeredAt: string
}

export function BudgetAlertBell() {
  const [alerts, setAlerts] = useState<BudgetAlert[]>([])
  const [open, setOpen] = useState(false)

  const fetchAlerts = useCallback(async () => {
    try {
      const res = await fetch('/api/budgets/check-alerts')
      if (!res.ok) return
      const json = await res.json()
      setAlerts(json.data ?? [])
    } catch {
      // silent
    }
  }, [])

  useEffect(() => {
    fetchAlerts()
    // Refresh every 5 minutes
    const interval = setInterval(fetchAlerts, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [fetchAlerts])

  const hasAlerts = alerts.length > 0

  return (
    <div className="relative">
      <button
        onClick={() => { setOpen((o) => !o); if (!open) fetchAlerts() }}
        className="relative flex items-center justify-center w-8 h-8 rounded-lg transition-colors hover:opacity-70"
        style={{ color: hasAlerts ? 'var(--color-warning-500, #f59e0b)' : 'var(--text-muted)' }}
        title="Budget alerts"
      >
        {hasAlerts ? (
          <BellRing className="w-4 h-4" />
        ) : (
          <Bell className="w-4 h-4" />
        )}
        {hasAlerts && (
          <span
            className="absolute -top-0.5 -right-0.5 flex items-center justify-center w-4 h-4 rounded-full text-[10px] font-bold text-white"
            style={{ background: 'var(--color-danger-500)' }}
          >
            {alerts.length > 9 ? '9+' : alerts.length}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div
            className="absolute right-0 top-full mt-2 z-40 w-80 rounded-2xl border shadow-lg overflow-hidden"
            style={{ background: 'var(--bg-card)', borderColor: 'var(--border-default)' }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-4 py-3 border-b"
              style={{ borderColor: 'var(--border-default)' }}
            >
              <div className="flex items-center gap-2">
                <BellRing className="w-4 h-4" style={{ color: 'var(--color-warning-500, #f59e0b)' }} />
                <span className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                  Budget Alert
                </span>
              </div>
              <button onClick={() => setOpen(false)} style={{ color: 'var(--text-muted)' }}>
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Alert list */}
            <div className="max-h-80 overflow-y-auto">
              {alerts.length === 0 ? (
                <div className="p-8 text-center">
                  <Bell className="w-8 h-8 mx-auto mb-2" style={{ color: 'var(--text-muted)' }} />
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                    Semua budget aman bulan ini
                  </p>
                </div>
              ) : (
                <div className="p-2 space-y-1">
                  {alerts.map((alert) => (
                    <AlertCard key={alert.id} alert={alert} />
                  ))}
                </div>
              )}
            </div>

            {alerts.length > 0 && (
              <div
                className="px-4 py-2 border-t text-center"
                style={{ borderColor: 'var(--border-default)' }}
              >
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  Alert otomatis saat pengeluaran melewati threshold
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

function AlertCard({ alert }: { alert: BudgetAlert }) {
  const isOver = alert.percentage >= 100
  const statusColor = isOver ? 'var(--color-danger-500)' : '#f59e0b'
  const bgColor = isOver ? 'var(--color-danger-500)' + '15' : '#f59e0b15'

  return (
    <div
      className="flex items-start gap-3 p-3 rounded-xl"
      style={{ background: bgColor }}
    >
      <div
        className="flex items-center justify-center w-8 h-8 rounded-lg shrink-0"
        style={{ background: alert.categoryColor + '22' }}
      >
        {isOver
          ? <AlertTriangle className="w-4 h-4" style={{ color: statusColor }} />
          : <TrendingUp className="w-4 h-4" style={{ color: statusColor }} />
        }
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
          {alert.categoryName}
        </p>
        <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
          {isOver
            ? `Melebihi budget! ${alert.percentage}% terpakai`
            : `${alert.percentage}% dari budget terpakai`
          }
        </p>
        <div className="mt-1.5 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-muted)' }}>
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${Math.min(alert.percentage, 100)}%`,
              background: statusColor,
            }}
          />
        </div>
        <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
          {formatCurrency(alert.spent)} / {formatCurrency(alert.budgetAmount)}
        </p>
      </div>
    </div>
  )
}