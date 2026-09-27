'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { X, Cookie } from 'lucide-react'

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
      className="window pixel-shadow fixed bottom-0 left-0 right-0 sm:bottom-6 sm:left-auto sm:right-6 sm:max-w-md z-50 p-0"
    >
      <div className="titlebar">
        <span className="flex items-center gap-1.5 truncate">
          <Cookie className="w-3.5 h-3.5 flex-shrink-0" strokeWidth={2} />
          COOKIES.SYS
        </span>
        <button
          onClick={() => accept('necessary')}
          aria-label="Закрыть (принять только необходимые)"
          className="titlebar-btn"
        >
          <X className="w-3 h-3" />
        </button>
      </div>

      <div className="p-3 sm:p-4">
        <p className="text-ink-soft text-xs leading-snug sm:leading-relaxed mb-2 sm:mb-3">
          Для работы сайта используются технические cookie. С вашего согласия также подключается{' '}
          <strong className="text-ink">Яндекс.Метрика</strong> (включая Вебвизор) для анализа поведения
          пользователей. Данные аналитики не передаются третьим лицам.
        </p>

        {showDetails && (
          <div className="field-95 text-xs text-ink-soft p-3 mb-3 space-y-1.5">
            <p><span className="text-ink font-medium">Необходимые cookie:</span> сессия, авторизация, защита от CSRF. Срок — до закрытия браузера / 30 дней.</p>
            <p><span className="text-ink font-medium">Аналитика (Яндекс.Метрика):</span> переходы, клики, Вебвизор. Срок cookie — 1 год. Можно отключить в настройках браузера или через <a href="https://yandex.ru/support/metrika/general/opt-out.html" target="_blank" rel="noopener noreferrer" className="text-title underline hover:no-underline">Яндекс.Оптаут</a>.</p>
            <p>
              Подробнее —{' '}
              <Link href="/cookies" className="text-title underline hover:no-underline">Политика использования cookie</Link>
            </p>
          </div>
        )}

        <button
          onClick={() => setShowDetails(!showDetails)}
          className="text-title hover:underline text-xs mb-2 sm:mb-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-dotted focus-visible:outline-offset-2 focus-visible:outline-ink"
        >
          {showDetails ? 'Скрыть подробности' : 'Подробнее о cookie'}
        </button>

        <div className="flex gap-2">
          <button
            onClick={() => accept('all')}
            className="btn-95-primary flex-1 min-h-[44px] text-xs px-4"
          >
            Принять все
          </button>
          <button
            onClick={() => accept('necessary')}
            className="btn-95 flex-1 min-h-[44px] text-xs px-4"
          >
            Только необходимые
          </button>
        </div>
      </div>
    </div>
  )
}
