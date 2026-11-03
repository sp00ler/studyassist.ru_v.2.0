import type { Metadata } from 'next'
import Link from 'next/link'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { Button } from '@/components/ui/button'
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion'
import { ChevronRight } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Цены на помощь со студенческими работами | StudyAssist',
  description:
    'Цены на помощь с курсовой, дипломом, рефератом, чертежами, решением задач, контрольной, лабораторной и презентацией: от 550 ₽. От чего зависит итоговая стоимость.',
  alternates: { canonical: '/tseny' },
  openGraph: {
    title: 'Цены на помощь со студенческими работами | StudyAssist',
    description:
      'Цены на помощь с курсовой, дипломом, рефератом, чертежами, решением задач, контрольной, лабораторной и презентацией: от 550 ₽. От чего зависит итоговая стоимость.',
    url: 'https://studyassist.ru/tseny',
  },
}

interface PriceRow { name: string; price: string; href?: string }

// Prices mirror the home page pricing block ("от" — final cost is quoted per task).
const rows: PriceRow[] = [
  { name: 'Решение задачи',   price: 'от 550 ₽ за задачу', href: '/reshenie-zadach' },
  { name: 'Контрольная работа', price: 'от 750 ₽', href: '/kontrolnaya' },
  { name: 'Реферат',          price: 'от 1 000 ₽',  href: '/referat' },
  { name: 'Эссе',             price: 'от 1 000 ₽',  href: '/esse' },
  { name: 'Лабораторная',     price: 'от 1 000 ₽',  href: '/laboratornaya' },
  { name: 'Презентация',      price: 'от 1 200 ₽',  href: '/prezentatsiya' },
  { name: 'Чертёж',           price: 'от 3 000 ₽',  href: '/chertezhi' },
  { name: 'Курсовая',         price: 'от 3 500 ₽',  href: '/kursovaya' },
  { name: 'Отчёт по практике', price: 'от 5 000 ₽', href: '/otchet-po-praktike' },
  { name: 'УИР',              price: 'от 7 000 ₽' },
  { name: 'ВКР / Диплом',     price: 'от 15 000 ₽', href: '/diplom' },
]

const factors = [
  { title: 'Объём', text: 'Чем больше страниц, слайдов, расчётов или задач, тем больше времени требуется специалисту.' },
  { title: 'Срочность', text: 'Плановые сроки дешевле. Срочная помощь требует перестроить график, поэтому стоит дороже.' },
  { title: 'Дисциплина', text: 'Узкоспециальные и технические темы, расчёты и программирование сложнее общих гуманитарных.' },
  { title: 'Требования методички', text: 'Особые правила оформления, обязательные источники и структура кафедры увеличивают объём работы.' },
  { title: 'Уникальность', text: 'Повышенный порог уникальности по Антиплагиат.ВУЗ требует дополнительной проработки текста.' },
]

const faq = [
  {
    q: 'Почему цены указаны «от»?',
    a: 'Стоимость зависит от объёма, срочности, дисциплины и требований кафедры. Начальная цена — это минимальный уровень для типовой задачи. Итог называем после изучения задания.',
  },
  {
    q: 'Нужна ли предоплата?',
    a: 'Нет. Оплата только после того, как вы согласовали план, объём и итоговую стоимость.',
  },
  {
    q: 'Можно ли узнать точную цену до оформления заявки?',
    a: 'Да. Оставьте заявку с описанием задачи и методичкой — ответим за 30 минут и назовём итоговую стоимость. Заявка ни к чему не обязывает.',
  },
  {
    q: 'Что входит в стоимость?',
    a: 'Работа по вашим требованиям, оформление по ГОСТ, проверка на уникальность и бесплатные правки по замечаниям преподавателя.',
  },
]

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Главная', item: 'https://studyassist.ru' },
        { '@type': 'ListItem', position: 2, name: 'Цены', item: 'https://studyassist.ru/tseny' },
      ],
    },
    {
      '@type': 'FAQPage',
      mainEntity: faq.map(({ q, a }) => ({
        '@type': 'Question',
        name: q,
        acceptedAnswer: { '@type': 'Answer', text: a },
      })),
    },
  ],
}

export default function TsenyPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="min-h-screen bg-desk dither">
        <Navbar />

        <main id="main-content" className="pt-6 pb-16 px-4 sm:px-6 lg:px-12">
          <div className="max-w-[1100px] mx-auto">

            {/* Breadcrumb */}
            <nav aria-label="Breadcrumb" className="mb-4">
              <ol className="flex flex-wrap items-center gap-1.5 text-xs font-mono text-white">
                <li><Link href="/" className="hover:text-accent transition-colors">Главная</Link></li>
                <li aria-hidden="true"><ChevronRight className="w-3 h-3" /></li>
                <li className="text-white/90" aria-current="page">Цены</li>
              </ol>
            </nav>

            {/* Document window */}
            <div className="window">
              <div className="titlebar">
                <span className="truncate">ЦЕНЫ.EXE — StudyAssist</span>
                <div className="flex items-center gap-1 flex-shrink-0" aria-hidden="true">
                  <span className="titlebar-btn">_</span>
                  <span className="titlebar-btn">□</span>
                  <span className="titlebar-btn">×</span>
                </div>
              </div>

              <div className="bg-paper">
                {/* Hero */}
                <section className="px-5 sm:px-10 pt-10 pb-8 border-b border-chrome-shadow/30">
                  <div className="max-w-[720px]">
                    <h1 className="font-display leading-[1.4] text-[clamp(20px,4.5vw,40px)] break-words text-ink mb-5">
                      Цены на помощь со студенческими работами
                    </h1>
                    <p className="text-[17px] text-ink-soft leading-[1.7] mb-8">
                      Консультации, помощь в подготовке и оформление работ: от 550 ₽ за задачу до 15 000 ₽ за ВКР. Итоговую стоимость называем после изучения задачи — без скрытых доплат и предоплаты.
                    </p>
                    <Button asChild size="lg">
                      <Link href="/?go=order">
                        Узнать точную цену
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Link>
                    </Button>
                  </div>
                </section>

                {/* Price table */}
                <section className="px-5 sm:px-10 py-10 border-b border-chrome-shadow/30">
                  <h2 className="font-display text-xl sm:text-2xl text-ink mb-6">Стоимость по видам работ</h2>
                  <div className="overflow-x-auto max-w-[760px]">
                    <table className="w-full text-left border-collapse">
                      <caption className="sr-only">Начальные цены на помощь со студенческими работами</caption>
                      <thead>
                        <tr className="bg-chrome/40 border-b border-chrome-shadow/40">
                          <th scope="col" className="px-4 py-3 text-xs font-mono font-bold uppercase tracking-[1.5px] text-ink-soft">Вид работы</th>
                          <th scope="col" className="px-4 py-3 text-xs font-mono font-bold uppercase tracking-[1.5px] text-ink-soft">Цена</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((r) => (
                          <tr key={r.name} className="border-b border-chrome-shadow/30">
                            <th scope="row" className="px-4 py-3 text-sm font-bold text-ink">
                              {r.href ? (
                                <Link href={r.href} className="text-title hover:text-accent transition-colors">
                                  {r.name}
                                </Link>
                              ) : (
                                r.name
                              )}
                            </th>
                            <td className="px-4 py-3 font-mono font-bold text-title whitespace-nowrap">{r.price}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p className="text-xs text-ink-soft leading-[1.6] mt-4 max-w-[760px]">
                    Указана начальная цена для типовой задачи. Точная стоимость зависит от объёма, срока и требований кафедры.
                  </p>
                </section>

                {/* Cost factors */}
                <section className="px-5 sm:px-10 py-10 bg-chrome/25 border-b border-chrome-shadow/30">
                  <h2 className="font-display text-xl sm:text-2xl text-ink mb-6">От чего зависит стоимость</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {factors.map((f) => (
                      <div key={f.title} className="window">
                        <div className="bg-paper p-4">
                          <div className="font-bold text-sm text-ink mb-1.5">{f.title}</div>
                          <div className="text-xs text-ink-soft leading-[1.6]">{f.text}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                {/* FAQ */}
                <section className="px-5 sm:px-10 py-10 border-b border-chrome-shadow/30">
                  <h2 className="font-display text-xl sm:text-2xl text-ink mb-6">Частые вопросы</h2>
                  <Accordion type="single" collapsible className="max-w-[760px]">
                    {faq.map(({ q, a }) => (
                      <AccordionItem key={q} value={q}>
                        <AccordionTrigger className="text-left text-base">{q}</AccordionTrigger>
                        <AccordionContent>{a}</AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </section>

                {/* Bottom CTA */}
                <section className="px-5 sm:px-10 py-10 bg-chrome/25">
                  <div className="window">
                    <div className="bg-paper p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                      <div>
                        <h2 className="font-display text-xl text-ink mb-2">Хотите знать точную цену?</h2>
                        <p className="text-ink-soft text-sm">Опишите задачу — ответим за 30 минут и назовём итоговую стоимость</p>
                      </div>
                      <Button asChild size="lg" className="flex-shrink-0">
                        <Link href="/?go=order">Оставить заявку →</Link>
                      </Button>
                    </div>
                  </div>
                </section>
              </div>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </>
  )
}
