'use client'

import { useState } from 'react'

interface Contact {
  name: string
  href: string
  brandColor: string
  brandGlow: string
  icon: React.FC<{ size?: number }>
}

function WhatsAppIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  )
}

function TelegramIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
    </svg>
  )
}

function MaxIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm-.5 5h1.25l2.5 4 2.5-4H19l-3.5 5.5L19 18h-1.75l-2.5-4-2.5 4H10.5l3.5-5.5L10.5 7zM5 7h2l2 6 2-6h2l-3 11H8.5L7 12.5 5.5 18H4L5 7z" />
    </svg>
  )
}

function VKIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M15.684 0H8.316C1.592 0 0 1.592 0 8.316v7.368C0 22.408 1.592 24 8.316 24h7.368C22.408 24 24 22.408 24 15.684V8.316C24 1.592 22.391 0 15.684 0zm3.692 17.123h-1.744c-.66 0-.864-.525-2.05-1.727-1.033-1-1.49-.9-1.49.57v1.561c0 .396-.126.633-1.178.633-1.713 0-3.618-.882-4.95-2.526-2.01-2.508-2.56-4.385-2.56-4.769 0-.208.077-.395.407-.395h1.744c.302 0 .418.14.535.468.588 1.694 1.562 3.183 1.967 3.183.151 0 .22-.07.22-.453V11.03c-.046-.814-.476-.883-.476-1.172 0-.14.116-.28.302-.28h2.745c.256 0 .348.14.348.443v3.146c0 .256.116.348.186.348.151 0 .279-.092.558-.37 1.73-1.936 2.955-4.92 2.955-4.92.07-.162.21-.313.523-.313h1.744c.524 0 .636.27.524.64-.22.98-2.35 4.027-2.35 4.027-.186.302-.256.44 0 .778.186.256 1.003.976 1.517 1.57.942 1.07 1.67 1.97 1.867 2.59.209.604-.093.91-.7.91z" />
    </svg>
  )
}

function EmailIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
    </svg>
  )
}

const CONTACTS: Contact[] = [
  {
    name: 'WhatsApp',
    href: 'https://wa.me/79539246817',
    brandColor: '#25D366',
    brandGlow: 'rgba(37,211,102,0.35)',
    icon: WhatsAppIcon,
  },
  {
    name: 'Telegram',
    href: 'https://t.me/studyAssist_support',
    brandColor: '#2AABEE',
    brandGlow: 'rgba(42,171,238,0.35)',
    icon: TelegramIcon,
  },
  {
    name: 'MAX',
    href: 'https://max.ru/+79539246817',
    brandColor: '#5B4FE9',
    brandGlow: 'rgba(91,79,233,0.35)',
    icon: MaxIcon,
  },
  {
    name: 'ВКонтакте',
    href: 'https://vk.ru/supp0rt_studyassist',
    brandColor: '#0077FF',
    brandGlow: 'rgba(0,119,255,0.35)',
    icon: VKIcon,
  },
  {
    name: 'Email',
    href: 'mailto:support@studyassist.ru',
    brandColor: '#EA4335',
    brandGlow: 'rgba(234,67,53,0.35)',
    icon: EmailIcon,
  },
]

interface SocialContactsProps {
  size?: 'sm' | 'md'
  label?: boolean
}

export function SocialContacts({ size = 'md', label = false }: SocialContactsProps) {
  const [hovered, setHovered] = useState<string | null>(null)
  const iconSize = size === 'sm' ? 16 : 20
  const btnSize = size === 'sm' ? 'w-8 h-8' : 'w-10 h-10'

  return (
    <div className="flex items-center gap-2" role="list" aria-label="Контакты">
      {CONTACTS.map((c) => {
        const isHovered = hovered === c.name
        return (
          <div key={c.name} className="relative group" role="listitem">
            <a
              href={c.href}
              target={c.href.startsWith('mailto') ? undefined : '_blank'}
              rel="noopener noreferrer"
              aria-label={`Написать в ${c.name}`}
              onMouseEnter={() => setHovered(c.name)}
              onMouseLeave={() => setHovered(null)}
              onFocus={() => setHovered(c.name)}
              onBlur={() => setHovered(null)}
              className={`
                flex items-center justify-center rounded-xl border transition-all duration-200
                ${btnSize}
                ${isHovered
                  ? 'border-current bg-current/10 scale-110'
                  : 'border-white/10 bg-white/5 hover:border-white/20'
                }
              `}
              style={{
                color: isHovered ? c.brandColor : '#C5FF45',
                boxShadow: isHovered ? `0 0 16px ${c.brandGlow}` : 'none',
              }}
            >
              <c.icon size={iconSize} />
            </a>

            {/* Tooltip */}
            <div
              className={`
                absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1
                rounded-md text-[10px] font-semibold whitespace-nowrap pointer-events-none
                transition-all duration-150 bg-[#1A1A2E] border border-white/10 text-white/80
                ${isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1'}
              `}
            >
              {c.name}
            </div>
          </div>
        )
      })}

      {label && (
        <span className="text-[12px] text-[#6A6A88] ml-1">Написать нам</span>
      )}
    </div>
  )
}
