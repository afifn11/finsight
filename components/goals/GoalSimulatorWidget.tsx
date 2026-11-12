// components/goals/GoalSimulatorWidget.tsx
'use client'

import { useState } from 'react'
import {
  Trophy,
  Target,
  Sparkles,
  Zap,
  Footprints,
  PiggyBank,
  ShieldCheck,
  Coins,
  Wallet,
  CalendarCheck,
  Lock,
  CheckCircle2,
  Sliders,
} from 'lucide-react'
import { useAchievements, useGoals, useDashboard } from '@/hooks'
import { formatCurrency } from '@/lib/utils'
import { addMonths, format } from 'date-fns'
import { id as localeId } from 'date-fns/locale'

const BADGE_ICONS: Record<string, React.ElementType> = {
  Footprints,
  PiggyBank,
  ShieldCheck,
  Coins,
  Wallet,
  CalendarCheck,
}

export function GoalSimulatorWidget() {
  const { badges, unlockedCount, totalCount, totalPoints } = useAchievements()
  const { goals } = useGoals()
  const { data: dashboardData } = useDashboard()

  const [activeTab, setActiveTab] = useState<'simulator' | 'badges'>('simulator')
  const [extraMonthlySaving, setExtraMonthlySaving] = useState<number>(500_000)
  const [selectedGoalId, setSelectedGoalId] = useState<string>('')

  // Level calculation: 150 points per badge
  const userLevel = Math.max(1, Math.floor(totalPoints / 250) + 1)
  const nextLevelPoints = userLevel * 250
  const levelProgress = Math.min(100, Math.round((totalPoints / nextLevelPoints) * 100))

  // Find selected or first goal
  const activeGoal = goals.find((g) => g.id === selectedGoalId) ?? goals[0] ?? {
    id: 'default-goal',
    name: 'Dana Darurat (Contoh)',
    targetAmount: 20_000_000,
    currentAmount: 8_000_000,
    color: '#0ea5e9',
  }

  // Monthly savings baseline: current monthly net balance or fallback 1.5M
  const baselineMonthlySavings = Math.max(
    500_000,
    dashboardData?.summary?.netBalance && dashboardData.summary.netBalance > 0
      ? dashboardData.summary.netBalance
      : 1_500_000
  )

  const remainingGoalAmount = Math.max(
    0,
    Number(activeGoal.targetAmount) - Number(activeGoal.currentAmount)
  )

  // Estimated months to reach goal at baseline vs boosted savings
  const baselineMonths = Math.max(1, Math.ceil(remainingGoalAmount / baselineMonthlySavings))
  const boostedMonthlySavings = baselineMonthlySavings + extraMonthlySaving
  const boostedMonths = Math.max(1, Math.ceil(remainingGoalAmount / boostedMonthlySavings))
  const monthsSaved = Math.max(0, baselineMonths - boostedMonths)

  const baselineDate = addMonths(new Date(), baselineMonths)
  const boostedDate = addMonths(new Date(), boostedMonths)

  const currentGoalProgress = Math.min(
    100,
    Math.round((Number(activeGoal.currentAmount) / Number(activeGoal.targetAmount)) * 100)
  )

  return (
    <div className="glass-card interactive-card p-5 rounded-2xl h-full flex flex-col justify-between">
      {/* Widget Header with Gamification Level */}
      <div>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-lime-50 dark:bg-lime-950/40 text-lime-600 dark:text-lime-400 border border-lime-200 dark:border-lime-800">
              <Trophy className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                  Simulator Target & Lencana
                </h3>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-lime-50 text-lime-700 dark:bg-lime-950/60 dark:text-lime-300 border border-lime-200 dark:border-lime-800">
                  <Zap className="w-3 h-3 fill-current" />
                  Level {userLevel} • {totalPoints} EXP
                </span>
              </div>
              <p className="text-xs text-[var(--text-secondary)]">
                {unlockedCount} dari {totalCount || 6} lencana pencapaian terbuka
              </p>
            </div>
          </div>

          {/* Tab buttons */}
          <div className="flex items-center p-1 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-xs">
            <button
              type="button"
              onClick={() => setActiveTab('simulator')}
              className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                activeTab === 'simulator'
                  ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              Simulator Target
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('badges')}
              className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                activeTab === 'badges'
                  ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              Lencana ({unlockedCount})
            </button>
          </div>
        </div>

        {/* Content Tabs */}
        {activeTab === 'simulator' ? (
          /* Simulator Tab */
          <div className="space-y-4">
            {/* Goal Progress Summary */}
            <div
              className="p-3.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)]/60 space-y-2.5"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-lime-500" />
                  {goals.length > 1 ? (
                    <select
                      value={selectedGoalId}
                      onChange={(e) => setSelectedGoalId(e.target.value)}
                      className="text-xs font-bold bg-transparent border-0 text-[var(--text-primary)] cursor-pointer focus:outline-hidden"
                    >
                      {goals.map((g) => (
                        <option key={g.id} value={g.id}>
                          {g.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span className="text-xs font-bold text-[var(--text-primary)]">
                      {activeGoal.name}
                    </span>
                  )}
                </div>
                <span className="text-xs font-bold text-lime-600 dark:text-lime-400">
                  {currentGoalProgress}%
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full h-2 rounded-full bg-[var(--border-subtle)] overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${currentGoalProgress}%`,
                    background: 'linear-gradient(90deg, #0ea5e9, #6366f1)',
                  }}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-[var(--text-secondary)]">
                <span>Terkumpul: {formatCurrency(Number(activeGoal.currentAmount))}</span>
                <span>Target: {formatCurrency(Number(activeGoal.targetAmount))}</span>
              </div>
            </div>

            {/* Velocity Simulator Slider */}
            <div className="space-y-2.5 p-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)]">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 font-semibold text-[var(--text-primary)]">
                  <Sliders className="w-3.5 h-3.5 text-amber-500" />
                  <span>Simulasi Tambahan Tabungan / Bulan</span>
                </div>
                <span className="font-bold text-amber-600 dark:text-amber-400">
                  +{formatCurrency(extraMonthlySaving)}
                </span>
              </div>

              <input
                type="range"
                min={0}
                max={3_000_000}
                step={100_000}
                value={extraMonthlySaving}
                onChange={(e) => setExtraMonthlySaving(Number(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer h-1.5 rounded-lg bg-[var(--border-subtle)]"
              />

              {/* Dynamic Velocity Output Card */}
              <div
                className="p-2.5 rounded-lg border border-amber-500/20 bg-amber-500/5 flex items-center justify-between text-xs"
              >
                <div>
                  <p className="text-[11px] text-[var(--text-secondary)]">
                    Normal: {format(baselineDate, 'MMM yyyy', { locale: localeId })} ({baselineMonths} bln)
                  </p>
                  <p className="font-bold text-[var(--text-primary)] mt-0.5">
                    Target: {format(boostedDate, 'MMMM yyyy', { locale: localeId })} ({boostedMonths} bulan)
                  </p>
                </div>

                {monthsSaved > 0 && (
                  <div className="text-right">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-lime-500/10 text-lime-600 dark:text-lime-400 border border-lime-500/20">
                      <Sparkles className="w-3 h-3" />
                      {monthsSaved} bulan lebih cepat!
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* Badges Grid Tab */
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-[290px] overflow-y-auto pr-1">
            {badges.map((b) => {
              const IconComp = BADGE_ICONS[b.icon] ?? Trophy

              return (
                <div
                  key={b.key}
                  className={`p-3 rounded-xl border transition-all relative flex flex-col justify-between ${
                    b.unlocked
                      ? 'border-amber-500/40 bg-amber-500/5'
                      : 'border-[var(--border-subtle)] bg-[var(--bg-elevated)]/40 opacity-75'
                  }`}
                  title={b.description}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        b.unlocked
                          ? 'bg-amber-500 text-white animate-bounce-short'
                          : 'bg-[var(--border-subtle)] text-[var(--text-muted)]'
                      }`}
                    >
                      <IconComp className="w-4 h-4" />
                    </div>

                    {b.unlocked ? (
                      <CheckCircle2 className="w-4 h-4 text-lime-500 shrink-0" />
                    ) : (
                      <Lock className="w-3.5 h-3.5 text-[var(--text-muted)] shrink-0" />
                    )}
                  </div>

                  <div>
                    <h5 className="font-bold text-xs text-[var(--text-primary)] leading-tight">
                      {b.title}
                    </h5>
                    <p className="text-[10px] text-[var(--text-muted)] line-clamp-2 mt-1 leading-normal">
                      {b.description}
                    </p>
                  </div>

                  {/* Progress bar if locked */}
                  {!b.unlocked && (
                    <div className="mt-2.5 space-y-1">
                      <div className="w-full h-1 rounded-full bg-[var(--border-subtle)] overflow-hidden">
                        <div
                          className="h-full bg-amber-500 rounded-full"
                          style={{ width: `${b.progress}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[9px] text-[var(--text-muted)]">
                        <span>Progress</span>
                        <span>{b.progress}%</span>
                      </div>
                    </div>
                  )}

                  {b.unlocked && b.unlockedAt && (
                    <span className="text-[9px] text-amber-600 dark:text-amber-400 font-semibold mt-2">
                      Terbuka {format(new Date(b.unlockedAt), 'dd/MM/yy')}
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Footer Level Progress */}
      <div
        className="mt-4 pt-3 border-t flex items-center justify-between text-xs"
        style={{ borderColor: 'var(--border-subtle)' }}
      >
        <span className="text-[11px] text-[var(--text-muted)]">
          Menuju Level {userLevel + 1} ({totalPoints} / {nextLevelPoints} EXP)
        </span>
        <div className="w-24 h-1.5 rounded-full bg-[var(--border-subtle)] overflow-hidden">
          <div
            className="h-full rounded-full bg-amber-500 transition-all duration-300"
            style={{ width: `${levelProgress}%` }}
          />
        </div>
      </div>
    </div>
  )
}
