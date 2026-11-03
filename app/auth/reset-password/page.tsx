'use client'

import { useState, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import { Loader2, Eye, EyeOff, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AuthWindow } from '../_components/AuthWindow'

function ResetPasswordPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get('token') || ''

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirmPassword) {
      setError('Пароли не совпадают')
      return
    }
    if (password.length < 6) {
      setError('Пароль должен содержать минимум 6 символов')
      return
    }

    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })
      const data = await res.json()
      if (res.ok) {
        setSuccess(true)
        setTimeout(() => router.push('/auth/login?reset=1'), 3000)
      } else {
        setError(data.error || 'Ошибка сброса пароля')
      }
    } catch {
      setError('Ошибка сети. Попробуйте позже.')
    } finally {
      setLoading(false)
    }
  }

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-desk dither px-4">
        <div className="window pixel-shadow p-8 text-center">
          <p className="text-ink-soft mb-4">Недействительная ссылка сброса пароля.</p>
          <Link href="/auth/forgot-password">
            <Button>Запросить новую ссылку</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <AuthWindow title="Новый пароль" backHref="/auth/login" backLabel="Назад">
      <p className="text-ink-soft text-sm mb-6">Придумайте надёжный пароль для входа</p>

      {success ? (
        <div className="text-center py-4">
          <div className="w-16 h-16 bevel-out bg-success/15 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8 text-success" />
          </div>
          <h2 className="font-display text-lg text-ink mb-3">Пароль изменён!</h2>
          <p className="text-ink-soft text-sm mb-6">
            Сейчас вы будете перенаправлены на страницу входа...
          </p>
          <Link href="/auth/login">
            <Button className="w-full">Войти</Button>
          </Link>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <Label className="mb-2 block">Новый пароль</Label>
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Минимум 6 символов"
                className="pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-soft hover:text-ink transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <Label className="mb-2 block">Подтвердите пароль</Label>
            <div className="relative">
              <Input
                type={showConfirm ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Повторите пароль"
                className="pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-soft hover:text-ink transition-colors"
              >
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-danger/10 border border-danger px-4 py-3">
              <p className="text-danger text-sm">{error}</p>
            </div>
          )}

          <Button type="submit" disabled={loading} className="w-full" size="lg">
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Сохранить пароль
          </Button>
        </form>
      )}
    </AuthWindow>
  )
}

export default function ResetPasswordPageWrapper() {
  return (
    <Suspense>
      <ResetPasswordPage />
    </Suspense>
  )
}
