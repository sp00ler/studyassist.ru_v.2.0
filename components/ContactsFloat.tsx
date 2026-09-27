'use client'

import { useState } from 'react'
import { Contact, X } from 'lucide-react'
import { SocialContacts } from '@/components/layout/SocialContacts'

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
        aria-label={open ? 'Закрыть контакты' : 'Показать способы связи'}
        aria-expanded={open}
        className="btn-95 pixel-shadow h-12 pl-3 pr-4 inline-flex items-center gap-2 whitespace-nowrap font-bold"
      >
        {open ? <X className="w-5 h-5 flex-shrink-0" aria-hidden="true" /> : <Contact className="w-5 h-5 flex-shrink-0" aria-hidden="true" />}
        <span className="font-sans text-[13px]">{open ? 'Закрыть' : 'Контакты'}</span>
      </button>
    </div>
  )
}
