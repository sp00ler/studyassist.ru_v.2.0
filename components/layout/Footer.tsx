import Link from 'next/link'
import { SocialContacts } from '@/components/layout/SocialContacts'

export function Footer() {
  return (
    <footer className="bg-paper border-t-2 border-chrome-shadow">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-12 pt-[64px] pb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-[2fr_1fr_1fr_1fr] gap-8 md:gap-12 mb-12">
          {/* Brand */}
          <div>
            <Link href="/" className="font-sans font-bold text-[17px] text-ink hover:text-title transition-colors">
              Study<span className="text-title">Assist</span>
            </Link>
            <p className="text-[13px] text-ink-soft leading-[1.75] mt-4 max-w-[260px]">
              Курсовые, дипломы, рефераты — консультации и помощь в подготовке. Быстро, по делу, конфиденциально.
            </p>
          </div>

          {/* Services */}
          <div>
            <div className="font-mono text-[11px] font-bold uppercase tracking-[1.5px] text-ink-soft mb-4">
              Услуги
            </div>
            <ul className="space-y-2.5">
              {[
                { href: '/kursovaya', label: 'Курсовые работы' },
                { href: '/diplom', label: 'Дипломы (ВКР)' },
                { href: '/referat', label: 'Рефераты и эссе' },
                { href: '/#services', label: 'Лабораторные' },
                { href: '/#services', label: 'Презентации' },
                { href: '/#services', label: 'Отчёты по практике' },
              ].map((item) => (
                <li key={item.label}>
                  <Link href={item.href} className="text-ink-soft hover:text-title text-[13px] transition-colors">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Navigation */}
          <div>
            <div className="font-mono text-[11px] font-bold uppercase tracking-[1.5px] text-ink-soft mb-4">
              Навигация
            </div>
            <ul className="space-y-2.5">
              {[
                { href: '/#how-it-works', label: 'Как это работает' },
                { href: '/#pricing', label: 'Цены' },
                { href: '/#reviews', label: 'Отзывы' },
                { href: '/#order', label: 'Оставить заявку' },
              ].map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="text-ink-soft hover:text-title text-[13px] transition-colors">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal & Contacts */}
          <div>
            <div className="font-mono text-[11px] font-bold uppercase tracking-[1.5px] text-ink-soft mb-4">
              Контакты
            </div>

            {/* Social messenger icons */}
            <div className="mb-4">
              <SocialContacts size="sm" />
            </div>

            <ul className="space-y-2.5">
              <li>
                <a href="mailto:support@studyassist.ru" className="text-ink-soft hover:text-title text-[13px] transition-colors">
                  support@studyassist.ru
                </a>
              </li>
              {[
                { href: '/privacy', label: 'Политика конфиденциальности' },
                { href: '/consent', label: 'Обработка персональных данных' },
                { href: '/refund', label: 'Правила возврата' },
                { href: '/offer', label: 'Публичная оферта' },
                { href: '/cookies', label: 'Политика cookie' },
                { href: '/contacts', label: 'Контакты' },
              ].map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="text-ink-soft hover:text-title text-[13px] transition-colors">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Taskbar-style bottom bar */}
        <div className="bevel-out bg-chrome px-4 py-2.5 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-[12px] font-sans text-ink">© <span className="font-mono">{new Date().getFullYear()}</span> StudyAssist. Образовательные консультации.</p>
          <p className="text-[12px] font-sans text-ink">Режим работы: <span className="font-mono">9:00 – 23:00</span> МСК</p>
        </div>
      </div>
    </footer>
  )
}
