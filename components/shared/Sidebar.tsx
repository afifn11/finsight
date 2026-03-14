// components/shared/Sidebar.tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, ArrowLeftRight, PiggyBank,
  BarChart3, Settings, LogOut, TrendingUp,
} from 'lucide-react'
import { signOut } from 'next-auth/react'
import { cn, getInitials } from '@/lib/utils'
import type { NavItem } from '@/types'

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', href: '/', icon: 'LayoutDashboard' },
  { label: 'Transaksi', href: '/transactions', icon: 'ArrowLeftRight' },
  { label: 'Budget', href: '/budgets', icon: 'PiggyBank' },
  { label: 'Analitik', href: '/analytics', icon: 'BarChart3' },
  { label: 'Pengaturan', href: '/settings', icon: 'Settings' },
]

const ICON_MAP: Record<string, React.ElementType> = {
  LayoutDashboard, ArrowLeftRight, PiggyBank, BarChart3, Settings,
}

interface SidebarProps {
  user: { name?: string | null; email: string; image?: string | null }
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname()

  return (
    <aside
      className="hidden md:flex flex-col w-[260px] shrink-0 border-r h-full"
      style={{ background: 'var(--bg-card)', borderColor: 'var(--border-default)' }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2 px-6 py-5 border-b" style={{ borderColor: 'var(--border-default)' }}>
        <div
          className="flex items-center justify-center w-8 h-8 rounded-lg"
          style={{ background: 'var(--color-primary-800)' }}
        >
          <TrendingUp className="w-4 h-4 text-white" />
        </div>
        <span className="font-semibold text-lg" style={{ color: 'var(--color-primary-800)' }}>
          FinSight
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV_ITEMS.map((item) => {
          const Icon = ICON_MAP[item.icon] as React.ElementType
          const isActive =
            item.href === '/' ? pathname === '/' : pathname.startsWith(item.href)

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'text-white'
                  : 'hover:opacity-80'
              )}
              style={
                isActive
                  ? { background: 'var(--color-primary-800)', color: '#fff' }
                  : { color: 'var(--text-secondary)' }
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* User profile + logout */}
      <div className="px-3 py-4 border-t space-y-1" style={{ borderColor: 'var(--border-default)' }}>
        <div className="flex items-center gap-3 px-3 py-2">
          {/* Avatar */}
          {user.image ? (
            <img src={user.image} alt="" className="w-8 h-8 rounded-full object-cover" />
          ) : (
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold text-white shrink-0"
              style={{ background: 'var(--color-primary-600)' }}
            >
              {getInitials(user.name)}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
              {user.name ?? 'User'}
            </p>
            <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
              {user.email}
            </p>
          </div>
        </div>

        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="flex w-full items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors hover:opacity-80"
          style={{ color: 'var(--text-secondary)' }}
        >
          <LogOut className="w-4 h-4 shrink-0" />
          Keluar
        </button>
      </div>
    </aside>
  )
}
