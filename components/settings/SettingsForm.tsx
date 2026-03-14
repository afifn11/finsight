// components/settings/SettingsForm.tsx
'use client'

import { Loader2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { userSettingsSchema, type UserSettingsInput } from '@/lib/validations'
import { getInitials } from '@/lib/utils'

interface Props {
  user: { id: string; name?: string | null; email: string; image?: string | null }
}

export function SettingsForm({ user }: Props) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<UserSettingsInput>({
    resolver: zodResolver(userSettingsSchema),
    defaultValues: {
      name: user.name ?? '',
      currency: 'IDR',
      timezone: 'Asia/Jakarta',
    },
  })

  async function onSubmit(data: UserSettingsInput) {
    try {
      const res = await fetch('/api/user/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error()
      toast.success('Pengaturan disimpan')
    } catch {
      toast.error('Gagal menyimpan pengaturan')
    }
  }

  return (
    <div className="space-y-5">
      {/* Profile card */}
      <div className="card p-6">
        <h2 className="font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
          Profil
        </h2>

        <div className="flex items-center gap-4 mb-6">
          {user.image ? (
            <img src={user.image} alt="" className="w-16 h-16 rounded-full object-cover" />
          ) : (
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-semibold text-white"
              style={{ background: 'var(--color-primary-600)' }}
            >
              {getInitials(user.name)}
            </div>
          )}
          <div>
            <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
              {user.name ?? 'User'}
            </p>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              {user.email}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
              Nama
            </label>
            <input
              {...register('name')}
              type="text"
              className="mt-1 w-full px-3 py-2 rounded-lg border text-sm outline-none"
              style={{
                background: 'var(--bg-card)',
                borderColor: errors.name ? 'var(--color-danger-500)' : 'var(--border-default)',
                color: 'var(--text-primary)',
              }}
            />
            {errors.name && (
              <p className="text-xs mt-1" style={{ color: 'var(--color-danger-500)' }}>
                {errors.name.message}
              </p>
            )}
          </div>

          <div>
            <label className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
              Mata uang
            </label>
            <select
              {...register('currency')}
              className="mt-1 w-full px-3 py-2 rounded-lg border text-sm outline-none"
              style={{
                background: 'var(--bg-card)',
                borderColor: 'var(--border-default)',
                color: 'var(--text-primary)',
              }}
            >
              <option value="IDR">IDR — Rupiah Indonesia</option>
              <option value="USD">USD — US Dollar</option>
              <option value="SGD">SGD — Singapore Dollar</option>
              <option value="MYR">MYR — Malaysian Ringgit</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
              Zona waktu
            </label>
            <select
              {...register('timezone')}
              className="mt-1 w-full px-3 py-2 rounded-lg border text-sm outline-none"
              style={{
                background: 'var(--bg-card)',
                borderColor: 'var(--border-default)',
                color: 'var(--text-primary)',
              }}
            >
              <option value="Asia/Jakarta">WIB — Asia/Jakarta</option>
              <option value="Asia/Makassar">WITA — Asia/Makassar</option>
              <option value="Asia/Jayapura">WIT — Asia/Jayapura</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !isDirty}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-50 transition-colors"
            style={{ background: 'var(--color-primary-800)' }}
          >
            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
            Simpan perubahan
          </button>
        </form>
      </div>

      {/* Danger zone */}
      <div
        className="card p-6 border"
        style={{ borderColor: 'var(--color-danger-500)' }}
      >
        <h2 className="font-semibold mb-1" style={{ color: 'var(--color-danger-500)' }}>
          Danger Zone
        </h2>
        <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
          Tindakan ini tidak dapat dibatalkan.
        </p>
        <button
          onClick={() => toast.error('Fitur hapus akun akan segera tersedia')}
          className="px-4 py-2 rounded-lg text-sm font-medium border transition-colors hover:opacity-80"
          style={{ borderColor: 'var(--color-danger-500)', color: 'var(--color-danger-500)' }}
        >
          Hapus akun & semua data
        </button>
      </div>
    </div>
  )
}
