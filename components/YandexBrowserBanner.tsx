'use client'

import { useEffect, useState } from 'react'
import { X } from 'lucide-react'

// Основной CLID для баннера (из письма Яндекс Дистрибуции)
const CLID = '14606102'
const DOWNLOAD_URL = `https://browser.yandex.ru/download/?clid=${CLID}`
const STORAGE_KEY = 'yb_banner_v1'

export function YandexBrowserBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // Уже закрыл ранее — не показываем
    if (localStorage.getItem(STORAGE_KEY)) return

    // Уже использует Яндекс Браузер — не показываем
    if (/YaBrowser/i.test(navigator.userAgent)) return

    // Показываем через 4 секунды чтобы не мешать загрузке
    const t = setTimeout(() => setVisible(true), 4000)
    return () => clearTimeout(t)
  }, [])

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, '1')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div
      role="banner"
      aria-label="Реклама Яндекс Браузера"
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between gap-3 px-4 py-2.5
        bg-gradient-to-r from-[#FF6600] to-[#FFCC00] text-[#1A1A1A] shadow-lg
        text-sm font-medium"
    >
      <div className="flex items-center gap-2 flex-1 min-w-0">
        {/* Логотип Яндекс Браузера */}
        <svg
          viewBox="0 0 24 24"
          className="w-5 h-5 flex-shrink-0"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm0 2c4.418 0 8 3.582 8 8s-3.582 8-8 8-8-3.582-8-8 3.582-8 8-8zm-1 3v2H9v2h2v6h2V9h2V7h-2V5h-2z" />
        </svg>
        <span className="truncate">
          Попробуйте <strong>Яндекс Браузер</strong> — быстрый и безопасный браузер для учёбы
        </span>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        <a
          href={DOWNLOAD_URL}
          target="_blank"
          rel="noopener noreferrer"
          onClick={dismiss}
          className="whitespace-nowrap bg-[#1A1A1A] text-white text-xs font-semibold
            px-3 py-1.5 rounded-full hover:bg-[#333] transition-colors"
        >
          Скачать
        </a>
        <button
          onClick={dismiss}
          aria-label="Закрыть"
          className="hover:opacity-60 transition-opacity"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
