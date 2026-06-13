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
          transition-all duration-250 origin-bottom-left
          ${open
            ? 'opacity-100 scale-100 pointer-events-auto'
            : 'opacity-0 scale-95 pointer-events-none'
          }
        `}
      >
        <div className="bg-[#0E0E1C] border border-white/[.08] rounded-2xl p-3 shadow-[0_8px_32px_rgba(0,0,0,.5)]">
          <p className="text-[10px] font-bold uppercase tracking-[1.2px] text-[#6A6A88] mb-3 px-1">
            Связаться с нами
          </p>
          <div className="flex flex-col gap-2">
            <SocialContacts size="md" />
          </div>
          <p className="text-[10px] text-[#6A6A88]/70 mt-3 px-1 max-w-[180px] leading-snug">
            Наведите на иконку — и увидите название
          </p>
        </div>
      </div>

      {/* Toggle button */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? 'Закрыть контакты' : 'Написать нам'}
        aria-expanded={open}
        className={`
          w-12 h-12 rounded-2xl flex items-center justify-center
          font-bold transition-all duration-200 shadow-lg
          ${open
            ? 'bg-white/10 border border-white/20 text-white/70 hover:bg-white/15'
            : 'bg-[#C5FF45] text-[#07070E] hover:bg-[#D4FF60] hover:shadow-[0_8px_24px_rgba(197,255,69,.3)] hover:-translate-y-0.5'
          }
        `}
      >
        {open ? <XIcon /> : <MessageCircleIcon />}
      </button>
    </div>
  )
}
