'use client'

import { useState, useEffect, Suspense } from 'react'
import { signIn, getSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { GraduationCap, Loader2, Eye, EyeOff, ArrowLeft, CheckCircle, MailWarning } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const loginSchema = z.object({
  email: z.string().email('Некорректный email'),
  password: z.string().min(1, 'Введите пароль'),
})

type LoginForm = z.infer<typeof loginSchema>

// VK SVG icon
const VKIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
    <path d="M15.684 0H8.316C1.592 0 0 1.592 0 8.316v7.368C0 22.408 1.592 24 8.316 24h7.368C22.408 24 24 22.408 24 15.684V8.316C24 1.592 22.391 0 15.684 0zm3.692 17.123h-1.744c-.66 0-.864-.525-2.05-1.727-1.033-1-1.49-1.135-1.744-1.135-.356 0-.458.102-.458.593v1.575c0 .424-.135.678-1.253.678-1.846 0-3.896-1.118-5.335-3.202C4.624 10.857 4.03 8.57 4.03 8.096c0-.254.102-.491.593-.491h1.744c.44 0 .61.203.779.678.864 2.49 2.303 4.675 2.896 4.675.22 0 .322-.102.322-.66V9.721c-.068-1.186-.695-1.287-.695-1.71 0-.204.17-.407.44-.407h2.744c.373 0 .508.203.508.643v3.473c0 .372.17.508.271.508.22 0 .407-.136.813-.542 1.253-1.406 2.151-3.574 2.151-3.574.119-.254.322-.491.762-.491h1.744c.525 0 .644.27.525.643-.22 1.017-2.354 4.031-2.354 4.031-.186.305-.254.44 0 .78.186.254.796.779 1.203 1.253.745.847 1.32 1.558 1.473 2.05.17.49-.085.745-.576.745z"/>
  </svg>
)

// Mail.ru SVG icon
const MailRuIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
    <path d="M24 12.073c0 6.627-5.373 12-12 12s-12-5.373-12-12 5.373-12 12-12 12 5.373 12 12zM7.5 7.5v9h9v-9h-9zm4.5 2.25l4.5 3.25-4.5 3.25-4.5-3.25 4.5-3.25z"/>
  </svg>
)

// Yandex icon
const YandexIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
    <path d="M2.04 12c0-5.523 4.476-10 9.999-10C17.522 2 22 6.477 22 12s-4.478 10-9.961 10C6.516 22 2.04 17.523 2.04 12zm9.282-3.388H9.996v6.776h1.326V12.09l2.376 3.298h1.666l-2.56-3.48 2.38-3.296h-1.6l-2.262 3.15V8.612zm-1.326 0H8.67c-1.326 0-2.013.655-2.013 1.927 0 .888.394 1.503 1.118 1.818l-1.312 3.031h1.434l1.2-2.783h.899v2.783H11v-6.776z"/>
  </svg>
)

function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [oauthLoading, setOauthLoading] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [unverifiedEmail, setUnverifiedEmail] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    const verified = searchParams.get('verified')
    const reset = searchParams.get('reset')
    const errorParam = searchParams.get('error')
    if (verified === '1') setSuccessMessage('Email подтверждён! Теперь вы можете войти.')
    if (reset === '1') setSuccessMessage('Пароль успешно изменён! Войдите с новым паролем.')
    if (errorParam === 'token_expired') setError('Ссылка устарела. Запросите новое письмо.')
    if (errorParam === 'invalid_token') setError('Недействительная ссылка подтверждения.')
    if (errorParam === 'OAuthSignin' || errorParam === 'OAuthCallback' || errorParam === 'OAuthCreateAccount') {
      setError('Ошибка входа через соцсеть. Проверьте настройки OAuth-приложения.')
    }
  }, [searchParams])

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginForm) => {
    setLoading(true)
    setError('')
    try {
      const result = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false,
      })

      if (result?.error === 'EMAIL_NOT_VERIFIED') {
        setUnverifiedEmail(data.email)
        setError('')
      } else if (result?.error) {
        setError('Неверный email или пароль')
      } else {
        const session = await getSession()
        const callbackUrl = searchParams.get('callbackUrl')
        const dest = callbackUrl
          ? decodeURIComponent(callbackUrl)
          : (session?.user?.isAdmin ? '/admin' : '/dashboard')
        router.push(dest)
        router.refresh()
      }
    } finally {
      setLoading(false)
    }
  }

  const handleOAuth = async (provider: string) => {
    setOauthLoading(provider)
    const callbackUrl = searchParams.get('callbackUrl')
      ? decodeURIComponent(searchParams.get('callbackUrl')!)
      : '/dashboard'
    if (provider === 'vk') {
      window.location.href = `/api/vk-auth?callbackUrl=${encodeURIComponent(callbackUrl)}`
      return
    }
    await signIn(provider, { callbackUrl })
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0F0F1A] relative overflow-hidden px-4">
      {/* Back button */}
      <Link
        href="/"
        className="absolute top-6 left-6 flex items-center gap-2 text-white/50 hover:text-white transition-colors text-sm"
      >
        <ArrowLeft className="w-4 h-4" />
        На главную
      </Link>

      {/* Background effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#6C3EF4] rounded-full blur-[128px] opacity-10" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-[#3B82F6] rounded-full blur-[128px] opacity-10" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#6C3EF4] to-[#3B82F6] flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-[#6C3EF4] to-[#3B82F6] bg-clip-text text-transparent">
              StudyAssist
            </span>
          </Link>
          <h1 className="text-2xl font-bold text-white mt-6 mb-2">Вход в аккаунт</h1>
          <p className="text-white/50 text-sm">Войдите, чтобы отслеживать свои заявки</p>
        </div>

        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
          {/* Success message */}
          {successMessage && (
            <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl px-4 py-3 mb-6">
              <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
              <p className="text-emerald-400 text-sm">{successMessage}</p>
            </div>
          )}

          {/* Email not verified block */}
          {unverifiedEmail && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl px-4 py-4 mb-6">
              <div className="flex items-start gap-3">
                <MailWarning className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-amber-400 text-sm font-medium mb-1">Email не подтверждён</p>
                  <p className="text-amber-300/70 text-xs mb-3">
                    Проверьте почту и перейдите по ссылке из письма.
                  </p>
                  <Link
                    href={`/auth/verify-email?email=${encodeURIComponent(unverifiedEmail)}`}
                    className="text-xs text-amber-400 underline hover:text-amber-300 transition-colors"
                  >
                    Не получили письмо? Отправить повторно →
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Email/password form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mb-6">
            <div>
              <Label className="mb-2 block">Email</Label>
              <Input {...register('email')} type="email" placeholder="your@email.ru" />
              {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <Label className="mb-2 block">Пароль</Label>
              <div className="relative">
                <Input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Введите пароль"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password.message}</p>}
              <div className="flex justify-end mt-1">
                <Link href="/auth/forgot-password" className="text-xs text-white/40 hover:text-[#6C3EF4] transition-colors">
                  Забыли пароль?
                </Link>
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            <Button type="submit" disabled={loading} className="w-full gap-2" size="lg">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Войти
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-[#1A1A2E] px-3 text-white/40">или войти через</span>
            </div>
          </div>

          {/* OAuth buttons */}
          <div className="space-y-3">
            <button
              onClick={() => handleOAuth('vk')}
              disabled={!!oauthLoading}
              className="w-full flex items-center justify-center gap-3 h-11 rounded-xl bg-[#0077FF] hover:bg-[#0066DD] text-white font-medium text-sm transition-all duration-200 disabled:opacity-50"
            >
              {oauthLoading === 'vk' ? <Loader2 className="w-4 h-4 animate-spin" /> : <VKIcon />}
              Войти через ВКонтакте
            </button>

            <button
              onClick={() => handleOAuth('mailru')}
              disabled={!!oauthLoading}
              className="w-full flex items-center justify-center gap-3 h-11 rounded-xl bg-[#005FF9] hover:bg-[#0050D0] text-white font-medium text-sm transition-all duration-200 disabled:opacity-50"
            >
              {oauthLoading === 'mailru' ? <Loader2 className="w-4 h-4 animate-spin" /> : <MailRuIcon />}
              Войти через Mail.ru
            </button>

            <button
              onClick={() => handleOAuth('yandex')}
              disabled={!!oauthLoading}
              className="w-full flex items-center justify-center gap-3 h-11 rounded-xl bg-[#FC3F1D] hover:bg-[#E03518] text-white font-medium text-sm transition-all duration-200 disabled:opacity-50"
            >
              {oauthLoading === 'yandex' ? <Loader2 className="w-4 h-4 animate-spin" /> : <YandexIcon />}
              Войти через Яндекс
            </button>
          </div>

          {/* Register link */}
          <p className="text-center text-white/50 text-sm mt-6">
            Нет аккаунта?{' '}
            <Link href="/auth/register" className="text-[#6C3EF4] hover:text-[#8B5CF6] transition-colors">
              Зарегистрироваться
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}

export default function LoginPageWrapper() {
  return (
    <Suspense>
      <LoginPage />
    </Suspense>
  )
}
