// lib/nav-items.ts
// Single source of truth for app navigation. Consumed by both Sidebar (desktop)
// and BottomNav (mobile) so the two surfaces can't drift out of sync — this is
// what caused Analytics to be reachable on desktop but not on mobile.
import type { NavItem } from '@/types'

// Full nav — used by the desktop Sidebar, which has room for all items.
export const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', href: '/', icon: 'LayoutDashboard' },
  { label: 'Transaksi', href: '/transactions', icon: 'ArrowLeftRight' },
  { label: 'Budget', href: '/budgets', icon: 'PiggyBank' },
  { label: 'Goals', href: '/goals', icon: 'Target' },
  { label: 'Analitik', href: '/analytics', icon: 'BarChart3' },
  { label: 'Pengaturan', href: '/settings', icon: 'Settings' },
]

// Mobile bottom nav layout: 2 items — [Scan FAB] — 2 items, where the FAB is
// the elevated, star "Scan Struk" action (not a navigation link). Fewer direct
// slots than before because the FAB takes the visual center; the item bumped
// out (Goals) moves into "Lainnya" alongside Analytics/Settings.
export const BOTTOM_NAV_LEFT_ITEMS: NavItem[] = [
  NAV_ITEMS[0]!, // Dashboard
  NAV_ITEMS[1]!, // Transaksi
]

export const BOTTOM_NAV_RIGHT_ITEMS: NavItem[] = [
  NAV_ITEMS[2]!, // Budget
]

export const BOTTOM_NAV_MORE_ITEMS: NavItem[] = [
  NAV_ITEMS[3]!, // Goals
  NAV_ITEMS[4]!, // Analitik
  NAV_ITEMS[5]!, // Pengaturan
]
