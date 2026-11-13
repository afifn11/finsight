// components/landing/LandingHero.tsx
'use client'

import Link from 'next/link'
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  PieChart,
  Wallet,
  FileSpreadsheet,
  TrendingUp,
} from 'lucide-react'

export function LandingHero() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col selection:bg-lime-400 selection:text-zinc-950">
      {/* Top Navigation Bar */}
      <header className="border-b border-zinc-200 dark:border-zinc-800/80 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-zinc-900 dark:bg-zinc-800 border border-zinc-800 dark:border-zinc-700">
              <svg
                width="18"
                height="18"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <rect x="2.5" y="2" width="3" height="12" rx="1" fill="white" />
                <rect x="2.5" y="2" width="10" height="3" rx="1" fill="white" />
                <rect x="2.5" y="6.5" width="8" height="3" rx="1" fill="white" />
                <circle cx="13" cy="13" r="2.2" fill="#a3e635" />
              </svg>
            </div>
            <div>
              <span className="font-bold text-base tracking-tight text-zinc-900 dark:text-white">
                FinSight
              </span>
              <span className="hidden sm:inline-block ml-2 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md bg-lime-100 text-lime-800 dark:bg-lime-950/70 dark:text-lime-300 border border-lime-300/60 dark:border-lime-800">
                AI Finance
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-2.5">
            <Link
              href="/login"
              className="px-4 py-2 rounded-xl text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
            >
              Masuk
            </Link>
            <Link
              href="/register"
              className="px-4 py-2 rounded-xl text-sm font-semibold bg-lime-500 hover:bg-lime-600 text-zinc-950 dark:bg-lime-400 dark:hover:bg-lime-300 dark:text-zinc-950 transition-colors"
            >
              Daftar Gratis
            </Link>
          </div>
        </div>
      </header>

      {/* Main Hero Section */}
      <main className="flex-1 flex flex-col justify-center max-w-6xl mx-auto px-4 sm:px-6 py-16 md:py-24">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs font-medium text-zinc-700 dark:text-zinc-300">
            <Sparkles className="w-3.5 h-3.5 text-lime-600 dark:text-lime-400" />
            <span>Powered by Gemini 2.5 Flash Financial Intelligence</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-zinc-900 dark:text-white leading-[1.12]">
            Kendalikan Arus Kas &amp; Kekayaan Bersih dengan{' '}
            <span className="text-lime-600 dark:text-lime-400">Presisi AI</span>
          </h1>

          <p className="text-base sm:text-lg text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto leading-relaxed">
            Platform manajemen keuangan personal berstandar eksekutif. Lacak multi-dompet,
            ekstrak mutasi bank PDF/CSV otomatis, pantau tagihan berulang, dan konsultasikan
            keputusan finansialmu bersama AI Copilot secara real-time.
          </p>

          {/* Primary & Interactive Demo CTAs */}
          <div className="pt-3 flex flex-col sm:flex-row items-center justify-center gap-3.5">
            <Link
              href="/register"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-lime-500 hover:bg-lime-600 text-zinc-950 dark:bg-lime-400 dark:hover:bg-lime-300 dark:text-zinc-950 text-sm font-semibold transition-all"
            >
              <span>Mulai Gratis Sekarang</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href="/api/auth/demo-session"
              className="w-full sm:w-auto inline-flex items-center justify-center px-5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-900 dark:text-zinc-100 text-sm font-medium transition-colors"
            >
              Coba Demo Interaktif →
            </Link>
          </div>

          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Tanpa kartu kredit • Mode Sandbox langsung aktif dengan data simulasi lengkap
          </p>
        </div>

        {/* Feature Highlights Grid */}
        <div className="mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-2.5">
            <div className="w-9 h-9 rounded-xl bg-lime-50 dark:bg-lime-950/50 border border-lime-200 dark:border-lime-800 flex items-center justify-center text-lime-600 dark:text-lime-400">
              <Wallet className="w-4 h-4" />
            </div>
            <h3 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">
              Multi-Wallet &amp; Net Worth
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
              Konsolidasi saldo rekening bank, e-wallet, kas, dan portofolio investasi dalam satu
              layar terpadu.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-2.5">
            <div className="w-9 h-9 rounded-xl bg-lime-50 dark:bg-lime-950/50 border border-lime-200 dark:border-lime-800 flex items-center justify-center text-lime-600 dark:text-lime-400">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <h3 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">
              AI Bank Statement Parser
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
              Unggah PDF atau CSV mutasi rekening koran dan biarkan AI mengkategorikan transaksi
              secara instan.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-2.5">
            <div className="w-9 h-9 rounded-xl bg-lime-50 dark:bg-lime-950/50 border border-lime-200 dark:border-lime-800 flex items-center justify-center text-lime-600 dark:text-lime-400">
              <PieChart className="w-4 h-4" />
            </div>
            <h3 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">
              Smart Budget &amp; Tagihan
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
              Tetapkan batas pengeluaran per kategori dengan peringatan proaktif serta kalender
              tagihan berulang.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-2.5">
            <div className="w-9 h-9 rounded-xl bg-lime-50 dark:bg-lime-950/50 border border-lime-200 dark:border-lime-800 flex items-center justify-center text-lime-600 dark:text-lime-400">
              <TrendingUp className="w-4 h-4" />
            </div>
            <h3 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">
              Laporan PDF Eksekutif
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
              Cetak laporan analitik arus kas bulanan berformat dokumen resmi A4 sekali klik.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-200 dark:border-zinc-800/80 py-6 px-4 sm:px-6 text-xs text-zinc-500 dark:text-zinc-400">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-lime-600 dark:text-lime-400" />
            <span>FinSight Personal Finance • Enkripsi sesi terproteksi</span>
          </div>
          <div>© {new Date().getFullYear()} FinSight. All rights reserved.</div>
        </div>
      </footer>
    </div>
  )
}
