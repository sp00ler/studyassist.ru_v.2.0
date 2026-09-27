'use client'

import { useRef } from 'react'
import { ArrowLeft, ArrowRight, RotateCw, Home, Globe } from 'lucide-react'

interface BrowserChromeProps {
  onHome: () => void
  children: React.ReactNode
}

const CHROME_BTN =
  'w-8 h-8 flex items-center justify-center bg-[#EDE7D8] text-[#1A1714] chrome-bevel-out hover:bg-white active:translate-y-px transition-colors disabled:opacity-30 disabled:pointer-events-none'

export function BrowserChrome({ onHome, children }: BrowserChromeProps) {
  const contentRef = useRef<HTMLDivElement>(null)

  // ponytail: real in-page history (per-section back/forward) would need a route
  // stack; scrolling one viewport is the honest, simple version of "back/forward"
  // for a single scrolling page. Upgrade to real history if the page ever gains routes.
  const scrollByViewport = (dir: 1 | -1) => {
    contentRef.current?.scrollBy({ top: dir * window.innerHeight * 0.85, behavior: 'smooth' })
  }

  return (
    <div className="fixed inset-0 z-10 flex flex-col bg-[#8f8877] sm:p-3">
      <div className="mx-auto w-full sm:max-w-[1440px] flex-1 flex flex-col bg-[#EDE7D8] chrome-bevel-out overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,.55)]">
        {/* Title bar */}
        <div className="flex items-center justify-between px-3 py-1.5 bg-[#1A1714] text-[#F5F0E3] shrink-0">
          <span className="font-pixel text-[9px] sm:text-[10px] tracking-wide truncate">
            StudyAssist — Netscape Navigator
          </span>
          <div className="flex gap-1.5 shrink-0">
            <span className="w-3 h-3 bg-[#E8A33D] chrome-bevel-out" aria-hidden />
            <span className="w-3 h-3 bg-[#2FAE5B] chrome-bevel-out" aria-hidden />
            <button
              onClick={onHome}
              aria-label="Закрыть окно и вернуться в комнату"
              className="w-3 h-3 bg-[#C0392B] chrome-bevel-out hover:brightness-110"
            />
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-2 px-3 py-2 bg-[#DCD5C2] border-b-2 border-[#1A1714]/70 shrink-0">
          <button onClick={() => scrollByViewport(-1)} aria-label="Назад" className={CHROME_BTN}>
            <ArrowLeft className="w-4 h-4" strokeWidth={2} />
          </button>
          <button onClick={() => scrollByViewport(1)} aria-label="Вперёд" className={CHROME_BTN}>
            <ArrowRight className="w-4 h-4" strokeWidth={2} />
          </button>
          <button onClick={() => window.location.reload()} aria-label="Обновить" className={CHROME_BTN}>
            <RotateCw className="w-4 h-4" strokeWidth={2} />
          </button>
          <button onClick={onHome} aria-label="Домой" className={CHROME_BTN}>
            <Home className="w-4 h-4" strokeWidth={2} />
          </button>
          <div className="flex-1 ml-1 flex items-center gap-2 bg-white chrome-bevel-in rounded-[2px] px-3 py-1.5 text-[11px] sm:text-[12px] text-[#1A1714]/75 font-mono overflow-hidden">
            <Globe className="w-3.5 h-3.5 text-[#2FAE5B] shrink-0" strokeWidth={2} />
            <span className="truncate">https://studyassist.ru</span>
          </div>
        </div>

        {/* Scrollable content — the real site lives here */}
        <div ref={contentRef} className="flex-1 overflow-y-auto overflow-x-hidden bg-[#17130F]">
          {children}
        </div>
      </div>
    </div>
  )
}
