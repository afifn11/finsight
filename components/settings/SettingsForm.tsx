// components/settings/SettingsForm.tsx
'use client'

import { useState } from 'react'
import { AlertTriangle, LogOut } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { signOut } from 'next-auth/react'
import { userSettingsSchema, type UserSettingsInput } from '@/lib/validations'
import { getInitials } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal, ModalHeader, useModalIds } from '@/components/ui/Modal'

interface Props {
  user: { id: string; name?: string | null; email: string; image?: string | null }
}

export function SettingsForm({ user }: Props) {
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const { titleId, descriptionId } = useModalIds()
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<UserSettingsInput>({
    // @ts-expect-error — zodResolver v5 inference difference with exactOptionalPropertyTypes
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

  async function handleDeleteAccount() {
    setIsDeleting(true)
    try {
      const res = await fetch('/api/user/delete', { method: 'DELETE' })
      if (!res.ok) throw new Error()
      toast.success('Akun berhasil dihapus')
      await signOut({ callbackUrl: '/login' })
    } catch {
      toast.error('Gagal menghapus akun. Coba lagi.')
      setIsDeleting(false)
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

        <form onSubmit={handleSubmit(onSubmit as unknown as Parameters<typeof handleSubmit>[0])} className="space-y-4">
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

          <Button type="submit" disabled={!isDirty} loading={isSubmitting}>
            Simpan perubahan
          </Button>
        </form>
      </div>

      {/* Logout card */}
      <div className="card p-6">
        <h2 className="font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
          Keluar
        </h2>
        <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
          Keluar dari akun FinSight di perangkat ini.
        </p>
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-colors hover:opacity-80"
          style={{ borderColor: 'var(--border-default)', color: 'var(--text-primary)' }}
        >
          <LogOut className="w-4 h-4" />
          Keluar dari akun
        </button>
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
          Menghapus akun akan menghapus semua transaksi, budget, dan data keuanganmu secara permanen.
          Tindakan ini tidak dapat dibatalkan.
        </p>
        <button
          onClick={() => setShowDeleteModal(true)}
          className="px-4 py-2 rounded-lg text-sm font-medium border transition-colors hover:opacity-80"
          style={{ borderColor: 'var(--color-danger-500)', color: 'var(--color-danger-500)' }}
        >
          Hapus akun & semua data
        </button>
      </div>

      {/* Delete confirmation modal */}
      <Modal
        open={showDeleteModal}
        onClose={() => { setShowDeleteModal(false); setDeleteConfirmText('') }}
        labelledBy={titleId}
        describedBy={descriptionId}
        maxWidth="sm"
        disableClose={isDeleting}
      >
        <ModalHeader
          titleId={titleId}
          title="Hapus akun?"
          description="Semua data akan dihapus permanen"
          icon={<AlertTriangle className="w-5 h-5" />}
          iconColor="var(--color-danger-500)"
          iconBg="var(--color-danger-50)"
        />
        <div className="px-5 pb-5 pt-4">
          <p id={descriptionId} className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
            Ketik <span className="font-mono font-semibold" style={{ color: 'var(--color-danger-500)' }}>hapus akun saya</span> untuk mengkonfirmasi.
          </p>

          <Input
            type="text"
            value={deleteConfirmText}
            onChange={(e) => setDeleteConfirmText(e.target.value)}
            placeholder="hapus akun saya"
            className="mb-4"
            aria-label="Konfirmasi hapus akun"
          />

          <div className="flex gap-3">
            <Button
              variant="secondary"
              fullWidth
              onClick={() => { setShowDeleteModal(false); setDeleteConfirmText('') }}
            >
              Batal
            </Button>
            <Button
              variant="danger"
              fullWidth
              onClick={handleDeleteAccount}
              disabled={deleteConfirmText !== 'hapus akun saya'}
              loading={isDeleting}
            >
              Hapus permanen
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}