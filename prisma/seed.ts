// prisma/seed.ts
import { PrismaClient, CategoryType, TransactionType } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

// Seed pakai DIRECT_URL (koneksi langsung, bukan pooled)
const pool = new Pool({ connectionString: process.env.DIRECT_URL })
const adapter = new PrismaPg(pool as never)
const prisma = new PrismaClient({ adapter })

// ── System Categories ──────────────────────────────────────────
const SYSTEM_CATEGORIES = [
  // EXPENSE categories
  { name: 'Makanan & Minuman', icon: 'utensils', color: '#f59e0b', forType: TransactionType.EXPENSE },
  { name: 'Transportasi', icon: 'car', color: '#3b82f6', forType: TransactionType.EXPENSE },
  { name: 'Belanja', icon: 'shopping-bag', color: '#8b5cf6', forType: TransactionType.EXPENSE },
  { name: 'Tagihan & Utilitas', icon: 'zap', color: '#ef4444', forType: TransactionType.EXPENSE },
  { name: 'Kesehatan', icon: 'heart-pulse', color: '#ec4899', forType: TransactionType.EXPENSE },
  { name: 'Hiburan', icon: 'tv', color: '#06b6d4', forType: TransactionType.EXPENSE },
  { name: 'Pendidikan', icon: 'graduation-cap', color: '#10b981', forType: TransactionType.EXPENSE },
  { name: 'Investasi', icon: 'trending-up', color: '#0ea5e9', forType: TransactionType.EXPENSE },
  { name: 'Lainnya', icon: 'ellipsis', color: '#6b7280', forType: TransactionType.EXPENSE },
  // INCOME categories
  { name: 'Gaji', icon: 'briefcase', color: '#10b981', forType: TransactionType.INCOME },
  { name: 'Freelance', icon: 'laptop', color: '#3b82f6', forType: TransactionType.INCOME },
  { name: 'Investasi', icon: 'trending-up', color: '#8b5cf6', forType: TransactionType.INCOME },
  { name: 'Hadiah', icon: 'gift', color: '#f59e0b', forType: TransactionType.INCOME },
  { name: 'Pendapatan Lain', icon: 'plus-circle', color: '#6b7280', forType: TransactionType.INCOME },
]

async function main() {
  console.log('🌱 Seeding database...')

  // ── Seed system categories ─────────────────────────────────
  console.log('  Creating system categories...')
  for (const category of SYSTEM_CATEGORIES) {
    await prisma.category.upsert({
      where: {
        // Using a composite to avoid duplicates on re-seed
        id: `system-${category.name.toLowerCase().replace(/\s+/g, '-')}`,
      },
      update: {},
      create: {
        id: `system-${category.name.toLowerCase().replace(/\s+/g, '-')}`,
        userId: null, // System category
        name: category.name,
        icon: category.icon,
        color: category.color,
        type: CategoryType.SYSTEM,
        forType: category.forType,
      },
    })
  }

  // ── Seed demo user ─────────────────────────────────────────
  console.log('  Creating demo user...')
  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@finsight.app' },
    update: {},
    create: {
      id: 'demo-user-id',
      email: 'demo@finsight.app',
      name: 'Demo User',
      currency: 'IDR',
      timezone: 'Asia/Jakarta',
      onboardingDone: true,
    },
  })

  // ── Seed demo transactions (last 3 months) ─────────────────
  console.log('  Creating demo transactions...')
  const now = new Date()
  const categories = await prisma.category.findMany({ where: { userId: null } })

  const getCategory = (name: string) =>
    categories.find((c) => c.name === name)!

  const demoTransactions = [
    // Current month - INCOME
    { amount: 8500000, type: TransactionType.INCOME, description: 'Gaji Bulan Maret', categoryId: getCategory('Gaji').id, date: new Date(now.getFullYear(), now.getMonth(), 1) },
    { amount: 1500000, type: TransactionType.INCOME, description: 'Project Freelance Website', categoryId: getCategory('Freelance').id, date: new Date(now.getFullYear(), now.getMonth(), 10) },
    // Current month - EXPENSE
    { amount: 850000, type: TransactionType.EXPENSE, description: 'Makan siang + dinner', categoryId: getCategory('Makanan & Minuman').id, date: new Date(now.getFullYear(), now.getMonth(), 3) },
    { amount: 320000, type: TransactionType.EXPENSE, description: 'Grab bulan ini', categoryId: getCategory('Transportasi').id, date: new Date(now.getFullYear(), now.getMonth(), 5) },
    { amount: 150000, type: TransactionType.EXPENSE, description: 'Netflix + Spotify', categoryId: getCategory('Hiburan').id, date: new Date(now.getFullYear(), now.getMonth(), 1) },
    { amount: 450000, type: TransactionType.EXPENSE, description: 'Belanja bulanan', categoryId: getCategory('Belanja').id, date: new Date(now.getFullYear(), now.getMonth(), 8) },
    { amount: 500000, type: TransactionType.EXPENSE, description: 'Token listrik + PDAM', categoryId: getCategory('Tagihan & Utilitas').id, date: new Date(now.getFullYear(), now.getMonth(), 2) },
    { amount: 200000, type: TransactionType.EXPENSE, description: 'Kursus online Udemy', categoryId: getCategory('Pendidikan').id, date: new Date(now.getFullYear(), now.getMonth(), 12) },
  ]

  for (const tx of demoTransactions) {
    await prisma.transaction.create({
      data: {
        ...tx,
        userId: demoUser.id,
      },
    })
  }

  // ── Seed demo budgets ──────────────────────────────────────
  console.log('  Creating demo budgets...')
  const budgetData = [
    { categoryName: 'Makanan & Minuman', amount: 1500000 },
    { categoryName: 'Transportasi', amount: 500000 },
    { categoryName: 'Hiburan', amount: 300000 },
    { categoryName: 'Belanja', amount: 700000 },
    { categoryName: 'Tagihan & Utilitas', amount: 600000 },
  ]

  for (const b of budgetData) {
    const category = getCategory(b.categoryName)
    await prisma.budget.upsert({
      where: {
        userId_categoryId_period: {
          userId: demoUser.id,
          categoryId: category.id,
          period: 'MONTHLY',
        },
      },
      update: {},
      create: {
        userId: demoUser.id,
        categoryId: category.id,
        amount: b.amount,
        period: 'MONTHLY',
        alertThreshold: 80,
      },
    })
  }

  console.log('✅ Seeding complete!')
  console.log(`   Demo login: demo@finsight.app`)
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })