// components/shared/BottomNav.tsx
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, ArrowLeftRight, PiggyBank,
  Settings, Target, BarChart3, MoreHorizontal,
  ScanLine, Pencil, Camera,
} from 'lucide-react'
import { BOTTOM_NAV_LEFT_ITEMS, BOTTOM_NAV_RIGHT_ITEMS, BOTTOM_NAV_MORE_ITEMS } from '@/lib/nav-items'
import { Modal, ModalHeader, useModalIds } from '@/components/ui/Modal'
import { useQuickAdd } from '@/components/transactions/QuickAddProvider'

const ICON_MAP: Record<string, React.ElementType> = {
  LayoutDashboard, ArrowLeftRight, PiggyBank, Settings, Target, BarChart3,
}

function NavLink({ item, isActive }: { item: { label: string; href: string; icon: string }; isActive: boolean }) {
  const Icon = ICON_MAP[item.icon] as React.ElementType
  return (
    <Link
      href={item.href}
      aria-current={isActive ? 'page' : undefined}
      className="flex flex-1 flex-col items-center justify-center py-2 gap-0.5 transition-colors"
      style={{ color: isActive ? 'var(--color-primary-700)' : 'var(--text-muted)' }}
    >
      <Icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 1.8} aria-hidden="true" />
      <span className="text-[10px]" style={{ fontWeight: isActive ? 600 : 400 }}>
        {item.label}
      </span>
    </Link>
  )
}

export function BottomNav() {
  const pathname = usePathname()
  const [moreOpen, setMoreOpen] = useState(false)
  const [scanChoiceOpen, setScanChoiceOpen] = useState(false)
  const moreIds = useModalIds()
  const scanIds = useModalIds()
  const { openAdd, openScan } = useQuickAdd()

  const isActive = (href: string) => (href === '/' ? pathname === '/' : pathname.startsWith(href))
  const isMoreActive = BOTTOM_NAV_MORE_ITEMS.some((item) => isActive(item.href))

  return (
    <>
      <nav
        aria-label="Navigasi utama"
        className="fixed bottom-0 left-0 right-0 z-40 flex items-end md:hidden border-t"
        style={{
          background: 'var(--bg-card)',
          borderColor: 'var(--border-default)',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        {BOTTOM_NAV_LEFT_ITEMS.map((item) => (
          <NavLink key={item.href} item={item} isActive={isActive(item.href)} />
        ))}

        {/* Scan FAB — the star feature gets the visually elevated center slot,
            rather than being buried as a button inside the add-transaction form. */}
        <div className="flex flex-1 flex-col items-center justify-end pb-1.5">
          <button
            type="button"
            onClick={() => setScanChoiceOpen(true)}
            aria-haspopup="dialog"
            aria-expanded={scanChoiceOpen}
            aria-label="Tambah transaksi atau scan struk"
            className="flex items-center justify-center w-14 h-14 rounded-full -mt-7 transition-transform active:scale-95"
            style={{
              background: 'var(--color-primary-800)',
              boxShadow: 'var(--shadow-modal)',
              border: '3px solid var(--bg-card)',
            }}
          >
            <ScanLine className="w-6 h-6 text-white" aria-hidden="true" />
          </button>
          <span className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>Scan</span>
        </div>

        {BOTTOM_NAV_RIGHT_ITEMS.map((item) => (
          <NavLink key={item.href} item={item} isActive={isActive(item.href)} />
        ))}

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

      {/* "Lainnya" sheet — remaining nav destinations */}
      <Modal open={moreOpen} onClose={() => setMoreOpen(false)} labelledBy={moreIds.titleId} maxWidth="sm">
        <ModalHeader titleId={moreIds.titleId} title="Lainnya" />
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

      {/* Scan FAB choice sheet — "Scan Struk" vs "Tambah Manual" */}
      <Modal open={scanChoiceOpen} onClose={() => setScanChoiceOpen(false)} labelledBy={scanIds.titleId} maxWidth="sm">
        <ModalHeader titleId={scanIds.titleId} title="Tambah Transaksi" />
        <div className="px-3 pb-4 pt-3 space-y-2">
          <button
            type="button"
            onClick={() => { setScanChoiceOpen(false); openScan() }}
            className="flex items-center gap-3 w-full p-3 rounded-xl border text-left transition-colors hover:opacity-90"
            style={{ borderColor: 'var(--color-primary-600)', background: 'var(--color-primary-50)' }}
          >
            <span
              className="flex items-center justify-center w-10 h-10 rounded-full shrink-0"
              style={{ background: 'var(--color-primary-800)' }}
            >
              <Camera className="w-5 h-5 text-white" aria-hidden="true" />
            </span>
            <span>
              <span className="block text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                Scan Struk
              </span>
              <span className="block text-xs" style={{ color: 'var(--text-secondary)' }}>
                Foto atau upload struk — data terisi otomatis
              </span>
            </span>
          </button>

          <button
            type="button"
            onClick={() => { setScanChoiceOpen(false); openAdd() }}
            className="flex items-center gap-3 w-full p-3 rounded-xl border text-left transition-colors hover:opacity-80"
            style={{ borderColor: 'var(--border-default)', background: 'var(--bg-card)' }}
          >
            <span
              className="flex items-center justify-center w-10 h-10 rounded-full shrink-0"
              style={{ background: 'var(--bg-muted)' }}
            >
              <Pencil className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} aria-hidden="true" />
            </span>
            <span>
              <span className="block text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                Tambah Manual
              </span>
              <span className="block text-xs" style={{ color: 'var(--text-secondary)' }}>
                Isi form transaksi sendiri
              </span>
            </span>
          </button>
        </div>
      </Modal>
    </>
  )
}
