// components/shared/Sidebar.tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, ArrowLeftRight, PiggyBank,
  BarChart3, Settings, LogOut, Target,
} from 'lucide-react'
import { signOut } from 'next-auth/react'
import { cn, getInitials } from '@/lib/utils'
import type { NavItem } from '@/types'

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', href: '/', icon: 'LayoutDashboard' },
  { label: 'Transaksi', href: '/transactions', icon: 'ArrowLeftRight' },
  { label: 'Budget', href: '/budgets', icon: 'PiggyBank' },
  { label: 'Goals', href: '/goals', icon: 'Target' },
  { label: 'Analitik', href: '/analytics', icon: 'BarChart3' },
  { label: 'Pengaturan', href: '/settings', icon: 'Settings' },
]

const ICON_MAP: Record<string, React.ElementType> = {
  LayoutDashboard, ArrowLeftRight, PiggyBank, BarChart3, Settings, Target,
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
      <Link
        href="/"
        aria-label="FinSight — ke Dashboard"
        className="flex items-center gap-2.5 px-6 py-5 border-b hover:opacity-90 transition-opacity"
        style={{ borderColor: 'var(--border-default)' }}
      >
        <div
          className="flex items-center justify-center w-8 h-8 rounded-lg shrink-0"
          style={{ background: 'var(--color-primary-800)' }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <rect x="2.5" y="2" width="3" height="12" rx="1" fill="white"/>
            <rect x="2.5" y="2" width="10" height="3" rx="1" fill="white"/>
            <rect x="2.5" y="6.5" width="8" height="3" rx="1" fill="white"/>
            <circle cx="13" cy="13" r="2.2" fill="#4ade80"/>
          </svg>
        </div>
        <div>
          <span className="font-bold text-lg leading-none" style={{ color: 'var(--color-primary-800)' }}>
            FinSight
          </span>
          <p className="text-xs leading-none mt-0.5" style={{ color: 'var(--text-muted)' }}>
            Personal Finance
          </p>
        </div>
      </Link>

      {/* Navigation */}
      <nav aria-label="Navigasi utama" className="flex-1 px-3 py-4 space-y-1">
        {NAV_ITEMS.map((item) => {
          const Icon = ICON_MAP[item.icon] as React.ElementType
          const isActive =
            item.href === '/' ? pathname === '/' : pathname.startsWith(item.href)

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? 'page' : undefined}
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
              <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
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
            <img
              src={user.image}
              referrerPolicy="no-referrer"
              alt={`Foto profil ${user.name ?? user.email}`}
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold text-white shrink-0"
              style={{ background: 'var(--color-primary-600)' }}
              aria-hidden="true"
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
          <LogOut className="w-4 h-4 shrink-0" aria-hidden="true" />
          Keluar
        </button>
      </div>
    </aside>
  )
}