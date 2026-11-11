// components/shared/Sidebar.tsx
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, ArrowLeftRight, PiggyBank,
  BarChart3, Settings, LogOut, Target,
  PanelLeftClose, PanelLeftOpen,
} from 'lucide-react'
import { signOut } from 'next-auth/react'
import { cn, getInitials } from '@/lib/utils'
import { NAV_ITEMS } from '@/lib/nav-items'

const ICON_MAP: Record<string, React.ElementType> = {
  LayoutDashboard, ArrowLeftRight, PiggyBank, BarChart3, Settings, Target,
}

interface SidebarProps {
  user: { name?: string | null; email: string; image?: string | null }
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    try {
      const saved = localStorage.getItem('finsight-sidebar-collapsed')
      if (saved !== null) {
        setIsCollapsed(saved === 'true')
      }
    } catch {}
  }, [])

  const toggleSidebar = () => {
    setIsCollapsed((prev) => {
      const next = !prev
      try {
        localStorage.setItem('finsight-sidebar-collapsed', String(next))
      } catch {}
      return next
    })
  }

  // Use false during SSR to avoid hydration mismatch
  const collapsed = mounted ? isCollapsed : false

  return (
    <aside
      className={cn(
        'hidden md:flex flex-col shrink-0 border-r h-full transition-all duration-300 ease-in-out select-none overflow-x-hidden',
        collapsed ? 'w-20' : 'w-64'
      )}
      style={{ background: 'var(--bg-card)', borderColor: 'var(--border-default)' }}
    >
      {/* Header Logo & Toggle */}
      <div
        className={cn(
          'flex items-center border-b transition-all duration-300 shrink-0',
          collapsed ? 'flex-col items-center justify-center gap-3 p-3' : 'justify-between px-4 py-4'
        )}
        style={{ borderColor: 'var(--border-default)' }}
      >
        <Link
          href="/"
          aria-label="FinSight — ke Dashboard"
          className={cn(
            'flex items-center gap-2.5 transition-opacity hover:opacity-90',
            collapsed && 'justify-center'
          )}
        >
          <div
            className="flex items-center justify-center w-8 h-8 rounded-lg shrink-0 shadow-sm"
            style={{ background: 'var(--color-primary-800)' }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <rect x="2.5" y="2" width="3" height="12" rx="1" fill="white"/>
              <rect x="2.5" y="2" width="10" height="3" rx="1" fill="white"/>
              <rect x="2.5" y="6.5" width="8" height="3" rx="1" fill="white"/>
              <circle cx="13" cy="13" r="2.2" fill="#4ade80"/>
            </svg>
          </div>
          {!collapsed && (
            <div className="min-w-0 transition-opacity duration-200">
              <span className="font-bold text-base tracking-tight leading-none text-slate-900 dark:text-slate-100">
                FinSight
              </span>
              <p className="text-[11px] leading-none mt-1 font-medium text-slate-500 dark:text-slate-400">
                Personal Finance
              </p>
            </div>
          )}
        </Link>

        {/* Collapse / Expand Toggle Button */}
        <button
          type="button"
          onClick={toggleSidebar}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors shrink-0"
          title={collapsed ? 'Bentangkan sidebar' : 'Ciutkan sidebar'}
          aria-label={collapsed ? 'Bentangkan sidebar' : 'Ciutkan sidebar'}
        >
          {collapsed ? (
            <PanelLeftOpen className="w-4 h-4" />
          ) : (
            <PanelLeftClose className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav aria-label="Navigasi utama" className="flex-1 px-3 py-4 space-y-2 overflow-y-auto overflow-x-hidden">
        {NAV_ITEMS.map((item) => {
          const Icon = ICON_MAP[item.icon] as React.ElementType
          const isActive =
            item.href === '/' ? pathname === '/' : pathname.startsWith(item.href)

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? 'page' : undefined}
              title={item.label}
              className={cn(
                'relative group flex items-center transition-colors',
                collapsed ? 'justify-center' : 'gap-3 px-3 py-2.5 rounded-lg text-sm font-medium',
                !collapsed && (
                  isActive
                    ? 'bg-emerald-600 text-white shadow-xs font-semibold'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                )
              )}
            >
              {collapsed ? (
                <div
                  className={cn(
                    'w-10 h-10 flex items-center justify-center rounded-xl transition-colors',
                    isActive
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-400 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                  )}
                >
                  <Icon className="w-5 h-5 shrink-0" aria-hidden="true" />
                </div>
              ) : (
                <>
                  <Icon className="w-5 h-5 shrink-0" aria-hidden="true" />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </>
              )}

              {/* Floating tooltip when collapsed */}
              {collapsed && (
                <span className="absolute left-full ml-2 px-2.5 py-1 text-xs bg-slate-900 text-white rounded-md shadow-md pointer-events-none z-50 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                  {item.label}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Bottom User Profile & Logout Section */}
      <div
        className={cn(
          'border-t transition-all duration-300 shrink-0',
          collapsed ? 'p-3 flex flex-col items-center gap-3' : 'p-3 space-y-2'
        )}
        style={{ borderColor: 'var(--border-default)' }}
      >
        {collapsed ? (
          <>
            {/* User Avatar Container */}
            <div className="relative group flex items-center justify-center">
              {user.image ? (
                <img
                  src={user.image}
                  referrerPolicy="no-referrer"
                  alt={`Foto profil ${user.name ?? user.email}`}
                  className="w-10 h-10 rounded-full object-cover ring-2 ring-emerald-600/30 shrink-0"
                />
              ) : (
                <div
                  className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-medium text-xs shadow-xs shrink-0"
                  aria-hidden="true"
                >
                  {getInitials(user.name)}
                </div>
              )}
              <span className="absolute left-full ml-2 px-2.5 py-1 text-xs bg-slate-900 text-white rounded-md shadow-md pointer-events-none z-50 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                {user.name ?? 'User'}
              </span>
            </div>

            {/* Logout Button Container */}
            <div className="relative group flex items-center justify-center">
              <button
                type="button"
                onClick={() => signOut({ callbackUrl: '/login' })}
                className="w-10 h-10 flex items-center justify-center rounded-xl text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                title="Keluar"
                aria-label="Keluar dari akun"
              >
                <LogOut className="w-5 h-5 shrink-0" aria-hidden="true" />
              </button>
              <span className="absolute left-full ml-2 px-2.5 py-1 text-xs bg-slate-900 text-white rounded-md shadow-md pointer-events-none z-50 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                Keluar
              </span>
            </div>
          </>
        ) : (
          <>
            {/* User Profile Info */}
            <div className="flex items-center gap-3 px-2 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
              {user.image ? (
                <img
                  src={user.image}
                  referrerPolicy="no-referrer"
                  alt={`Foto profil ${user.name ?? user.email}`}
                  className="w-9 h-9 rounded-full object-cover shrink-0 ring-1 ring-slate-200 dark:ring-slate-700"
                />
              ) : (
                <div
                  className="w-9 h-9 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-semibold shrink-0 shadow-xs"
                  aria-hidden="true"
                >
                  {getInitials(user.name)}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate text-slate-900 dark:text-slate-100">
                  {user.name ?? 'User'}
                </p>
                <p className="text-xs truncate text-slate-500 dark:text-slate-400">
                  {user.email}
                </p>
              </div>
            </div>

            {/* Logout Button */}
            <div className="pt-1">
              <button
                type="button"
                onClick={() => signOut({ callbackUrl: '/login' })}
                className="flex w-full items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors"
                title="Keluar dari akun"
              >
                <LogOut className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>Keluar</span>
              </button>
            </div>
          </>
        )}
      </div>
    </aside>
  )
}
