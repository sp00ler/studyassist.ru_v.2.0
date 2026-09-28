'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Loader2, CheckCircle, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AuthWindow } from '../_components/AuthWindow'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [errorCode, setErrorCode] = useState<string | null>(null)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return
    setLoading(true)
    setError('')
    setErrorCode(null)
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      if (res.ok) {
        setSent(true)
      } else {
        const data = await res.json()
        setError(data.error || 'Ошибка отправки письма')
        setErrorCode(data.code || null)
      }
    } catch {
      setError('Ошибка сети. Попробуйте позже.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthWindow title="Восстановление пароля" backHref="/auth/login" backLabel="Назад">
      <p className="text-ink-soft text-sm mb-6">
        Введите email, и мы пришлём ссылку для сброса пароля
      </p>

      {sent ? (
        <div className="text-center py-4">
          <div className="w-16 h-16 bevel-out bg-success/15 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8 text-success" />
          </div>
          <h2 className="font-display text-lg text-ink mb-3">Письмо отправлено!</h2>
          <p className="text-ink-soft text-sm mb-2">
            Письмо со ссылкой отправлено на <span className="text-ink font-medium">{email}</span>.
            Проверьте «Входящие» и «Спам».
          </p>
          <p className="text-ink-soft text-xs mb-8">
            Ссылка действительна 1 час.
          </p>
          <Link href="/auth/login">
            <Button variant="outline" className="w-full">
              Вернуться к входу
            </Button>
          </Link>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <Label className="mb-2 block">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-soft" />
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.ru"
                className="pl-10"
                required
              />
            </div>
          </div>

          {error && (
            <div className="bg-danger/10 border border-danger px-4 py-3" role="alert">
              <p className="text-danger text-sm">{error}</p>
              {errorCode === 'NOT_FOUND' && (
                <p className="text-sm mt-2">
                  <Link href="/auth/register" className="text-title hover:text-title-alt transition-colors font-medium">
                    Зарегистрироваться
                  </Link>
                </p>
              )}
              {errorCode === 'OAUTH_ONLY' && (
                <p className="text-sm mt-2">
                  <Link href="/auth/login" className="text-title hover:text-title-alt transition-colors font-medium">
                    Перейти на страницу входа
                  </Link>
                </p>
              )}
            </div>
          )}

          <Button type="submit" disabled={loading} className="w-full" size="lg">
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Отправить письмо
          </Button>

          <p className="text-center text-ink-soft text-sm">
            Вспомнили пароль?{' '}
            <Link href="/auth/login" className="text-title hover:text-title-alt transition-colors font-medium">
              Войти
            </Link>
          </p>
        </form>
      )}
    </AuthWindow>
  )
}
