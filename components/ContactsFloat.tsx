'use client'

import { useState } from 'react'
import { SocialContacts } from '@/components/layout/SocialContacts'

function MessageCircleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  )
}

function XIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

export function ContactsFloat() {
  const [open, setOpen] = useState(false)

  return (
    <div className="fixed bottom-6 left-6 z-40 flex flex-col items-start gap-3">
      {/* Expanded icons panel */}
      <div
        className={`
          origin-bottom-left
          ${open
            ? 'opacity-100 scale-100 pointer-events-auto'
            : 'opacity-0 scale-95 pointer-events-none'
          }
        `}
      >
        <div className="window pixel-shadow p-0 overflow-hidden">
          <div className="titlebar">
            <span>Контакты</span>
          </div>
          <div className="p-3">
            <p className="text-[10px] font-bold uppercase tracking-[1.2px] text-ink-soft mb-3 px-1">
              Связаться с нами
            </p>
            <div className="flex flex-col gap-2">
              <SocialContacts size="md" />
            </div>
            <p className="text-[10px] text-ink-soft/70 mt-3 px-1 max-w-[180px] leading-snug">
              Наведите на иконку — и увидите название
            </p>
          </div>
        </div>
      </div>

      {/* Toggle button */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? 'Закрыть контакты' : 'Написать нам'}
        aria-expanded={open}
        className={`pixel-shadow w-12 h-12 flex items-center justify-center font-bold ${
          open ? 'btn-95' : 'btn-95-primary'
        }`}
      >
        {open ? <XIcon /> : <MessageCircleIcon />}
      </button>
    </div>
  )
}
