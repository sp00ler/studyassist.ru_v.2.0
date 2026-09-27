import Link from 'next/link'

const STATUS_ROWS = [
  { label: 'Время ответа', value: '≤ 30 мин' },
  { label: 'Часы работы', value: '09:00–23:00' },
  { label: 'Довольных клиентов', value: '98%' },
]

export function HeroSection() {
  return (
    <section className="relative bg-desk dither border-b-2 border-chrome-shadow overflow-hidden">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-12 pt-8 sm:pt-16 md:pt-20 pb-16 md:pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-10 lg:gap-16 items-start">
          {/* Left: headline */}
          <div>
            <span className="inline-flex items-center gap-2 btn-95 px-3 py-1 sm:py-1.5 text-[12px] font-mono font-semibold mb-4 sm:mb-7">
              <span className="w-1.5 h-1.5 bg-success" aria-hidden="true" />
              Более 1000 студентов уже сдали
            </span>

            <h1
              className="font-display font-semibold text-paper leading-[1.15] mb-3 sm:mb-6 max-w-[16ch]"
              style={{ fontSize: 'clamp(36px, 5.5vw, 64px)' }}
            >
              <span className="block">Дедлайн завтра?</span>
              <span className="block">Мы уже за компьютером.</span>
              <span
                className="block font-sans font-normal mt-2 sm:mt-3 max-w-[46ch]"
                style={{ fontSize: 'clamp(16px, 2.2vw, 26px)', lineHeight: 1.4 }}
              >
                Курсовая, диплом, реферат{' '}— разберёмся и подготовим работу вместе.
              </span>
            </h1>

            <p className="text-[17px] sm:text-[18px] text-paper leading-[1.55] max-w-[52ch] mb-4 sm:mb-9">
              Профильный специалист, ответ за 30 минут, консультация по задаче любой сложности.
            </p>

            <div className="flex flex-wrap gap-3">
              <Link
                href="#order"
                className="btn-95-primary min-h-[44px] px-8 text-[14px] font-bold inline-flex items-center"
              >
                Оставить заявку
              </Link>
              <Link href="#how-it-works" className="btn-95 min-h-[44px] px-8 text-[14px] font-semibold inline-flex items-center">
                Как это работает
              </Link>
            </div>
          </div>

          {/* Right: СТАТУС.EXE window card */}
          <div className="window w-full lg:sticky lg:top-24">
            <div className="titlebar">
              <span className="truncate">СТАТУС.EXE</span>
              <div className="flex gap-1 shrink-0">
                <span className="titlebar-btn" aria-hidden="true">
                  _
                </span>
                <span className="titlebar-btn" aria-hidden="true">
                  □
                </span>
                <span className="titlebar-btn" aria-hidden="true">
                  ×
                </span>
              </div>
            </div>
            <div className="p-5 sm:p-6 flex flex-col gap-3">
              {STATUS_ROWS.map((row) => (
                <div key={row.label} className="flex items-center justify-between bevel-in bg-paper px-3 py-2.5">
                  <span className="text-[12px] text-ink-soft">{row.label}</span>
                  <span className="font-mono text-[15px] font-bold text-title">{row.value}</span>
                </div>
              ))}
              <Link
                href="#order"
                className="btn-95-primary min-h-[44px] px-4 text-[13px] font-bold inline-flex items-center justify-center mt-1"
              >
                Написать сейчас →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
