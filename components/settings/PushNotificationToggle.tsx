// components/settings/PushNotificationToggle.tsx
'use client'

import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; i++) outputArray[i] = rawData.charCodeAt(i)
  return outputArray
}

export function PushNotificationToggle() {
  const [supported, setSupported] = useState(false)
  const [subscribed, setSubscribed] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function check() {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        setSupported(false)
        setLoading(false)
        return
      }
      setSupported(true)
      try {
        const reg = await navigator.serviceWorker.ready
        const sub = await reg.pushManager.getSubscription()
        setSubscribed(!!sub)
      } catch {
        // biarkan default false
      } finally {
        setLoading(false)
      }
    }
    void check()
  }, [])

  async function handleToggle() {
    if (!supported) return
    setLoading(true)
    try {
      const reg = await navigator.serviceWorker.ready

      if (subscribed) {
        const sub = await reg.pushManager.getSubscription()
        if (sub) {
          await fetch('/api/push/unsubscribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ endpoint: sub.endpoint }),
          })
          await sub.unsubscribe()
        }
        setSubscribed(false)
        toast.success('Notifikasi dimatikan')
        return
      }

      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        toast.error('Izin notifikasi ditolak. Aktifkan lewat pengaturan browser kalau berubah pikiran.')
        return
      }

      const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      if (!publicKey) {
        toast.error('Konfigurasi notifikasi belum lengkap')
        return
      }

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource,
      })

      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sub.toJSON()),
      })

      setSubscribed(true)
      toast.success('Notifikasi budget diaktifkan')
    } catch (err) {
      console.error(err)
      toast.error('Gagal mengubah pengaturan notifikasi')
    } finally {
      setLoading(false)
    }
  }

  if (!supported) {
    return (
      <div className="card p-4">
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          Browser ini tidak mendukung push notification.
        </p>
      </div>
    )
  }

  return (
    <div className="card p-4 flex items-center justify-between">
      <div>
        <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
          Notifikasi budget
        </p>
        <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
          Dapat notifikasi saat budget mendekati limit
        </p>
      </div>
      <button
        onClick={handleToggle}
        disabled={loading}
        role="switch"
        aria-checked={subscribed}
        aria-label="Aktifkan notifikasi budget"
        className="relative w-11 h-6 rounded-full transition-colors disabled:opacity-50 shrink-0"
        style={{ background: subscribed ? 'var(--color-primary-600)' : 'var(--border-default)' }}
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin absolute top-1 left-1 text-white" aria-hidden="true" />
        ) : (
          <span
            className="absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform"
            style={{ transform: subscribed ? 'translateX(20px)' : 'translateX(0)' }}
          />
        )}
      </button>
    </div>
  )
}