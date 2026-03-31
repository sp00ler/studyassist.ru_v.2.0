'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { X } from 'lucide-react'

type CookieConsent = 'all' | 'necessary' | null

const STORAGE_KEY = 'sa_cookie_consent'
const STORAGE_VERSION = '1'

export function getCookieConsent(): CookieConsent {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (parsed.version !== STORAGE_VERSION) return null
    return parsed.value as CookieConsent
  } catch {
    return null
  }
}

function saveCookieConsent(value: 'all' | 'necessary') {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ value, version: STORAGE_VERSION, ts: Date.now() }))
  // Сообщаем остальным компонентам
  window.dispatchEvent(new CustomEvent('cookieConsentChanged', { detail: value }))
}

export function CookieBanner() {
  const [visible, setVisible] = useState(false)
  const [showDetails, setShowDetails] = useState(false)

  useEffect(() => {
    if (getCookieConsent() === null) {
      // Небольшая задержка чтобы не мешать LCP
      const t = setTimeout(() => setVisible(true), 800)
      return () => clearTimeout(t)
    }
  }, [])

  if (!visible) return null

  const accept = (value: 'all' | 'necessary') => {
    saveCookieConsent(value)
    setVisible(false)
  }

  return (
    <div
      role="dialog"
      aria-label="Уведомление об использовании cookie"
      className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:bottom-6 md:max-w-md z-50 bg-[#1A1A2E] border border-white/10 rounded-2xl shadow-2xl p-5"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <p className="text-white font-semibold text-sm">🍪 Мы используем cookie</p>
        <button
          onClick={() => accept('necessary')}
          aria-label="Закрыть (принять только необходимые)"
          className="text-white/30 hover:text-white/70 flex-shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <p className="text-white/60 text-xs leading-relaxed mb-3">
        Для работы сайта используются технические cookie. С вашего согласия также подключается{' '}
        <strong className="text-white/80">Яндекс.Метрика</strong> (включая Вебвизор) для анализа поведения
        пользователей. Данные аналитики не передаются третьим лицам.
      </p>

      {showDetails && (
        <div className="text-xs text-white/50 bg-white/5 rounded-xl p-3 mb-3 space-y-1.5">
          <p><span className="text-white/70 font-medium">Необходимые cookie:</span> сессия, авторизация, защита от CSRF. Срок — до закрытия браузера / 30 дней.</p>
          <p><span className="text-white/70 font-medium">Аналитика (Яндекс.Метрика):</span> переходы, клики, Вебвизор. Срок cookie — 1 год. Можно отключить в настройках браузера или через <a href="https://yandex.ru/support/metrika/general/opt-out.html" target="_blank" rel="noopener noreferrer" className="text-[#6C3EF4] hover:underline">Яндекс.Оптаут</a>.</p>
          <p>
            Подробнее —{' '}
            <Link href="/cookies" className="text-[#6C3EF4] hover:underline">Политика использования cookie</Link>
          </p>
        </div>
      )}

      <button
        onClick={() => setShowDetails(!showDetails)}
        className="text-white/40 hover:text-white/60 text-xs mb-3 underline"
      >
        {showDetails ? 'Скрыть подробности' : 'Подробнее о cookie'}
      </button>

      <div className="flex gap-2">
        <button
          onClick={() => accept('all')}
          className="flex-1 bg-gradient-to-r from-[#6C3EF4] to-[#3B82F6] text-white text-xs font-semibold py-2.5 px-4 rounded-xl hover:opacity-90 transition-opacity"
        >
          Принять все
        </button>
        <button
          onClick={() => accept('necessary')}
          className="flex-1 bg-white/5 border border-white/10 text-white/70 text-xs font-semibold py-2.5 px-4 rounded-xl hover:bg-white/10 transition-colors"
        >
          Только необходимые
        </button>
      </div>
    </div>
  )
}
