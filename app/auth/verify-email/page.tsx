'use client'

import { useState, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Mail, Loader2, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AuthWindow } from '../_components/AuthWindow'

function VerifyEmailPage() {
  const searchParams = useSearchParams()
  const email = searchParams.get('email') || ''
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const resend = async () => {
    if (!email) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      if (res.ok) {
        setSent(true)
      } else {
        setError('Не удалось отправить письмо. Попробуйте позже.')
      }
    } catch {
      setError('Ошибка сети. Попробуйте позже.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthWindow title="Подтверждение email">
      <div className="text-center">
        <div className="w-16 h-16 bevel-out bg-title/10 flex items-center justify-center mx-auto mb-6">
          <Mail className="w-8 h-8 text-title" />
        </div>

        <p className="text-ink-soft text-sm mb-2">
          Мы отправили письмо с ссылкой для подтверждения на
        </p>
        {email && (
          <p className="text-title font-semibold text-sm mb-6">{email}</p>
        )}
        <p className="text-ink-soft text-xs mb-8">
          Проверьте папку «Спам», если письмо не пришло в течение нескольких минут.
        </p>

        {sent ? (
          <div className="flex items-center justify-center gap-2 text-ink mb-6">
            <CheckCircle className="w-5 h-5 text-success" />
            <span className="text-sm">Письмо отправлено повторно!</span>
          </div>
        ) : (
          <>
            {error && (
              <div className="bg-danger/10 border border-danger px-4 py-3 mb-4">
                <p className="text-danger text-sm">{error}</p>
              </div>
            )}
            <Button
              onClick={resend}
              disabled={loading || !email}
              variant="outline"
              className="w-full mb-4"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Отправить письмо повторно
            </Button>
          </>
        )}

        <Link href="/auth/login" className="text-title hover:text-title-alt text-sm transition-colors">
          ← Вернуться к входу
        </Link>
      </div>
    </AuthWindow>
  )
}

export default function VerifyEmailPageWrapper() {
  return (
    <Suspense>
      <VerifyEmailPage />
    </Suspense>
  )
}
