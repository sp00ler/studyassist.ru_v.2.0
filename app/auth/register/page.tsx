'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { GraduationCap, Loader2, Eye, EyeOff, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const registerSchema = z.object({
  name: z.string().min(2, 'Имя должно содержать минимум 2 символа'),
  email: z.string().email('Некорректный email'),
  password: z.string().min(6, 'Пароль должен содержать минимум 6 символов'),
  confirmPassword: z.string(),
  consent: z.boolean().refine((v) => v === true, 'Необходимо принять условия'),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'Пароли не совпадают',
  path: ['confirmPassword'],
})

type RegisterForm = z.infer<typeof registerSchema>

// OAuth icon helpers (same as login page)
const VKIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
    <path d="M15.684 0H8.316C1.592 0 0 1.592 0 8.316v7.368C0 22.408 1.592 24 8.316 24h7.368C22.408 24 24 22.408 24 15.684V8.316C24 1.592 22.391 0 15.684 0zm3.692 17.123h-1.744c-.66 0-.864-.525-2.05-1.727-1.033-1-1.49-1.135-1.744-1.135-.356 0-.458.102-.458.593v1.575c0 .424-.135.678-1.253.678-1.846 0-3.896-1.118-5.335-3.202C4.624 10.857 4.03 8.57 4.03 8.096c0-.254.102-.491.593-.491h1.744c.44 0 .61.203.779.678.864 2.49 2.303 4.675 2.896 4.675.22 0 .322-.102.322-.66V9.721c-.068-1.186-.695-1.287-.695-1.71 0-.204.17-.407.44-.407h2.744c.373 0 .508.203.508.643v3.473c0 .372.17.508.271.508.22 0 .407-.136.813-.542 1.253-1.406 2.151-3.574 2.151-3.574.119-.254.322-.491.762-.491h1.744c.525 0 .644.27.525.643-.22 1.017-2.354 4.031-2.354 4.031-.186.305-.254.44 0 .78.186.254.796.779 1.203 1.253.745.847 1.32 1.558 1.473 2.05.17.49-.085.745-.576.745z"/>
  </svg>
)
const MailRuIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
    <path d="M24 12.073c0 6.627-5.373 12-12 12s-12-5.373-12-12 5.373-12 12-12 12 5.373 12 12zM7.5 7.5v9h9v-9h-9zm4.5 2.25l4.5 3.25-4.5 3.25-4.5-3.25 4.5-3.25z"/>
  </svg>
)
const YandexIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
    <path d="M2.04 12c0-5.523 4.476-10 9.999-10C17.522 2 22 6.477 22 12s-4.478 10-9.961 10C6.516 22 2.04 17.523 2.04 12zm9.282-3.388H9.996v6.776h1.326V12.09l2.376 3.298h1.666l-2.56-3.48 2.38-3.296h-1.6l-2.262 3.15V8.612zm-1.326 0H8.67c-1.326 0-2.013.655-2.013 1.927 0 .888.394 1.503 1.118 1.818l-1.312 3.031h1.434l1.2-2.783h.899v2.783H11v-6.776z"/>
  </svg>
)

export default function RegisterPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [oauthLoading, setOauthLoading] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  })

  const onSubmit = async (data: RegisterForm) => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: data.name, email: data.email, password: data.password }),
      })

      const result = await res.json()
      if (!res.ok) {
        setError(result.error || 'Ошибка регистрации')
        return
      }

      // Перенаправляем на страницу подтверждения email
      router.push(`/auth/verify-email?email=${encodeURIComponent(data.email)}`)
    } catch {
      setError('Произошла ошибка. Попробуйте позже.')
    } finally {
      setLoading(false)
    }
  }

  const handleOAuth = async (provider: string) => {
    setOauthLoading(provider)
    await signIn(provider, { callbackUrl: '/dashboard' })
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0F0F1A] relative overflow-hidden px-4 py-8">
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
          <h1 className="text-2xl font-bold text-white mt-6 mb-2">Регистрация</h1>
          <p className="text-white/50 text-sm">Создайте аккаунт, чтобы отслеживать заявки</p>
        </div>

        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mb-6">
            <div>
              <Label className="mb-2 block">Ваше имя *</Label>
              <Input {...register('name')} placeholder="Как к вам обращаться?" />
              {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name.message}</p>}
            </div>

            <div>
              <Label className="mb-2 block">Email *</Label>
              <Input {...register('email')} type="email" placeholder="your@email.ru" />
              {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <Label className="mb-2 block">Пароль *</Label>
              <div className="relative">
                <Input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Минимум 6 символов"
                  className="pr-10"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password.message}</p>}
            </div>

            <div>
              <Label className="mb-2 block">Подтвердите пароль *</Label>
              <div className="relative">
                <Input
                  {...register('confirmPassword')}
                  type={showConfirm ? 'text' : 'password'}
                  placeholder="Повторите пароль"
                  className="pr-10"
                />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70">
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.confirmPassword && <p className="text-red-400 text-xs mt-1">{errors.confirmPassword.message}</p>}
            </div>

            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="consent"
                {...register('consent')}
                className="mt-0.5 w-4 h-4 rounded border-white/20 bg-white/5 accent-[#6C3EF4] cursor-pointer"
              />
              <label htmlFor="consent" className="text-white/50 text-sm cursor-pointer">
                Я принимаю{' '}
                <Link href="/offer" className="text-[#6C3EF4] hover:underline">Условия использования</Link>
                {' '}и{' '}
                <Link href="/privacy" className="text-[#6C3EF4] hover:underline">Политику конфиденциальности</Link>
              </label>
            </div>
            {errors.consent && <p className="text-red-400 text-xs">{errors.consent.message}</p>}

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            <Button type="submit" disabled={loading} className="w-full gap-2" size="lg">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Создать аккаунт
            </Button>
          </form>

          {/* OAuth */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-[#1A1A2E] px-3 text-white/40">или войти через</span>
            </div>
          </div>

          <div className="space-y-3">
            <button onClick={() => handleOAuth('vk')} disabled={!!oauthLoading}
              className="w-full flex items-center justify-center gap-3 h-11 rounded-xl bg-[#0077FF] hover:bg-[#0066DD] text-white font-medium text-sm transition-all disabled:opacity-50">
              {oauthLoading === 'vk' ? <Loader2 className="w-4 h-4 animate-spin" /> : <VKIcon />}
              Войти через ВКонтакте
            </button>
            <button onClick={() => handleOAuth('mailru')} disabled={!!oauthLoading}
              className="w-full flex items-center justify-center gap-3 h-11 rounded-xl bg-[#005FF9] hover:bg-[#0050D0] text-white font-medium text-sm transition-all disabled:opacity-50">
              {oauthLoading === 'mailru' ? <Loader2 className="w-4 h-4 animate-spin" /> : <MailRuIcon />}
              Войти через Mail.ru
            </button>
            <button onClick={() => handleOAuth('yandex')} disabled={!!oauthLoading}
              className="w-full flex items-center justify-center gap-3 h-11 rounded-xl bg-[#FC3F1D] hover:bg-[#E03518] text-white font-medium text-sm transition-all disabled:opacity-50">
              {oauthLoading === 'yandex' ? <Loader2 className="w-4 h-4 animate-spin" /> : <YandexIcon />}
              Войти через Яндекс
            </button>
          </div>

          <p className="text-center text-white/50 text-sm mt-6">
            Уже есть аккаунт?{' '}
            <Link href="/auth/login" className="text-[#6C3EF4] hover:text-[#8B5CF6] transition-colors">
              Войти
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}
