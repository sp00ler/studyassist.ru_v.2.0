'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { GraduationCap, Mail, ArrowLeft, Loader2, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function VerifyEmailPage() {
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
    <div className="min-h-screen flex items-center justify-center bg-[#0F0F1A] relative overflow-hidden px-4">
      <Link
        href="/"
        className="absolute top-6 left-6 flex items-center gap-2 text-white/50 hover:text-white transition-colors text-sm"
      >
        <ArrowLeft className="w-4 h-4" />
        На главную
      </Link>

      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#6C3EF4] rounded-full blur-[128px] opacity-10" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-[#3B82F6] rounded-full blur-[128px] opacity-10" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#6C3EF4] to-[#3B82F6] flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-[#6C3EF4] to-[#3B82F6] bg-clip-text text-transparent">
              StudyAssist
            </span>
          </Link>
        </div>

        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#6C3EF4]/20 to-[#3B82F6]/20 border border-[#6C3EF4]/30 flex items-center justify-center mx-auto mb-6">
            <Mail className="w-8 h-8 text-[#6C3EF4]" />
          </div>

          <h1 className="text-2xl font-bold text-white mb-3">Подтвердите email</h1>
          <p className="text-white/50 text-sm mb-2">
            Мы отправили письмо с ссылкой для подтверждения на
          </p>
          {email && (
            <p className="text-[#6C3EF4] font-medium text-sm mb-6">{email}</p>
          )}
          <p className="text-white/40 text-xs mb-8">
            Проверьте папку «Спам», если письмо не пришло в течение нескольких минут.
          </p>

          {sent ? (
            <div className="flex items-center justify-center gap-2 text-emerald-400 mb-6">
              <CheckCircle className="w-5 h-5" />
              <span className="text-sm">Письмо отправлено повторно!</span>
            </div>
          ) : (
            <>
              {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 mb-4">
                  <p className="text-red-400 text-sm">{error}</p>
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

          <Link href="/auth/login" className="text-white/40 hover:text-white/70 text-sm transition-colors">
            ← Вернуться к входу
          </Link>
        </div>
      </motion.div>
    </div>
  )
}
