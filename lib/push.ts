// lib/push.ts
// Wrapper untuk mengirim Web Push notification ke semua device
// (subscription) milik satu user.
import webpush from 'web-push'
import { prisma } from '@/lib/prisma'

const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
const privateKey = process.env.VAPID_PRIVATE_KEY
const subject = process.env.VAPID_SUBJECT ?? 'mailto:admin@example.com'

if (publicKey && privateKey) {
  webpush.setVapidDetails(subject, publicKey, privateKey)
}

interface PushPayload {
  title: string
  body: string
  url?: string
}

export async function sendPushToUser(userId: string, payload: PushPayload): Promise<void> {
  if (!publicKey || !privateKey) {
    console.warn('VAPID keys belum di-set, push notification dilewati')
    return
  }

  const subscriptions = await prisma.pushSubscription.findMany({ where: { userId } })

  await Promise.allSettled(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          JSON.stringify(payload)
        )
      } catch (err) {
        const statusCode = (err as { statusCode?: number }).statusCode
        if (statusCode === 404 || statusCode === 410) {
          // Subscription sudah expired/dicabut user dari browser — bersihkan dari DB
          await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {})
        } else {
          console.error('Push notification error:', err)
        }
      }
    })
  )
}