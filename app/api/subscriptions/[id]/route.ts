// app/api/subscriptions/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { updateSubscriptionSchema } from '@/lib/validations'
import { addDays, addMonths, addYears } from 'date-fns'
import type { ApiResponse, ApiError } from '@/types'

type RouteParams = { params: Promise<{ id: string }> }

// ── GET /api/subscriptions/:id ─────────────────────────────────
export async function GET(_req: NextRequest, { params }: RouteParams) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json<ApiError>({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const subscription = await prisma.subscription.findUnique({
    where: { id },
  })

  if (!subscription || subscription.userId !== session.user.id) {
    return NextResponse.json<ApiError>({ error: 'Langganan tidak ditemukan' }, { status: 404 })
  }

  return NextResponse.json<ApiResponse<typeof subscription>>({ data: subscription })
}

// ── PATCH /api/subscriptions/:id ───────────────────────────────
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json<ApiError>({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  // Verify ownership
  const existing = await prisma.subscription.findUnique({
    where: { id },
  })

  if (!existing || existing.userId !== session.user.id) {
    return NextResponse.json<ApiError>({ error: 'Langganan tidak ditemukan' }, { status: 404 })
  }

  const body = (await req.json()) as unknown
  const parsed = updateSubscriptionSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json<ApiError>(
      {
        error: parsed.error.issues[0]?.message ?? 'Data pembaruan tidak valid',
        details: parsed.error.format(),
      },
      { status: 400 }
    )
  }

  const updateData = { ...parsed.data }
  const cycleToUse = updateData.billingCycle ?? existing.billingCycle

  // If advanceCycle is requested (e.g. user clicked "Tandai Lunas / Perbarui")
  if (updateData.advanceCycle) {
    const baseDate = new Date(existing.nextBillingDate)
    let advancedDate: Date

    if (cycleToUse === 'WEEKLY') {
      advancedDate = addDays(baseDate, 7)
    } else if (cycleToUse === 'YEARLY') {
      advancedDate = addYears(baseDate, 1)
    } else {
      advancedDate = addMonths(baseDate, 1)
    }

    updateData.nextBillingDate = advancedDate
    delete updateData.advanceCycle
  }

  const updated = await prisma.subscription.update({
    where: { id },
    data: {
      ...(updateData.name !== undefined && { name: updateData.name }),
      ...(updateData.amount !== undefined && { amount: updateData.amount }),
      ...(updateData.billingCycle !== undefined && { billingCycle: updateData.billingCycle }),
      ...(updateData.nextBillingDate !== undefined && { nextBillingDate: updateData.nextBillingDate }),
      ...(updateData.category !== undefined && { category: updateData.category }),
      ...(updateData.color !== undefined && { color: updateData.color }),
      ...(updateData.icon !== undefined && { icon: updateData.icon }),
      ...(updateData.status !== undefined && { status: updateData.status }),
      ...(updateData.notes !== undefined && { notes: updateData.notes ?? null }),
    },
  })

  return NextResponse.json<ApiResponse<typeof updated>>({
    data: updated,
    message: 'Langganan berhasil diperbarui',
  })
}

// ── DELETE /api/subscriptions/:id ──────────────────────────────
export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json<ApiError>({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  const existing = await prisma.subscription.findUnique({
    where: { id },
    select: { id: true, userId: true },
  })

  if (!existing || existing.userId !== session.user.id) {
    return NextResponse.json<ApiError>({ error: 'Langganan tidak ditemukan' }, { status: 404 })
  }

  await prisma.subscription.delete({
    where: { id },
  })

  return NextResponse.json<ApiResponse<{ id: string }>>({
    data: { id },
    message: 'Langganan berhasil dihapus',
  })
}
