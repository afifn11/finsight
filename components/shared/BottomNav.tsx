// components/shared/BottomNav.tsx
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, ArrowLeftRight, PiggyBank,
  Settings, Target, BarChart3, MoreHorizontal,
} from 'lucide-react'
import { BOTTOM_NAV_PRIMARY_ITEMS, BOTTOM_NAV_MORE_ITEMS } from '@/lib/nav-items'
import { Modal, ModalHeader, useModalIds } from '@/components/ui/Modal'

const ICON_MAP: Record<string, React.ElementType> = {
  LayoutDashboard, ArrowLeftRight, PiggyBank, Settings, Target, BarChart3,
}

export function BottomNav() {
  const pathname = usePathname()
  const [moreOpen, setMoreOpen] = useState(false)
  const { titleId } = useModalIds()

  const isActive = (href: string) => (href === '/' ? pathname === '/' : pathname.startsWith(href))
  const isMoreActive = BOTTOM_NAV_MORE_ITEMS.some((item) => isActive(item.href))

  return (
    <>
      <nav
        aria-label="Navigasi utama"
        className="fixed bottom-0 left-0 right-0 z-40 flex md:hidden border-t"
        style={{
          background: 'var(--bg-card)',
          borderColor: 'var(--border-default)',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        {BOTTOM_NAV_PRIMARY_ITEMS.map((item) => {
          const Icon = ICON_MAP[item.icon] as React.ElementType
          const active = isActive(item.href)

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? 'page' : undefined}
              className="flex flex-1 flex-col items-center justify-center py-2 gap-0.5 transition-colors"
              style={{ color: active ? 'var(--color-primary-700)' : 'var(--text-muted)' }}
            >
              <Icon className="w-5 h-5" strokeWidth={active ? 2.5 : 1.8} aria-hidden="true" />
              <span className="text-[10px]" style={{ fontWeight: active ? 600 : 400 }}>
                {item.label}
              </span>
            </Link>
          )
        })}

        <button
          type="button"
          onClick={() => setMoreOpen(true)}
          aria-haspopup="dialog"
          aria-expanded={moreOpen}
          aria-current={isMoreActive ? 'page' : undefined}
          className="flex flex-1 flex-col items-center justify-center py-2 gap-0.5 transition-colors"
          style={{ color: isMoreActive ? 'var(--color-primary-700)' : 'var(--text-muted)' }}
        >
          <MoreHorizontal className="w-5 h-5" strokeWidth={isMoreActive ? 2.5 : 1.8} aria-hidden="true" />
          <span className="text-[10px]" style={{ fontWeight: isMoreActive ? 600 : 400 }}>
            Lainnya
          </span>
        </button>
      </nav>

      <Modal open={moreOpen} onClose={() => setMoreOpen(false)} labelledBy={titleId} maxWidth="sm">
        <ModalHeader titleId={titleId} title="Lainnya" />
        <nav aria-label="Menu lainnya" className="px-3 pb-3 pt-4 space-y-1">
          {BOTTOM_NAV_MORE_ITEMS.map((item) => {
            const Icon = ICON_MAP[item.icon] as React.ElementType
            const active = isActive(item.href)

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                onClick={() => setMoreOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors"
                style={
                  active
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
      </Modal>
    </>
  )
}
