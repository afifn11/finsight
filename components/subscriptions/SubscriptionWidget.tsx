// components/subscriptions/SubscriptionWidget.tsx
'use client'

import { useState } from 'react'
import {
  Plus,
  CheckCircle2,
  CreditCard,
  Repeat,
  Trash2,
  X,
} from 'lucide-react'
import { format, isToday, isBefore, startOfDay, differenceInDays, addDays } from 'date-fns'
import { id as localeId } from 'date-fns/locale'
import { toast } from 'sonner'
import { useSubscriptions } from '@/hooks'
import type { Subscription, SubscriptionCycle } from '@/types'

function formatRupiah(num: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(num)
}

function getCycleLabel(cycle: SubscriptionCycle): string {
  switch (cycle) {
    case 'WEEKLY':
      return 'Mingguan'
    case 'YEARLY':
      return 'Tahunan'
    case 'MONTHLY':
    default:
      return 'Bulanan'
  }
}

export function SubscriptionWidget() {
  const { subscriptions, monthlyCommitment, isLoading, refresh } = useSubscriptions()
  const [activeTab, setActiveTab] = useState<'list' | 'calendar'>('list')
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [advancingId, setAdvancingId] = useState<string | null>(null)

  // Form state
  const [name, setName] = useState('')
  const [amount, setAmount] = useState('')
  const [billingCycle, setBillingCycle] = useState<SubscriptionCycle>('MONTHLY')
  const [nextBillingDate, setNextBillingDate] = useState(
    format(addDays(new Date(), 7), 'yyyy-MM-dd')
  )
  const [category, setCategory] = useState('Langganan')
  const [color, setColor] = useState('#8b5cf6')
  const [notes, setNotes] = useState('')

  // Quick mark paid / advance billing cycle
  const handleAdvanceCycle = async (sub: Subscription) => {
    setAdvancingId(sub.id)
    try {
      const res = await fetch(`/api/subscriptions/${sub.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ advanceCycle: true }),
      })

      if (!res.ok) throw new Error('Gagal memperbarui siklus tagihan')

      toast.success(`${sub.name} berhasil diperbarui ke siklus berikutnya!`)
      await refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Terjadi kesalahan')
    } finally {
      setAdvancingId(null)
    }
  }

  // Delete subscription
  const handleDelete = async (id: string, subName: string) => {
    if (!confirm(`Hapus langganan "${subName}"?`)) return
    try {
      const res = await fetch(`/api/subscriptions/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Gagal menghapus langganan')
      toast.success('Langganan berhasil dihapus')
      await refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Terjadi kesalahan')
    }
  }

  // Handle add form submission
  const handleCreateSubscription = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !amount) {
      toast.error('Nama dan nominal wajib diisi')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          amount: parseFloat(amount),
          billingCycle,
          nextBillingDate: new Date(nextBillingDate),
          category,
          color,
          notes: notes.trim() || undefined,
        }),
      })

      if (!res.ok) {
        const err = (await res.json()) as { error?: string }
        throw new Error(err.error ?? 'Gagal menambahkan langganan')
      }

      toast.success('Langganan baru berhasil ditambahkan!')
      setIsAddModalOpen(false)
      setName('')
      setAmount('')
      setNotes('')
      await refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal menyimpan langganan')
    } finally {
      setSubmitting(false)
    }
  }

  // Compute status badge info
  const getBadgeInfo = (dateStr: Date | string) => {
    const today = startOfDay(new Date())
    const dueDate = startOfDay(new Date(dateStr))

    if (isToday(dueDate)) {
      return {
        label: 'Hari Ini!',
        className: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30 font-bold animate-pulse',
      }
    }

    if (isBefore(dueDate, today)) {
      return {
        label: 'Lewat Jatuh Tempo',
        className: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30 font-semibold',
      }
    }

    const diff = differenceInDays(dueDate, today)
    if (diff <= 3) {
      return {
        label: `Tenggat ${diff} Hari`,
        className: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 font-semibold',
      }
    }

    return {
      label: `${diff} hari lagi`,
      className: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700',
    }
  }

  // Mini visual calendar matrix for the current month
  const currentDate = new Date()
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate()
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay()

  // Map day numbers to subscriptions
  const subsByDay = new Map<number, Subscription[]>()
  subscriptions.forEach((sub) => {
    const d = new Date(sub.nextBillingDate)
    if (d.getMonth() === currentDate.getMonth() && d.getFullYear() === currentDate.getFullYear()) {
      const day = d.getDate()
      const arr = subsByDay.get(day) ?? []
      arr.push(sub)
      subsByDay.set(day, arr)
    }
  })

  return (
    <div className="glass-card interactive-card p-5 rounded-2xl h-full flex flex-col justify-between">
      {/* Header */}
      <div>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
              <Repeat className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                Langganan & Tagihan Rutin
              </h3>
              <p className="text-xs text-[var(--text-secondary)]">
                Komitmen:{' '}
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                  {formatRupiah(monthlyCommitment)}
                </span>
                /bln
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center p-1 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-xs">
              <button
                type="button"
                onClick={() => setActiveTab('list')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                  activeTab === 'list'
                    ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-xs'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                Daftar
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('calendar')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                  activeTab === 'calendar'
                    ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-xs'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                Kalender
              </button>
            </div>

            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium transition-colors shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah</span>
            </button>
          </div>
        </div>

        {/* Content Area */}
        {isLoading ? (
          <div className="space-y-3 py-4 animate-pulse">
            <div className="h-12 rounded-xl bg-[var(--border-subtle)]" />
            <div className="h-12 rounded-xl bg-[var(--border-subtle)]" />
            <div className="h-12 rounded-xl bg-[var(--border-subtle)]" />
          </div>
        ) : activeTab === 'list' ? (
          /* List View */
          <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
            {subscriptions.length === 0 ? (
              <div className="text-center py-8 text-[var(--text-muted)] text-xs space-y-2">
                <CreditCard className="w-8 h-8 mx-auto opacity-40 text-violet-500" />
                <p>Belum ada tagihan atau langganan aktif.</p>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(true)}
                  className="text-violet-600 dark:text-violet-400 underline font-medium"
                >
                  Tambahkan langganan pertama
                </button>
              </div>
            ) : (
              subscriptions.map((sub) => {
                const badge = getBadgeInfo(sub.nextBillingDate)
                const isAdvancing = advancingId === sub.id

                return (
                  <div
                    key={sub.id}
                    className="p-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)]/60 hover:bg-[var(--bg-elevated)] transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-white text-xs shadow-xs shrink-0"
                        style={{ backgroundColor: sub.color || '#8b5cf6' }}
                      >
                        {sub.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                            {sub.name}
                          </h4>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full border ${badge.className}`}
                          >
                            {badge.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)] mt-0.5">
                          <span className="font-bold text-[var(--text-primary)]">
                            {formatRupiah(Number(sub.amount))}
                          </span>
                          <span>•</span>
                          <span>{getCycleLabel(sub.billingCycle)}</span>
                          <span>•</span>
                          <span>
                            Jatuh tempo:{' '}
                            {format(new Date(sub.nextBillingDate), 'dd MMM yyyy', {
                              locale: localeId,
                            })}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 self-end sm:self-center">
                      <button
                        type="button"
                        onClick={() => handleAdvanceCycle(sub)}
                        disabled={isAdvancing}
                        title="Tandai lunas & perbarui siklus berikutnya"
                        className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 font-medium transition-colors"
                      >
                        <CheckCircle2 className={`w-3.5 h-3.5 ${isAdvancing ? 'animate-spin' : ''}`} />
                        <span>Tandai Lunas</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(sub.id, sub.name)}
                        className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                        title="Hapus"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        ) : (
          /* Calendar View */
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-[var(--text-secondary)] font-semibold px-1">
              <span>{format(currentDate, 'MMMM yyyy', { locale: localeId })}</span>
              <span className="text-violet-500">
                {subsByDay.size} tagihan jatuh tempo bulan ini
              </span>
            </div>

            {/* Grid of days */}
            <div className="grid grid-cols-7 gap-1 text-center text-xs">
              {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map((day) => (
                <div key={day} className="py-1 text-[11px] font-medium text-[var(--text-muted)]">
                  {day}
                </div>
              ))}

              {/* Blank offset days */}
              {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                <div key={`empty-${i}`} className="h-9 rounded-lg" />
              ))}

              {/* Days in month */}
              {Array.from({ length: daysInMonth }).map((_, idx) => {
                const dayNum = idx + 1
                const hasSubs = subsByDay.get(dayNum)
                const isCurrent = dayNum === currentDate.getDate()

                return (
                  <div
                    key={dayNum}
                    className={`h-9 rounded-lg flex flex-col items-center justify-center relative border transition-all ${
                      hasSubs
                        ? 'border-violet-500/40 bg-violet-500/10 font-bold text-violet-600 dark:text-violet-300'
                        : isCurrent
                        ? 'border-emerald-500/40 bg-emerald-500/10 font-semibold'
                        : 'border-transparent text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]'
                    }`}
                    title={
                      hasSubs
                        ? hasSubs.map((s) => `${s.name}: ${formatRupiah(Number(s.amount))}`).join(', ')
                        : undefined
                    }
                  >
                    <span className="text-[11px]">{dayNum}</span>
                    {hasSubs && (
                      <div className="flex gap-0.5 mt-0.5">
                        {hasSubs.slice(0, 3).map((s, sIdx) => (
                          <span
                            key={sIdx}
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ backgroundColor: s.color || '#8b5cf6' }}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Upcoming preview list below calendar */}
            <div className="pt-2 border-t border-[var(--border-subtle)] space-y-1.5 max-h-24 overflow-y-auto">
              <span className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                Jadwal Terdekat
              </span>
              {subscriptions.slice(0, 2).map((sub) => (
                <div
                  key={sub.id}
                  className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-[var(--bg-elevated)]"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: sub.color || '#8b5cf6' }}
                    />
                    <span className="font-medium text-[var(--text-primary)]">{sub.name}</span>
                  </div>
                  <span className="text-violet-600 dark:text-violet-400 font-bold">
                    {formatRupiah(Number(sub.amount))}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Add Subscription Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div
            className="w-full max-w-md rounded-2xl p-5 shadow-2xl space-y-4"
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <div className="flex items-center justify-between pb-2 border-b border-[var(--border-subtle)]">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-violet-500" />
                <h3 className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
                  Tambah Langganan / Tagihan Rutin
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSubscription} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-medium text-[var(--text-secondary)] mb-1">
                  Nama Tagihan / Layanan
                </label>
                <input
                  type="text"
                  placeholder="e.g. Netflix Premium, Indihome 50Mbps, Spotify"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full bg-[var(--bg-elevated)] text-[var(--text-primary)] px-3 py-2 rounded-xl border border-[var(--border-subtle)] focus:border-violet-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-[var(--text-secondary)] mb-1">
                    Nominal Biaya (Rp)
                  </label>
                  <input
                    type="number"
                    placeholder="186000"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                    min={1}
                    className="w-full bg-[var(--bg-elevated)] text-[var(--text-primary)] px-3 py-2 rounded-xl border border-[var(--border-subtle)] focus:border-violet-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-medium text-[var(--text-secondary)] mb-1">
                    Siklus Penagihan
                  </label>
                  <select
                    value={billingCycle}
                    onChange={(e) => setBillingCycle(e.target.value as SubscriptionCycle)}
                    className="w-full bg-[var(--bg-elevated)] text-[var(--text-primary)] px-3 py-2 rounded-xl border border-[var(--border-subtle)] focus:border-violet-500 focus:outline-hidden"
                  >
                    <option value="MONTHLY">Bulanan (Monthly)</option>
                    <option value="WEEKLY">Mingguan (Weekly)</option>
                    <option value="YEARLY">Tahunan (Yearly)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-[var(--text-secondary)] mb-1">
                    Jatuh Tempo Berikutnya
                  </label>
                  <input
                    type="date"
                    value={nextBillingDate}
                    onChange={(e) => setNextBillingDate(e.target.value)}
                    required
                    className="w-full bg-[var(--bg-elevated)] text-[var(--text-primary)] px-3 py-2 rounded-xl border border-[var(--border-subtle)] focus:border-violet-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-medium text-[var(--text-secondary)] mb-1">
                    Warna Indikator
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      className="w-9 h-9 rounded-lg border border-[var(--border-subtle)] cursor-pointer bg-transparent p-0.5"
                    />
                    <span className="text-[var(--text-muted)] text-[11px]">{color}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-[var(--text-secondary)] mb-1">
                    Kategori
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Langganan, Internet, Tagihan"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-[var(--bg-elevated)] text-[var(--text-primary)] px-3 py-2 rounded-xl border border-[var(--border-subtle)] focus:border-violet-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-medium text-[var(--text-secondary)] mb-1">
                    Catatan (Opsional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Bayar via GoPay"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full bg-[var(--bg-elevated)] text-[var(--text-primary)] px-3 py-2 rounded-xl border border-[var(--border-subtle)] focus:border-violet-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border-subtle)]">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3 py-2 rounded-xl text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-medium shadow-md disabled:opacity-50"
                >
                  {submitting ? 'Menyimpan...' : 'Simpan Langganan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
