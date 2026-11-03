'use client'

import { useRef } from 'react'
import { ArrowLeft, ArrowRight, RotateCw, Home, Globe } from 'lucide-react'

interface BrowserChromeProps {
  onHome: () => void
  children: React.ReactNode
}

const MENU_ITEMS = ['Файл', 'Правка', 'Вид', 'Избранное', 'Справка']

const TOOLBAR_BTN =
  'btn-95 min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 sm:w-8 sm:h-8 flex items-center justify-center active:translate-y-px transition-colors disabled:opacity-30 disabled:pointer-events-none'

export function BrowserChrome({ onHome, children }: BrowserChromeProps) {
  const contentRef = useRef<HTMLDivElement>(null)

  // ponytail: real in-page history (per-section back/forward) would need a route
  // stack; scrolling one viewport is the honest, simple version of "back/forward"
  // for a single scrolling page. Upgrade to real history if the page ever gains routes.
  const scrollByViewport = (dir: 1 | -1) => {
    contentRef.current?.scrollBy({ top: dir * window.innerHeight * 0.85, behavior: 'smooth' })
  }

  return (
    <div className="fixed inset-0 z-10 flex flex-col bg-desk dither sm:p-3">
      <div className="mx-auto w-full sm:max-w-[1440px] flex-1 flex flex-col window overflow-hidden pixel-shadow">
        {/* Title bar */}
        <div className="titlebar shrink-0">
          <span className="truncate">StudyAssist — Netscape-style</span>
          <div className="flex gap-1 shrink-0">
            <span className="titlebar-btn" aria-hidden="true">
              _
            </span>
            <span className="titlebar-btn" aria-hidden="true">
              □
            </span>
            <button
              onClick={onHome}
              aria-label="Закрыть окно и вернуться в комнату"
              className="titlebar-btn hover:bg-danger hover:text-white"
            >
              ×
            </button>
          </div>
        </div>

        {/* Menu bar — decorative Win95 top menu, not wired to functionality */}
        <div
          className="hidden sm:flex items-center gap-1 px-2 py-1 bg-chrome text-ink text-[12px] font-sans border-b border-chrome-shadow shrink-0"
          aria-hidden="true"
        >
          {MENU_ITEMS.map((item) => (
            <span key={item} className="px-2 py-0.5 hover:bg-title hover:text-white cursor-default">
              {item}
            </span>
          ))}
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-2 px-2 sm:px-3 py-2 bg-chrome border-b border-chrome-shadow shrink-0">
          <button onClick={() => scrollByViewport(-1)} aria-label="Назад" className={TOOLBAR_BTN}>
            <ArrowLeft className="w-4 h-4" strokeWidth={2} />
          </button>
          <button onClick={() => scrollByViewport(1)} aria-label="Вперёд" className={TOOLBAR_BTN}>
            <ArrowRight className="w-4 h-4" strokeWidth={2} />
          </button>
          <button onClick={() => window.location.reload()} aria-label="Обновить" className={TOOLBAR_BTN}>
            <RotateCw className="w-4 h-4" strokeWidth={2} />
          </button>
          <button onClick={onHome} aria-label="Домой" className={TOOLBAR_BTN}>
            <Home className="w-4 h-4" strokeWidth={2} />
          </button>
          <div className="flex-1 ml-1 flex items-center gap-2 field-95 px-3 py-2 sm:py-1.5 text-[12px] sm:text-[13px] text-ink-soft font-mono overflow-hidden">
            <Globe className="w-3.5 h-3.5 text-title shrink-0" strokeWidth={2} />
            <span className="truncate">https://studyassist.ru</span>
          </div>
        </div>

        {/* Scrollable content — the real site lives here */}
        <div ref={contentRef} className="flex-1 overflow-y-auto overflow-x-hidden bg-paper">
          {children}
        </div>
      </div>
    </div>
  )
}
