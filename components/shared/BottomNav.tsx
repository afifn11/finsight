// components/shared/BottomNav.tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, ArrowLeftRight,
  PiggyBank, BarChart3, Settings,
} from 'lucide-react'

const NAV_ITEMS = [
  { label: 'Dashboard', href: '/', icon: LayoutDashboard },
  { label: 'Transaksi', href: '/transactions', icon: ArrowLeftRight },
  { label: 'Budget', href: '/budgets', icon: PiggyBank },
  { label: 'Analitik', href: '/analytics', icon: BarChart3 },
  { label: 'Pengaturan', href: '/settings', icon: Settings },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 flex md:hidden border-t"
      style={{
        background: 'var(--bg-card)',
        borderColor: 'var(--border-default)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon
        const isActive =
          item.href === '/' ? pathname === '/' : pathname.startsWith(item.href)

        return (
          <Link
            key={item.href}
            href={item.href}
            className="flex flex-1 flex-col items-center justify-center py-2 gap-0.5 transition-colors"
            style={{
              color: isActive ? 'var(--color-primary-700)' : 'var(--text-muted)',
            }}
          >
            <Icon
              className="w-5 h-5"
              strokeWidth={isActive ? 2.5 : 1.8}
            />
            <span
              className="text-[10px]"
              style={{ fontWeight: isActive ? 600 : 400 }}
            >
              {item.label}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}