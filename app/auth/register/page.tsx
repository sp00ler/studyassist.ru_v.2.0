'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AuthWindow } from '../_components/AuthWindow'

const registerSchema = z.object({
  name: z.string().min(2, 'Имя должно содержать минимум 2 символа'),
  email: z.string().email('Некорректный email'),
  password: z.string().min(6, 'Пароль должен содержать минимум 6 символов'),
  confirmPassword: z.string(),
  consentOffer: z.boolean().refine((v) => v === true, 'Необходимо принять условия использования'),
  consentPd: z.boolean().refine((v) => v === true, 'Необходимо дать согласие на обработку персональных данных'),
  consentMarketing: z.boolean().optional(),
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
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          password: data.password,
          consentMarketing: data.consentMarketing ?? false,
        }),
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
    <AuthWindow title="Регистрация" backLabel="На главную">
      <p className="text-ink-soft text-sm mb-6">Создайте аккаунт, чтобы отслеживать заявки</p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mb-6">
        <div>
          <Label className="mb-2 block">Ваше имя *</Label>
          <Input {...register('name')} placeholder="Как к вам обращаться?" />
          {errors.name && <p className="text-danger text-xs mt-1">{errors.name.message}</p>}
        </div>

        <div>
          <Label className="mb-2 block">Email *</Label>
          <Input {...register('email')} type="email" placeholder="your@email.ru" />
          {errors.email && <p className="text-danger text-xs mt-1">{errors.email.message}</p>}
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
              className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-soft hover:text-ink">
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.password && <p className="text-danger text-xs mt-1">{errors.password.message}</p>}
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
              className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-soft hover:text-ink">
              {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.confirmPassword && <p className="text-danger text-xs mt-1">{errors.confirmPassword.message}</p>}
        </div>

        {/* Чекбокс 1: принятие оферты */}
        <div className="flex items-start gap-3">
          <input
            type="checkbox"
            id="consentOffer"
            {...register('consentOffer')}
            className="mt-0.5 w-4 h-4 field-95 accent-title cursor-pointer flex-shrink-0"
          />
          <label htmlFor="consentOffer" className="text-ink-soft text-sm cursor-pointer">
            Я ознакомился(ась) с{' '}
            <Link href="/offer" className="text-title hover:text-title-alt hover:underline">Публичной офертой</Link>
            {' '}и принимаю её условия *
          </label>
        </div>
        {errors.consentOffer && <p className="text-danger text-xs -mt-2">{errors.consentOffer.message}</p>}

        {/* Чекбокс 2: согласие на обработку ПД */}
        <div className="flex items-start gap-3">
          <input
            type="checkbox"
            id="consentPd"
            {...register('consentPd')}
            className="mt-0.5 w-4 h-4 field-95 accent-title cursor-pointer flex-shrink-0"
          />
          <label htmlFor="consentPd" className="text-ink-soft text-sm cursor-pointer">
            Я даю согласие на обработку моих персональных данных (ФИО, email, телефон) в целях
            регистрации аккаунта и исполнения заказов в соответствии с{' '}
            <Link href="/privacy" className="text-title hover:text-title-alt hover:underline">Политикой конфиденциальности</Link>.
            Согласие можно отозвать, написав на{' '}
            <a href="mailto:support@studyassist.ru" className="text-title hover:text-title-alt hover:underline">support@studyassist.ru</a> *
          </label>
        </div>
        {errors.consentPd && <p className="text-danger text-xs -mt-2">{errors.consentPd.message}</p>}

        {/* Чекбокс 3: маркетинговые рассылки (необязательный) */}
        <div className="flex items-start gap-3">
          <input
            type="checkbox"
            id="consentMarketing"
            {...register('consentMarketing')}
            className="mt-0.5 w-4 h-4 field-95 accent-title cursor-pointer flex-shrink-0"
          />
          <label htmlFor="consentMarketing" className="text-ink-soft text-sm cursor-pointer">
            Я согласен(а) получать рекламные рассылки: акции, скидки, новые услуги.
            Можно отписаться в любой момент.
          </label>
        </div>

        {error && (
          <div className="bg-danger/10 border border-danger px-4 py-3">
            <p className="text-danger text-sm">{error}</p>
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
          <div className="w-full border-t border-chrome-dark" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="bg-paper px-3 text-ink-soft">или войти через</span>
        </div>
      </div>

      <div className="space-y-3">
        <button onClick={() => handleOAuth('vk')} disabled={!!oauthLoading}
          style={{ backgroundColor: '#0077FF' }}
          className="btn-95 w-full flex items-center justify-center gap-3 h-11 text-white font-display text-[11px] disabled:opacity-50">
          {oauthLoading === 'vk' ? <Loader2 className="w-4 h-4 animate-spin" /> : <VKIcon />}
          Войти через ВКонтакте
        </button>
        <button onClick={() => handleOAuth('mailru')} disabled={!!oauthLoading}
          style={{ backgroundColor: '#005FF9' }}
          className="btn-95 w-full flex items-center justify-center gap-3 h-11 text-white font-display text-[11px] disabled:opacity-50">
          {oauthLoading === 'mailru' ? <Loader2 className="w-4 h-4 animate-spin" /> : <MailRuIcon />}
          Войти через Mail.ru
        </button>
        <button onClick={() => handleOAuth('yandex')} disabled={!!oauthLoading}
          style={{ backgroundColor: '#FC3F1D' }}
          className="btn-95 w-full flex items-center justify-center gap-3 h-11 text-white font-display text-[11px] disabled:opacity-50">
          {oauthLoading === 'yandex' ? <Loader2 className="w-4 h-4 animate-spin" /> : <YandexIcon />}
          Войти через Яндекс
        </button>
      </div>

      <p className="text-center text-ink-soft text-sm mt-6">
        Уже есть аккаунт?{' '}
        <Link href="/auth/login" className="text-title hover:text-title-alt transition-colors font-medium">
          Войти
        </Link>
      </p>
    </AuthWindow>
  )
}
