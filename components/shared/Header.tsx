// components/shared/Header.tsx
'use client'

import { useState, useEffect } from 'react'
import { signOut } from 'next-auth/react'
import Link from 'next/link'
import { Bell, LogOut } from 'lucide-react'
import { ThemeToggle } from './ThemeToggle'
import { getInitials, getBudgetStatus, formatCurrencyShort } from '@/lib/utils'
import type { BudgetWithCategory } from '@/types'

interface HeaderProps {
  user: { name?: string | null; email: string; image?: string | null }
}

interface BudgetAlert {
  id: string
  categoryName: string
  percentage: number
  spent: number
  amount: number
}

export function Header({ user }: HeaderProps) {
  const [alerts, setAlerts] = useState<BudgetAlert[]>([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [visible, setVisible] = useState(true)
  const [isMobile, setIsMobile] = useState(false)

  // Deteksi mobile sekali saat mount, update saat resize
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  useEffect(() => {
    const scrollEl = document.querySelector('main') as HTMLElement | null
    if (!scrollEl) return

    let lastY = scrollEl.scrollTop
    let ticking = false

    function onScroll() {
      if (ticking) return
      ticking = true
      requestAnimationFrame(() => {
        if (!scrollEl) return
        const currentY = scrollEl.scrollTop
        const diff = currentY - lastY
        if (window.innerWidth < 768) {
          if (diff > 4 && currentY > 60) {
            setVisible(false)
          } else if (diff < -4) {
            setVisible(true)
          }
        }
        lastY = currentY
        ticking = false
      })
    }

    scrollEl.addEventListener('scroll', onScroll, { passive: true })
    return () => scrollEl.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    // Fetch budgets dan cek yang mendekati/melewati limit
    fetch('/api/budgets')
      .then((r) => r.json())
      .then((json: { data: BudgetWithCategory[] }) => {
        const nearLimit = json.data
          .filter((b) => b.percentage >= 80)
          .map((b) => ({
            id: b.id,
            categoryName: b.category.name,
            percentage: b.percentage,
            spent: b.spent,
            amount: Number(b.amount),
          }))
        setAlerts(nearLimit)
      })
      .catch(() => {})
  }, [])

  const alertCount = alerts.length

  return (
    <header
        className="fixed top-0 left-0 right-0 md:static flex items-center justify-between px-4 md:px-6 h-16 shrink-0 border-b"
        style={{
          background: 'var(--bg-card)',
          borderColor: 'var(--border-default)',
          zIndex: 30,
          // Hanya hide di mobile — desktop selalu translateY(0)
          transform: (isMobile && !visible) ? 'translateY(-100%)' : 'translateY(0)',
          transition: 'transform 0.28s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
      {/* Mobile: logo — hamburger dihapus karena navigasi menggunakan BottomNav */}
      <Link href="/" className="md:hidden flex items-center gap-2">
        <div
          className="flex items-center justify-center w-7 h-7 rounded-lg shrink-0"
          style={{ background: 'var(--color-primary-800)' }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="2" y="2" width="3" height="10" rx="1" fill="white"/>
            <rect x="2" y="2" width="9" height="2.5" rx="1" fill="white"/>
            <rect x="2" y="6" width="7" height="2.5" rx="1" fill="white"/>
            <circle cx="11" cy="11" r="2" fill="#4ade80"/>
          </svg>
        </div>
        <span className="font-semibold text-base" style={{ color: 'var(--color-primary-800)' }}>
          FinSight
        </span>
      </Link>

      <div className="hidden md:block" />

      {/* Right actions */}
      <div className="flex items-center gap-2">
        {/* Theme toggle */}
        <ThemeToggle />

        {/* Notification bell */}
        <div className="relative">
          <button
            onClick={() => setShowDropdown((o) => !o)}
            className="relative flex items-center justify-center w-9 h-9 rounded-lg border transition-colors hover:opacity-80"
            style={{
              borderColor: 'var(--border-default)',
              background: 'var(--bg-card)',
              color: 'var(--text-secondary)',
            }}
            title={alertCount > 0 ? `${alertCount} budget mendekati limit` : 'Tidak ada notifikasi'}
          >
            <Bell className="w-4 h-4" />
            {alertCount > 0 && (
              <span
                className="absolute -top-1 -right-1 flex items-center justify-center w-4 h-4 rounded-full text-white"
                style={{ background: 'var(--color-danger-500)', fontSize: '10px', fontWeight: 600 }}
              >
                {alertCount}
              </span>
            )}
          </button>

          {/* Dropdown notifikasi */}
          {showDropdown && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowDropdown(false)} />
              <div
                className="absolute right-0 top-full mt-1 z-20 w-72 rounded-xl border shadow-lg overflow-hidden"
                style={{ background: 'var(--bg-card)', borderColor: 'var(--border-default)' }}
              >
                <div
                  className="px-4 py-3 border-b"
                  style={{ borderColor: 'var(--border-default)' }}
                >
                  <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                    Notifikasi Budget
                  </p>
                </div>

                {alertCount === 0 ? (
                  <div className="px-4 py-8 text-center">
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                      Semua budget aman
                    </p>
                    <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                      Tidak ada yang mendekati batas pengeluaran
                    </p>
                  </div>
                ) : (
                  <div className="divide-y" style={{ borderColor: 'var(--border-default)' }}>
                    {alerts.map((alert) => {
                      const status = getBudgetStatus(alert.percentage)
                      const color = status === 'exceeded'
                        ? 'var(--color-danger-500)'
                        : 'var(--color-warning-500)'

                      return (
                        <div key={alert.id} className="px-4 py-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                                {alert.categoryName}
                              </p>
                              <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                                {formatCurrencyShort(alert.spent)} dari {formatCurrencyShort(alert.amount)}
                              </p>
                            </div>
                            <span
                              className="text-xs font-semibold shrink-0"
                              style={{ color }}
                            >
                              {alert.percentage}%
                            </span>
                          </div>

                          <div
                            className="mt-2 h-1.5 rounded-full overflow-hidden"
                            style={{ background: 'var(--bg-muted)' }}
                          >
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${Math.min(alert.percentage, 100)}%`,
                                background: color,
                              }}
                            />
                          </div>

                          <p className="text-xs mt-1" style={{ color }}>
                            {status === 'exceeded'
                              ? 'Melewati batas!'
                              : 'Mendekati batas pengeluaran'}
                          </p>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Logout button — mobile only */}
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="flex md:hidden items-center justify-center w-8 h-8 rounded-lg transition-colors hover:opacity-70"
          style={{ color: 'var(--text-muted)' }}
          title="Keluar"
        >
          <LogOut className="w-4 h-4" />
        </button>

        {/* Avatar */}
        {user.image ? (
          <img
            src={user.image}
            alt={user.name ?? 'avatar'}
            className="w-8 h-8 rounded-full object-cover"
          />
        ) : (
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold text-white"
            style={{ background: 'var(--color-primary-600)' }}
          >
            {getInitials(user.name)}
          </div>
        )}
      </div>
    </header>
  )
}