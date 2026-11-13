// app/(auth)/login/page.tsx
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Loader2, AlertCircle, ArrowLeft } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { loginSchema, type LoginInput } from '@/lib/validations'

export default function LoginPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) })

  async function onSubmit(data: LoginInput) {
    setAuthError(null)
    try {
      const result = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false,
      })

      if (result?.error) {
        const msg = 'Email atau password tidak sesuai. Silakan periksa kembali.'
        setAuthError(msg)
        toast.error(msg)
        return
      }

      toast.success('Berhasil masuk!')
      router.push('/dashboard')
      router.refresh()
    } catch {
      const msg = 'Terjadi gangguan jaringan atau server. Silakan coba lagi.'
      setAuthError(msg)
      toast.error(msg)
    }
  }

  async function handleGoogle() {
    setAuthError(null)
    setIsGoogleLoading(true)
    try {
      await signIn('google', { callbackUrl: '/dashboard' })
    } catch {
      setIsGoogleLoading(false)
      toast.error('Gagal menghubungkan akun Google')
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col justify-center items-center p-4 selection:bg-lime-400 selection:text-zinc-950">
      <div className="w-full max-w-md space-y-6">
        {/* Back to Landing Link */}
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Kembali ke Beranda</span>
          </Link>
        </div>

        {/* Brand Header */}
        <div className="flex flex-col items-center text-center gap-2">
          <div className="flex items-center justify-center w-11 h-11 rounded-2xl bg-zinc-900 dark:bg-zinc-800 border border-zinc-800 dark:border-zinc-700">
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect x="3" y="2.5" width="4" height="15" rx="1.5" fill="white" />
              <rect x="3" y="2.5" width="13" height="4" rx="1.5" fill="white" />
              <rect x="3" y="8.5" width="10" height="4" rx="1.5" fill="white" />
              <circle cx="17" cy="17" r="2.8" fill="#a3e635" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white mt-1">
            Masuk ke FinSight
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Kelola arus kas dan kekayaan bersihmu secara presisi
          </p>
        </div>

        {/* Auth Card */}
        <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 sm:p-8 space-y-5">
          {/* Error Banner */}
          {authError && (
            <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-700 dark:text-rose-300">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
              <span>{authError}</span>
            </div>
          )}

          {/* Google OAuth Button */}
          <button
            type="button"
            onClick={handleGoogle}
            disabled={isGoogleLoading || isSubmitting}
            className="flex w-full items-center justify-center gap-2.5 py-2.5 px-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-800/70 dark:hover:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGoogleLoading ? (
              <Loader2 className="w-4 h-4 animate-spin text-zinc-600 dark:text-zinc-300" />
            ) : (
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
            )}
            <span>Lanjutkan dengan Google</span>
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 border-t border-zinc-200 dark:border-zinc-800" />
            <span className="text-xs font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
              atau email
            </span>
            <div className="flex-1 border-t border-zinc-200 dark:border-zinc-800" />
          </div>

          {/* Credentials Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <div>
              <label
                htmlFor="login-email"
                className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1.5"
              >
                Alamat Email
              </label>
              <input
                id="login-email"
                {...register('email')}
                type="email"
                autoComplete="email"
                placeholder="nama@email.com"
                className={`w-full px-3.5 py-2.5 rounded-xl border bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 text-sm outline-none transition-all focus:ring-2 ${
                  errors.email
                    ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/20'
                    : 'border-zinc-200 dark:border-zinc-800 focus:border-lime-500 dark:focus:border-lime-400 focus:ring-lime-500/20'
                }`}
              />
              {errors.email && (
                <p className="text-xs mt-1.5 text-rose-600 dark:text-rose-400 font-medium">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="login-password"
                className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1.5"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="login-password"
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className={`w-full px-3.5 py-2.5 pr-10 rounded-xl border bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 text-sm outline-none transition-all focus:ring-2 ${
                    errors.password
                      ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/20'
                      : 'border-zinc-200 dark:border-zinc-800 focus:border-lime-500 dark:focus:border-lime-400 focus:ring-lime-500/20'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
                  aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs mt-1.5 text-rose-600 dark:text-rose-400 font-medium">
                  {errors.password.message}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting || isGoogleLoading}
              className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-5 rounded-xl bg-lime-500 hover:bg-lime-600 text-zinc-950 dark:bg-lime-400 dark:hover:bg-lime-300 dark:text-zinc-950 text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{isSubmitting ? 'Memverifikasi...' : 'Masuk ke Akun'}</span>
            </button>
          </form>
        </div>

        {/* Footer Navigation */}
        <p className="text-center text-sm text-zinc-600 dark:text-zinc-400">
          Belum punya akun?{' '}
          <Link
            href="/register"
            className="font-semibold text-lime-600 dark:text-lime-400 hover:underline"
          >
            Daftar gratis
          </Link>
        </p>
      </div>
    </div>
  )
}
