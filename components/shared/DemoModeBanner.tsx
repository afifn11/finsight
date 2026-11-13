// components/shared/DemoModeBanner.tsx
'use client'

import { signOut } from 'next-auth/react'
import { Sparkles, LogOut } from 'lucide-react'

export function DemoModeBanner() {
  return (
    <div className="w-full bg-lime-500 dark:bg-lime-400 text-zinc-950 px-4 py-2 text-xs font-medium flex items-center justify-between gap-3 border-b border-lime-600/20 shrink-0 z-30">
      <div className="flex items-center gap-2 min-w-0">
        <Sparkles className="w-3.5 h-3.5 shrink-0" />
        <span className="truncate font-semibold">
          Anda sedang berada dalam Mode Demo Interaktif.
        </span>
        <span className="hidden md:inline text-zinc-800 font-normal">
          Jelajahi seluruh fitur secara langsung dengan data simulasi.
        </span>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: '/register' })}
          className="px-2.5 py-1 rounded-lg bg-zinc-950 text-white hover:bg-zinc-800 text-[11px] font-semibold transition-colors"
        >
          Buat Akun Asli
        </button>
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="inline-flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-black/10 text-zinc-950 text-[11px] font-semibold transition-colors"
          title="Keluar dari Mode Demo"
        >
          <LogOut className="w-3 h-3" />
          <span className="hidden sm:inline">Keluar Demo</span>
        </button>
      </div>
    </div>
  )
}
