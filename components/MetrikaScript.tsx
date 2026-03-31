'use client'

import { useEffect } from 'react'
import { getCookieConsent } from './CookieBanner'

// Загружаем Яндекс.Метрику только после согласия пользователя
export function MetrikaScript({ metrikaId }: { metrikaId: string }) {
  useEffect(() => {
    function initMetrika() {
      if (typeof window === 'undefined') return
      if ((window as Window & { ym?: unknown }).ym) return // уже загружена

      const script = document.createElement('script')
      script.src = 'https://mc.yandex.ru/metrika/tag.js'
      script.async = true
      script.onload = () => {
        const ym = (window as Window & { ym?: Function }).ym
        if (ym) {
          ym(metrikaId, 'init', {
            clickmap: true,
            trackLinks: true,
            accurateTrackBounce: true,
            webvisor: getCookieConsent() === 'all', // Вебвизор — только при полном согласии
          })
        }
      }
      document.head.appendChild(script)
    }

    // Проверяем текущее согласие
    const consent = getCookieConsent()
    if (consent === 'all' || consent === 'necessary') {
      // При 'necessary' — базовая метрика без вебвизора (технически необходимая)
      // При 'all' — полная с вебвизором
      initMetrika()
    }

    // Подписываемся на изменение согласия (если пользователь нажал кнопку прямо сейчас)
    const handler = (e: Event) => {
      const value = (e as CustomEvent).detail
      if (value === 'all' || value === 'necessary') {
        initMetrika()
      }
    }
    window.addEventListener('cookieConsentChanged', handler)
    return () => window.removeEventListener('cookieConsentChanged', handler)
  }, [metrikaId])

  return null
}
