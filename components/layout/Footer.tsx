import Link from 'next/link'

export function Footer() {
  return (
    <footer className="border-t border-white/[.06] bg-[#07070E]">
      <div className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-12 pt-[72px] pb-10">

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-[2fr_1fr_1fr_1fr] gap-8 md:gap-12 mb-12">

          {/* Brand */}
          <div>
            <Link href="/" className="font-unbounded text-[17px] font-black tracking-[-0.3px] text-[#F0F0EC] hover:text-white transition-colors">
              Study<span className="text-[#C5FF45]">Assist</span>
            </Link>
            <p className="text-[13px] text-[#6A6A88] leading-[1.75] mt-4 max-w-[240px]">
              Помогаем студентам справляться с любыми учебными задачами. Быстро, качественно, конфиденциально.
            </p>
          </div>

          {/* Services */}
          <div>
            <div className="font-unbounded text-[10px] font-bold uppercase tracking-[1.5px] text-[#6A6A88] mb-4">
              Услуги
            </div>
            <ul className="space-y-2.5">
              {[
                { href: '/kursovaya', label: 'Курсовые работы' },
                { href: '/diplom',    label: 'Дипломы (ВКР)' },
                { href: '/referat',  label: 'Рефераты и эссе' },
                { href: '/#services', label: 'Лабораторные' },
                { href: '/#services', label: 'Презентации' },
                { href: '/#services', label: 'Отчёты по практике' },
              ].map((item) => (
                <li key={item.label}>
                  <Link href={item.href} className="text-[#6A6A88] hover:text-[#C5FF45] text-[13px] transition-colors">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Navigation */}
          <div>
            <div className="font-unbounded text-[10px] font-bold uppercase tracking-[1.5px] text-[#6A6A88] mb-4">
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
                  <Link href={item.href} className="text-[#6A6A88] hover:text-[#C5FF45] text-[13px] transition-colors">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal & Contacts */}
          <div>
            <div className="font-unbounded text-[10px] font-bold uppercase tracking-[1.5px] text-[#6A6A88] mb-4">
              Контакты
            </div>
            <ul className="space-y-2.5">
              <li>
                <a href="mailto:support@studyassist.ru" className="text-[#6A6A88] hover:text-[#C5FF45] text-[13px] transition-colors">
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
                  <Link href={item.href} className="text-[#6A6A88] hover:text-[#C5FF45] text-[13px] transition-colors">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="pt-6 border-t border-white/[.06] flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-[12px] text-[#6A6A88]">© 2025 StudyAssist. Образовательные консультации.</p>
          <p className="text-[12px] text-[#6A6A88]">Режим работы: 9:00 – 23:00 МСК</p>
        </div>
      </div>
    </footer>
  )
}
