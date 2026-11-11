// app/(dashboard)/goals/page.tsx
import type { Metadata } from 'next'
import { GoalsManager } from '@/components/goals/GoalsManager'
import { GoalSimulatorWidget } from '@/components/goals/GoalSimulatorWidget'

export const metadata: Metadata = { title: 'Target Finansial & Gamifikasi' }

export default function GoalsPage() {
  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Page Header */}
      <div className="p-5 md:p-6 rounded-2xl glass-card">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
          Target Finansial & Gamifikasi
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
          Rencanakan impian masa depan, simulasikan kecepatan tabungan, dan buka lencana pencapaian
        </p>
      </div>

      {/* 2-Column Layout: Goals List & Gamification Simulator */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Active Financial Goals (Col Span 7) */}
        <div className="lg:col-span-7">
          <GoalsManager />
        </div>

        {/* Right: Goal Simulator & Achievement Badges (Col Span 5) */}
        <div className="lg:col-span-5">
          <GoalSimulatorWidget />
        </div>
      </div>
    </div>
  )
}
