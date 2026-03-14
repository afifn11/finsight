// app/(auth)/login/page.tsx
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { TrendingUp, Eye, EyeOff, Loader2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { loginSchema, type LoginInput } from '@/lib/validations'

export default function LoginPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) })

  async function onSubmit(data: LoginInput) {
    const result = await signIn('credentials', {
      email: data.email,
      password: data.password,
      redirect: false,
    })

    if (result?.error) {
      toast.error('Email atau password salah')
      return
    }

    router.push('/')
    router.refresh()
  }

  async function handleGoogle() {
    setIsGoogleLoading(true)
    await signIn('google', { callbackUrl: '/' })
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'var(--bg-page)' }}
    >
      <div className="w-full max-w-sm space-y-6">
        {/* Logo */}
        <div className="flex flex-col items-center gap-2">
          <div
            className="flex items-center justify-center w-10 h-10 rounded-xl"
            style={{ background: 'var(--color-primary-800)' }}
          >
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
            Masuk ke FinSight
          </h1>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Kelola keuanganmu dengan lebih cerdas
          </p>
        </div>

        {/* Card */}
        <div className="card p-6 space-y-4">
          {/* Google OAuth */}
          <button
            onClick={handleGoogle}
            disabled={isGoogleLoading || isSubmitting}
            className="flex w-full items-center justify-center gap-2.5 py-2.5 px-4 rounded-lg border text-sm font-medium transition-colors hover:opacity-80 disabled:opacity-50"
            style={{
              background: 'var(--bg-card)',
              borderColor: 'var(--border-default)',
              color: 'var(--text-primary)',
            }}
          >
            {isGoogleLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            )}
            Lanjutkan dengan Google
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 border-t" style={{ borderColor: 'var(--border-default)' }} />
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>atau</span>
            <div className="flex-1 border-t" style={{ borderColor: 'var(--border-default)' }} />
          </div>

          {/* Email form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
            <div>
              <label className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                Email
              </label>
              <input
                {...register('email')}
                type="email"
                placeholder="kamu@email.com"
                className="mt-1 w-full px-3 py-2 rounded-lg border text-sm outline-none transition-colors"
                style={{
                  background: 'var(--bg-card)',
                  borderColor: errors.email ? 'var(--color-danger-500)' : 'var(--border-default)',
                  color: 'var(--text-primary)',
                }}
              />
              {errors.email && (
                <p className="text-xs mt-1" style={{ color: 'var(--color-danger-500)' }}>
                  {errors.email.message}
                </p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                Password
              </label>
              <div className="relative mt-1">
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 pr-10 rounded-lg border text-sm outline-none transition-colors"
                  style={{
                    background: 'var(--bg-card)',
                    borderColor: errors.password ? 'var(--color-danger-500)' : 'var(--border-default)',
                    color: 'var(--text-primary)',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs mt-1" style={{ color: 'var(--color-danger-500)' }}>
                  {errors.password.message}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex w-full items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium text-white transition-colors disabled:opacity-60 hover:opacity-90"
              style={{ background: 'var(--color-primary-800)' }}
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              Masuk
            </button>
          </form>

          {/* Demo account hint */}
          <div
            className="rounded-lg p-3 text-xs"
            style={{ background: 'var(--color-primary-50)', color: 'var(--color-primary-700)' }}
          >
            <strong>Demo account:</strong> demo@finsight.app / demo123456
          </div>
        </div>

        <p className="text-center text-sm" style={{ color: 'var(--text-secondary)' }}>
          Belum punya akun?{' '}
          <Link href="/register" className="font-medium" style={{ color: 'var(--color-primary-600)' }}>
            Daftar gratis
          </Link>
        </p>
      </div>
    </div>
  )
}
