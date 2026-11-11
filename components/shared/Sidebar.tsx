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

  const userName = user.name ?? 'User'
  const userEmail = user.email
  const userInitials = getInitials(user.name)

  return (
    <aside
      className={cn(
        'hidden md:flex flex-col shrink-0 border-r h-full transition-all duration-300 ease-in-out select-none',
        collapsed ? 'w-20 overflow-visible' : 'w-64 overflow-x-hidden'
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

      {/* Navigation Items */}
      <nav
        className={cn(
          'flex-1 space-y-1.5 px-3 py-4 custom-scrollbar',
          collapsed ? 'overflow-visible' : 'overflow-y-auto overflow-x-hidden'
        )}
      >
        {NAV_ITEMS.map((item) => {
          const isActive =
            item.href === '/' ? pathname === '/' : pathname.startsWith(item.href)
          const Icon = ICON_MAP[item.icon] as React.ElementType

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center rounded-xl font-medium select-none relative group transition-all duration-200',
                collapsed
                  ? 'w-12 h-12 justify-center mx-auto'
                  : 'w-full gap-3 px-3.5 py-2.5',
                isActive
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200'
              )}
            >
              <Icon className={cn('shrink-0', collapsed ? 'w-5 h-5' : 'w-4 h-4')} />

              {/* Text Label - ONLY render when expanded */}
              {!collapsed && (
                <span className="truncate text-sm font-medium">{item.label}</span>
              )}

              {/* Floating Tooltip - ONLY render on hover when collapsed */}
              {collapsed && (
                <div className="absolute left-[calc(100%+12px)] top-1/2 -translate-y-1/2 px-3 py-1.5 bg-slate-900 dark:bg-slate-800 text-white text-xs font-medium rounded-lg shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150 z-[100] whitespace-nowrap border border-slate-700/50">
                  {item.label}
                </div>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Bottom User Profile & Logout Section */}
      <div
        className={cn(
          'border-t border-slate-200 dark:border-slate-800/80 transition-all duration-200 bg-slate-50/50 dark:bg-slate-950/50 shrink-0',
          collapsed ? 'p-3 flex flex-col items-center gap-3' : 'p-3.5 space-y-2'
        )}
      >
        {/* Expanded View */}
        {!collapsed ? (
          <>
            <div className="flex items-center gap-3 p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 shadow-xs">
              {user.image ? (
                <img
                  src={user.image}
                  referrerPolicy="no-referrer"
                  alt={`Foto profil ${userName}`}
                  className="w-8 h-8 rounded-full object-cover shrink-0 ring-1 ring-slate-200 dark:ring-slate-700"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-semibold text-xs shrink-0">
                  {userInitials}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                  {userName}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                  {userEmail}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="w-full flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
            >
              <LogOut className="w-4 h-4 shrink-0" />
              <span>Keluar</span>
            </button>
          </>
        ) : (
          /* Collapsed View (Icon-Only, Clean Vertical Stack) */
          <>
            {/* Avatar Badge with Floating Tooltip */}
            <div className="group relative">
              {user.image ? (
                <img
                  src={user.image}
                  referrerPolicy="no-referrer"
                  alt={`Foto profil ${userName}`}
                  className="w-10 h-10 rounded-full object-cover ring-2 ring-emerald-600/30 shrink-0 cursor-default"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-semibold text-xs shadow-xs cursor-default">
                  {userInitials}
                </div>
              )}
              <div className="absolute left-[calc(100%+12px)] top-1/2 -translate-y-1/2 px-3 py-1.5 bg-slate-900 dark:bg-slate-800 text-white text-xs font-medium rounded-lg shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150 z-[100] whitespace-nowrap border border-slate-700/50">
                <p className="font-semibold">{userName}</p>
                <p className="text-[10px] text-slate-400">{userEmail}</p>
              </div>
            </div>

            {/* Logout Button with Floating Tooltip */}
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="group relative w-10 h-10 rounded-xl flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
            >
              <LogOut className="w-4.5 h-4.5 shrink-0" />
              <div className="absolute left-[calc(100%+12px)] top-1/2 -translate-y-1/2 px-3 py-1.5 bg-slate-900 text-white text-xs font-medium rounded-lg shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150 z-[100] whitespace-nowrap">
                Keluar
              </div>
            </button>
          </>
        )}
      </div>
    </aside>
  )
}
