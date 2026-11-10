// app/api/achievements/route.ts
// FinSight Gamification & Financial Achievements Engine
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { startOfMonth, endOfMonth } from 'date-fns'
import type { ApiError, ApiResponse, AchievementBadge, AchievementsResponse } from '@/types'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json<ApiError>({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = session.user.id

  const now = new Date()
  const mStart = startOfMonth(now)
  const mEnd = endOfMonth(now)

  // Fetch all necessary stats in parallel
  const [
    txCount,
    monthlyTxs,
    wallets,
    budgets,
    activeSubsCount,
    existingAchievements,
  ] = await Promise.all([
    prisma.transaction.count({ where: { userId } }),
    prisma.transaction.groupBy({
      by: ['type'],
      where: { userId, date: { gte: mStart, lte: mEnd } },
      _sum: { amount: true },
    }),
    prisma.wallet.findMany({ where: { userId } }),
    prisma.budget.findMany({ where: { userId, isActive: true } }),
    prisma.subscription.count({ where: { userId, status: 'ACTIVE' } }),
    prisma.userAchievement.findMany({ where: { userId } }),
  ])

  // Compute monthly saving rate
  let totalIncome = 0
  let totalExpense = 0
  for (const row of monthlyTxs) {
    if (row.type === 'INCOME') totalIncome = Number(row._sum.amount ?? 0)
    if (row.type === 'EXPENSE') totalExpense = Number(row._sum.amount ?? 0)
  }
  const savingRate =
    totalIncome > 0 ? Math.round(((totalIncome - totalExpense) / totalIncome) * 100) : 0

  // Compute Net Worth
  const netWorth = wallets
    .filter((w) => w.isIncludedInNetWorth)
    .reduce((sum, w) => sum + Number(w.balance), 0)

  // Compute Budget compliance
  let allBudgetsUnderControl = budgets.length > 0
  if (budgets.length > 0) {
    const budgetCategoryExpenses = await prisma.transaction.groupBy({
      by: ['categoryId'],
      where: {
        userId,
        type: 'EXPENSE',
        date: { gte: mStart, lte: mEnd },
        categoryId: { in: budgets.map((b) => b.categoryId) },
      },
      _sum: { amount: true },
    })
    const spentMap = new Map(
      budgetCategoryExpenses.map((b) => [b.categoryId, Number(b._sum.amount ?? 0)])
    )
    for (const b of budgets) {
      const spent = spentMap.get(b.categoryId) ?? 0
      if (spent > Number(b.amount)) {
        allBudgetsUnderControl = false
        break
      }
    }
  }

  const existingMap = new Map(
    existingAchievements.map((a) => [a.badgeKey, a.unlockedAt.toISOString()])
  )

  // Define Badge Evaluators
  const badgeDefinitions: Array<{
    key: string
    title: string
    description: string
    icon: string
    isQualified: boolean
    progress: number
    currentVal: number
    targetVal: number
    unit?: string
  }> = [
    {
      key: 'SAVER_STARTER',
      title: 'Langkah Pertama',
      description: 'Catat minimal 5 transaksi pertamamu di FinSight',
      icon: 'Footprints',
      isQualified: txCount >= 5,
      progress: Math.min(100, Math.round((txCount / 5) * 100)),
      currentVal: txCount,
      targetVal: 5,
      unit: 'transaksi',
    },
    {
      key: 'SAVING_CHAMP',
      title: 'Hemat Murni',
      description: 'Capai rasio tabungan > 20% dari total pemasukan bulan ini',
      icon: 'PiggyBank',
      isQualified: savingRate >= 20,
      progress: Math.max(0, Math.min(100, Math.round((savingRate / 20) * 100))),
      currentVal: savingRate,
      targetVal: 20,
      unit: '%',
    },
    {
      key: 'BUDGET_MASTER',
      title: 'Master Budget',
      description: 'Disiplin menjaga pengeluaran di bawah limit semua anggaran aktif',
      icon: 'ShieldCheck',
      isQualified: allBudgetsUnderControl && budgets.length > 0,
      progress: budgets.length > 0 ? (allBudgetsUnderControl ? 100 : 50) : 0,
      currentVal: allBudgetsUnderControl ? 1 : 0,
      targetVal: 1,
    },
    {
      key: 'NET_WORTH_10M',
      title: 'Kekayaan Perdana',
      description: 'Kumpulkan total Net Worth mencapai minimal Rp 10.000.000',
      icon: 'Coins',
      isQualified: netWorth >= 10_000_000,
      progress: Math.min(100, Math.round((netWorth / 10_000_000) * 100)),
      currentVal: netWorth,
      targetVal: 10_000_000,
      unit: 'IDR',
    },
    {
      key: 'WALLET_KING',
      title: 'Raja Dompet',
      description: 'Kelola keuangan secara rapi dengan minimal 3 dompet/akun aktif',
      icon: 'Wallet',
      isQualified: wallets.length >= 3,
      progress: Math.min(100, Math.round((wallets.length / 3) * 100)),
      currentVal: wallets.length,
      targetVal: 3,
      unit: 'dompet',
    },
    {
      key: 'DISCIPLINE_ROUTINE',
      title: 'Disiplin Rutin',
      description: 'Pantau tagihan dan langganan berkala secara aktif',
      icon: 'CalendarCheck',
      isQualified: activeSubsCount >= 1,
      progress: activeSubsCount >= 1 ? 100 : 0,
      currentVal: activeSubsCount,
      targetVal: 1,
      unit: 'langganan',
    },
  ]

  // Persist newly qualified badges to DB
  const badges: AchievementBadge[] = []
  const newlyUnlocked: string[] = []

  for (const def of badgeDefinitions) {
    const wasUnlocked = existingMap.has(def.key)
    const isNowUnlocked = wasUnlocked || def.isQualified
    let unlockedAt = existingMap.get(def.key) ?? null

    if (!wasUnlocked && def.isQualified) {
      newlyUnlocked.push(def.key)
      unlockedAt = new Date().toISOString()
    }

    badges.push({
      key: def.key,
      title: def.title,
      description: def.description,
      icon: def.icon,
      unlocked: isNowUnlocked,
      unlockedAt,
      progress: isNowUnlocked ? 100 : def.progress,
      currentVal: def.currentVal,
      targetVal: def.targetVal,
      unit: def.unit,
    })
  }

  // Bulk insert newly unlocked achievements
  if (newlyUnlocked.length > 0) {
    await prisma.userAchievement.createMany({
      data: newlyUnlocked.map((key) => ({
        userId,
        badgeKey: key,
      })),
      skipDuplicates: true,
    })
  }

  const unlockedCount = badges.filter((b) => b.unlocked).length
  const totalPoints = unlockedCount * 150 // 150 EXP per achievement

  const responseData: AchievementsResponse = {
    badges,
    unlockedCount,
    totalCount: badges.length,
    totalPoints,
  }

  return NextResponse.json<ApiResponse<AchievementsResponse>>({
    data: responseData,
  })
}
