// components/shared/Header.tsx
'use client'

import { Bell, Menu } from 'lucide-react'
import { getInitials } from '@/lib/utils'

interface HeaderProps {
  user: { name?: string | null; email: string; image?: string | null }
}

export function Header({ user }: HeaderProps) {
  return (
    <header
      className="flex items-center justify-between px-4 md:px-6 h-16 shrink-0 border-b"
      style={{
        background: 'var(--bg-card)',
        borderColor: 'var(--border-default)',
      }}
    >
      {/* Mobile: hamburger (future mobile nav) */}
      <button className="md:hidden p-2 rounded-lg" style={{ color: 'var(--text-secondary)' }}>
        <Menu className="w-5 h-5" />
      </button>

      {/* Desktop: page context (empty space, title comes from page) */}
      <div className="hidden md:block" />

      {/* Right actions */}
      <div className="flex items-center gap-2">
        {/* Notification bell (placeholder) */}
        <button
          className="relative p-2 rounded-lg transition-colors hover:opacity-80"
          style={{ color: 'var(--text-secondary)' }}
        >
          <Bell className="w-5 h-5" />
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
