// components/goals/GoalsManager.tsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, Target, Trophy, Pencil, Trash2, Loader2, X, CheckCircle } from 'lucide-react'
import { ActionButton, ActionGroup } from '@/components/ui/ActionButton'
import { toast } from 'sonner'
import { formatCurrency } from '@/lib/utils'
import { GoalCardSkeleton } from '@/components/ui/Skeleton'

interface Goal {
  id: string
  name: string
  targetAmount: number
  currentAmount: number
  deadline: string | null
  icon: string
  color: string
  status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED'
  notes: string | null
  createdAt: string
}

const GOAL_ICONS = [
  { value: 'home', label: '🏠 Rumah' },
  { value: 'car', label: '🚗 Kendaraan' },
  { value: 'plane', label: '✈️ Liburan' },
  { value: 'graduation-cap', label: '🎓 Pendidikan' },
  { value: 'heart', label: '❤️ Pernikahan' },
  { value: 'smartphone', label: '📱 Gadget' },
  { value: 'piggy-bank', label: '🐷 Tabungan' },
  { value: 'target', label: '🎯 Lainnya' },
]

const ICON_EMOJI: Record<string, string> = {
  home: '🏠', car: '🚗', plane: '✈️', 'graduation-cap': '🎓',
  heart: '❤️', smartphone: '📱', 'piggy-bank': '🐷', target: '🎯',
}

const COLORS = [
  '#4ade80', '#60a5fa', '#f59e0b', '#f87171',
  '#a78bfa', '#34d399', '#fb923c', '#e879f9',
]

const DEFAULT_FORM = {
  name: '', targetAmount: '', currentAmount: '0',
  deadline: '', icon: 'target', color: '#4ade80', notes: '',
}

export function GoalsManager() {
  const [goals, setGoals] = useState<Goal[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null)
  const [form, setForm] = useState(DEFAULT_FORM)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const fetchGoals = useCallback(async () => {
    try {
      const res = await fetch('/api/goals')
      if (!res.ok) return
      const json = await res.json()
      setGoals(json.data ?? [])
    } catch {
      toast.error('Gagal memuat goals')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchGoals() }, [fetchGoals])

  function openCreate() {
    setEditingGoal(null)
    setForm(DEFAULT_FORM)
    setShowModal(true)
  }

  function openEdit(goal: Goal) {
    setEditingGoal(goal)
    setForm({
      name: goal.name,
      targetAmount: goal.targetAmount.toString(),
      currentAmount: goal.currentAmount.toString(),
      deadline: goal.deadline ? goal.deadline.slice(0, 10) : '',
      icon: goal.icon,
      color: goal.color,
      notes: goal.notes ?? '',
    })
    setShowModal(true)
  }

  async function handleSave() {
    if (!form.name.trim() || !form.targetAmount) {
      toast.error('Nama dan target wajib diisi')
      return
    }
    setSaving(true)
    try {
      const payload = {
        name: form.name.trim(),
        targetAmount: Math.round(Number(form.targetAmount.toString().replace(/[^0-9]/g, ''))),
        currentAmount: Math.round(Number(form.currentAmount.toString().replace(/[^0-9]/g, ''))) || 0,
        deadline: form.deadline || null,
        icon: form.icon,
        color: form.color,
        notes: form.notes || null,
      }

      const url = editingGoal ? `/api/goals/${editingGoal.id}` : '/api/goals'
      const method = editingGoal ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) throw new Error()
      toast.success(editingGoal ? 'Goal diperbarui' : 'Goal berhasil dibuat!')
      setShowModal(false)
      fetchGoals()
    } catch {
      toast.error('Gagal menyimpan goal')
    } finally {
      setSaving(false)
    }
  }

  async function handleComplete(goal: Goal) {
    try {
      await fetch(`/api/goals/${goal.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'COMPLETED', currentAmount: goal.targetAmount }),
      })
      toast.success(`🎉 Selamat! Goal "${goal.name}" tercapai!`)
      fetchGoals()
    } catch {
      toast.error('Gagal memperbarui goal')
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id)
    try {
      const res = await fetch(`/api/goals/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      toast.success('Goal dihapus')
      setGoals((prev) => prev.filter((g) => g.id !== id))
    } catch {
      toast.error('Gagal menghapus goal')
    } finally {
      setDeletingId(null)
    }
  }

  async function updateAmount(goal: Goal, addedAmount: number) {
    if (addedAmount <= 0) return
    const newAmount = Math.round(Number(goal.currentAmount)) + Math.round(Number(addedAmount))
    try {
      const res = await fetch(`/api/goals/${goal.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentAmount: Number(newAmount) }),
      })
      if (!res.ok) throw new Error()
      toast.success(`+${formatCurrency(Math.round(Number(addedAmount)))} ditambahkan ke "${goal.name}"`)
      fetchGoals()
      if (newAmount >= Math.round(Number(goal.targetAmount))) {
        toast.success(`🎉 Goal "${goal.name}" tercapai!`)
      }
    } catch {
      toast.error('Gagal menambah tabungan')
    }
  }

  const totalTarget = goals.reduce((s, g) => s + Math.round(Number(g.targetAmount)), 0)
  const totalSaved = goals.reduce((s, g) => s + Math.round(Number(g.currentAmount)), 0)
  const overallPct = totalTarget > 0 ? Math.round((totalSaved / totalTarget) * 100) : 0

  return (
    <div className="space-y-5">
      {/* Summary strip */}
      {goals.length > 0 && (
        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                Total progress semua goal
              </p>
              <p className="text-2xl font-bold mt-0.5" style={{ color: 'var(--color-primary-700)' }}>
                {overallPct}%
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Terkumpul</p>
              <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                {formatCurrency(totalSaved)}
              </p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                dari {formatCurrency(totalTarget)}
              </p>
            </div>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--bg-muted)' }}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(overallPct, 100)}%`, background: 'var(--color-primary-600)' }}
            />
          </div>
          <div className="flex items-center justify-between mt-2">
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {goals.length} goal aktif
            </p>
            <button
              onClick={openCreate}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white"
              style={{ background: 'var(--color-primary-800)' }}
            >
              <Plus className="w-3.5 h-3.5" />
              Tambah
            </button>
          </div>
        </div>
      )}

      {/* Goal cards */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => <GoalCardSkeleton key={i} />)}
        </div>
      ) : goals.length === 0 ? (
        <div className="card p-12 text-center">
          <Target className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
          <h3 className="font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
            Belum ada financial goal
          </h3>
          <p className="text-sm mb-5" style={{ color: 'var(--text-secondary)' }}>
            Tetapkan target keuangan dan pantau progresnya setiap hari
          </p>
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-white"
            style={{ background: 'var(--color-primary-800)' }}
          >
            <Plus className="w-4 h-4" />
            Buat goal pertama
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {goals.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              onEdit={() => openEdit(goal)}
              onDelete={() => handleDelete(goal.id)}
              onComplete={() => handleComplete(goal)}
              onUpdateAmount={(addedAmount) => updateAmount(goal, addedAmount)}
              isDeleting={deletingId === goal.id}
            />
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.5)' }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false) }}
        >
          <div className="card w-full max-w-md max-h-[90vh] overflow-y-auto" style={{ background: 'var(--bg-card)' }}>
            <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: 'var(--border-default)' }}>
              <h2 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                {editingGoal ? 'Edit Goal' : 'Buat Goal Baru'}
              </h2>
              <button onClick={() => setShowModal(false)} style={{ color: 'var(--text-muted)' }}>
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Icon & Color picker */}
              <div>
                <label className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Tipe Goal</label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {GOAL_ICONS.map((icon) => (
                    <button
                      key={icon.value}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, icon: icon.value }))}
                      className="px-3 py-1.5 rounded-lg text-sm border transition-colors"
                      style={{
                        borderColor: form.icon === icon.value ? 'var(--color-primary-600)' : 'var(--border-default)',
                        background: form.icon === icon.value ? 'var(--color-primary-600)' + '15' : 'transparent',
                        color: 'var(--text-primary)',
                      }}
                    >
                      {icon.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Name */}
              <div>
                <label className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Nama Goal</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="contoh: DP Rumah, Liburan ke Jepang"
                  className="mt-1 w-full px-3 py-2 rounded-lg border text-sm outline-none"
                  style={{ background: 'var(--bg-card)', borderColor: 'var(--border-default)', color: 'var(--text-primary)' }}
                />
              </div>

              {/* Target Amount */}
              <div>
                <label className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Target Amount</label>
                <input
                  type="number"
                  value={form.targetAmount}
                  onChange={(e) => setForm((f) => ({ ...f, targetAmount: e.target.value }))}
                  placeholder="50000000"
                  min="1"
                  className="mt-1 w-full px-3 py-2 rounded-lg border text-sm outline-none"
                  style={{ background: 'var(--bg-card)', borderColor: 'var(--border-default)', color: 'var(--text-primary)' }}
                />
              </div>

              {/* Current Amount */}
              <div>
                <label className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                  Sudah terkumpul
                  <span className="ml-1 text-xs font-normal" style={{ color: 'var(--text-muted)' }}>(opsional)</span>
                </label>
                <input
                  type="number"
                  value={form.currentAmount}
                  onChange={(e) => setForm((f) => ({ ...f, currentAmount: e.target.value }))}
                  placeholder="0"
                  min="0"
                  className="mt-1 w-full px-3 py-2 rounded-lg border text-sm outline-none"
                  style={{ background: 'var(--bg-card)', borderColor: 'var(--border-default)', color: 'var(--text-primary)' }}
                />
              </div>

              {/* Deadline */}
              <div>
                <label className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                  Target tanggal
                  <span className="ml-1 text-xs font-normal" style={{ color: 'var(--text-muted)' }}>(opsional)</span>
                </label>
                <input
                  type="date"
                  value={form.deadline}
                  onChange={(e) => setForm((f) => ({ ...f, deadline: e.target.value }))}
                  className="mt-1 w-full px-3 py-2 rounded-lg border text-sm outline-none"
                  style={{ background: 'var(--bg-card)', borderColor: 'var(--border-default)', color: 'var(--text-primary)' }}
                />
              </div>

              {/* Color */}
              <div>
                <label className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Warna</label>
                <div className="flex gap-2 mt-2">
                  {COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, color }))}
                      className="w-8 h-8 rounded-full transition-transform hover:scale-110"
                      style={{
                        background: color,
                        outline: form.color === color ? `3px solid ${color}` : 'none',
                        outlineOffset: '2px',
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                  Catatan
                  <span className="ml-1 text-xs font-normal" style={{ color: 'var(--text-muted)' }}>(opsional)</span>
                </label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  rows={2}
                  placeholder="Motivasi atau catatan tambahan..."
                  className="mt-1 w-full px-3 py-2 rounded-lg border text-sm outline-none resize-none"
                  style={{ background: 'var(--bg-card)', borderColor: 'var(--border-default)', color: 'var(--text-primary)' }}
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-1">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 rounded-lg text-sm font-medium border"
                  style={{ borderColor: 'var(--border-default)', color: 'var(--text-secondary)' }}
                >
                  Batal
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium text-white disabled:opacity-60"
                  style={{ background: 'var(--color-primary-800)' }}
                >
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editingGoal ? 'Simpan' : 'Buat Goal'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Goal Card ──────────────────────────────────────────────────
function GoalCard({
  goal, onEdit, onDelete, onComplete, onUpdateAmount, isDeleting,
}: {
  goal: Goal
  onEdit: () => void
  onDelete: () => void
  onComplete: () => void
  onUpdateAmount: (addedAmount: number) => void
  isDeleting: boolean
}) {
  const [addAmount, setAddAmount] = useState('')
  const [showAdd, setShowAdd] = useState(false)

  const current = Math.round(Number(goal.currentAmount))
  const target = Math.round(Number(goal.targetAmount))
  const pct = Math.min(Math.round((current / target) * 100), 100)
  const remaining = target - current
  const isComplete = pct >= 100
  const emoji = ICON_EMOJI[goal.icon] ?? '🎯'

  const deadlineLabel = goal.deadline
    ? (() => {
        const days = Math.ceil((new Date(goal.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
        if (days < 0) return { text: 'Sudah lewat', warn: true }
        if (days === 0) return { text: 'Hari ini!', warn: true }
        if (days <= 30) return { text: `${days} hari lagi`, warn: days <= 7 }
        const months = Math.round(days / 30)
        return { text: `${months} bulan lagi`, warn: false }
      })()
    : null

  function handleAddSave() {
    const amt = Number(addAmount)
    if (!amt || amt <= 0) {
      toast.error('Masukkan nominal yang valid')
      return
    }
    onUpdateAmount(amt)
    setAddAmount('')
    setShowAdd(false)
  }

  return (
    <div className="card p-5 space-y-4" style={{ borderLeft: `4px solid ${goal.color}` }}>
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{emoji}</span>
          <div>
            <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{goal.name}</p>
            {deadlineLabel && (
              <p className="text-xs mt-0.5" style={{ color: deadlineLabel.warn ? 'var(--color-danger-500)' : 'var(--text-muted)' }}>
                ⏰ {deadlineLabel.text}
              </p>
            )}
          </div>
        </div>
        <ActionGroup>
          {!isComplete && (
            <ActionButton
              icon={<CheckCircle className="w-3.5 h-3.5" />}
              label="Selesai"
              onClick={onComplete}
              variant="success"
            />
          )}
          <ActionButton
            icon={<Pencil className="w-3.5 h-3.5" />}
            label="Edit"
            onClick={onEdit}
            variant="default"
          />
          <ActionButton
            icon={isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
            label="Hapus"
            onClick={onDelete}
            disabled={isDeleting}
            variant="danger"
          />
        </ActionGroup>
      </div>

      {/* Progress */}
      <div>
        <div className="flex items-end justify-between mb-1.5">
          <div>
            <span className="text-lg font-bold" style={{ color: isComplete ? 'var(--color-success-500)' : 'var(--text-primary)' }}>
              {pct}%
            </span>
            {isComplete && <Trophy className="inline w-4 h-4 ml-1 text-yellow-500" />}
          </div>
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {formatCurrency(current)} / {formatCurrency(target)}
          </span>
        </div>
        <div className="h-2.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-muted)' }}>
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${pct}%`, background: isComplete ? 'var(--color-success-500)' : goal.color }}
          />
        </div>
        {!isComplete && (
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
            Kurang {formatCurrency(Math.max(0, remaining))} lagi
          </p>
        )}
      </div>

      {/* Add savings */}
      {!isComplete && (
        showAdd ? (
          <div className="flex gap-2">
            <input
              type="number"
              value={addAmount}
              onChange={(e) => setAddAmount(e.target.value)}
              placeholder="Nominal yang ditambahkan"
              autoFocus
              className="flex-1 px-3 py-2 rounded-lg border text-sm outline-none"
              style={{ background: 'var(--bg-card)', borderColor: 'var(--border-default)', color: 'var(--text-primary)' }}
              onKeyDown={(e) => { if (e.key === 'Enter') handleAddSave(); if (e.key === 'Escape') setShowAdd(false) }}
            />
            <button onClick={handleAddSave}
              className="px-3 py-2 rounded-lg text-sm font-medium text-white"
              style={{ background: goal.color }}>
              +
            </button>
            <button onClick={() => setShowAdd(false)}
              className="px-3 py-2 rounded-lg text-sm border"
              style={{ borderColor: 'var(--border-default)', color: 'var(--text-muted)' }}>
              Batal
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowAdd(true)}
            className="w-full py-2 rounded-lg text-sm font-medium border border-dashed transition-colors hover:opacity-80"
            style={{ borderColor: goal.color, color: goal.color }}
          >
            + Tambah tabungan
          </button>
        )
      )}

      {goal.notes && (
        <p className="text-xs italic" style={{ color: 'var(--text-muted)' }}>"{goal.notes}"</p>
      )}
    </div>
  )
}