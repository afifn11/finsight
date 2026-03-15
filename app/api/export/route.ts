// app/api/export/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns'
import { id as localeId } from 'date-fns/locale'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = req.nextUrl
  const type = searchParams.get('type') ?? 'csv'       // 'csv' | 'pdf'
  const period = searchParams.get('period') ?? 'current' // 'current' | 'last3'

  const now = new Date()
  const dateRange =
    period === 'last3'
      ? { start: startOfMonth(subMonths(now, 2)), end: endOfMonth(now) }
      : { start: startOfMonth(now), end: endOfMonth(now) }

  const transactions = await prisma.transaction.findMany({
    where: {
      userId: session.user.id,
      date: { gte: dateRange.start, lte: dateRange.end },
    },
    include: { category: true },
    orderBy: { date: 'desc' },
  })

  const periodLabel =
    period === 'last3'
      ? `${format(dateRange.start, 'MMM', { locale: localeId })}-${format(dateRange.end, 'MMM yyyy', { locale: localeId })}`
      : format(now, 'MMMM yyyy', { locale: localeId })

  // ── CSV Export ─────────────────────────────────────────────
  if (type === 'csv') {
    const header = ['Tanggal', 'Deskripsi', 'Kategori', 'Tipe', 'Nominal (IDR)']
    const rows = transactions.map((tx) => [
      format(new Date(tx.date), 'dd/MM/yyyy'),
      `"${(tx.description ?? '').replace(/"/g, '""')}"`,
      tx.category.name,
      tx.type === 'INCOME' ? 'Pemasukan' : 'Pengeluaran',
      Number(tx.amount).toString(),
    ])

    const csv = [header.join(','), ...rows.map((r: string[]) => r.join(','))].join('\n')
    const filename = `finsight-${periodLabel.replace(/\s/g, '-')}.csv`

    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  }

  // ── PDF Export (server-side data, client renders PDF) ─────
  // Return structured JSON — client uses jsPDF to render
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const txArr = transactions as any[]
  const totalIncome = txArr
    .filter((t) => t.type === 'INCOME')
    .reduce((s: number, t) => s + Number(t.amount), 0)
  const totalExpense = txArr
    .filter((t) => t.type === 'EXPENSE')
    .reduce((s: number, t) => s + Number(t.amount), 0)

  return NextResponse.json({
    period: periodLabel,
    generatedAt: new Date().toISOString(),
    summary: {
      totalIncome,
      totalExpense,
      netBalance: totalIncome - totalExpense,
      transactionCount: transactions.length,
    },
    transactions: transactions.map((tx) => ({
      date: format(new Date(tx.date), 'dd MMM yyyy', { locale: localeId }),
      description: tx.description ?? '',
      category: tx.category.name,
      type: tx.type,
      amount: Number(tx.amount),
    })),
  })
}