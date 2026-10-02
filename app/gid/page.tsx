import type { Metadata } from 'next'
import Link from 'next/link'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { ChevronRight } from 'lucide-react'
import { guides } from '@/lib/guides'

const TITLE = 'Гайды для студентов: практика, ВКР, оформление | StudyAssist'
const DESCRIPTION =
  'Практические руководства для студентов вузов и колледжей: как написать отчёт по практике, заполнить дневник, подготовить ВКР с разработкой информационной системы, оформить работу по ГОСТ. С образцами и шаблонами Word.'

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: '/gid' },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: 'https://studyassist.ru/gid',
    type: 'website',
  },
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Главная', item: 'https://studyassist.ru' },
        { '@type': 'ListItem', position: 2, name: 'Гайды', item: 'https://studyassist.ru/gid' },
      ],
    },
  ],
}

export default function GuidesHubPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="min-h-screen bg-desk dither">
        <Navbar />

        <main id="main-content" className="pt-6 pb-16 px-4 sm:px-6 lg:px-12">
          <div className="max-w-[1100px] mx-auto">
            <nav aria-label="Breadcrumb" className="mb-4">
              <ol className="flex flex-wrap items-center gap-1.5 text-xs font-mono text-white">
                <li><Link href="/" className="hover:text-accent transition-colors">Главная</Link></li>
                <li aria-hidden="true"><ChevronRight className="w-3 h-3" /></li>
                <li className="text-white/90" aria-current="page">Гайды</li>
              </ol>
            </nav>

            <div className="window">
              <div className="titlebar">
                <span className="truncate">ГАЙДЫ.EXE — StudyAssist</span>
                <div className="flex items-center gap-1 flex-shrink-0" aria-hidden="true">
                  <span className="titlebar-btn">_</span>
                  <span className="titlebar-btn">□</span>
                  <span className="titlebar-btn">×</span>
                </div>
              </div>

              <div className="bg-paper">
                <section className="px-5 sm:px-10 pt-10 pb-8 border-b border-chrome-shadow/30">
                  <div className="max-w-[720px]">
                    <h1 className="font-display leading-[1.4] text-[clamp(20px,4.5vw,40px)] break-words text-ink mb-5">
                      Гайды для студентов
                    </h1>
                    <p className="text-[17px] text-ink-soft leading-[1.7]">
                      Практические руководства с образцами и шаблонами: что писать, как оформить и на что обращают внимание преподаватели. Ориентированы на студентов вузов и колледжей.
                    </p>
                  </div>
                </section>

                <section className="px-5 sm:px-10 py-10 border-b border-chrome-shadow/30">
                  <h2 className="font-display text-xl sm:text-2xl text-ink mb-6">Все руководства</h2>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {guides.map((g) => (
                      <li key={g.slug}>
                        <Link
                          href={`/gid/${g.slug}`}
                          className="window block h-full group"
                        >
                          <div className="bg-paper p-5 h-full">
                            <h3 className="font-bold text-base text-title group-hover:text-accent transition-colors leading-snug mb-2">
                              {g.h1}
                            </h3>
                            <p className="text-sm text-ink-soft leading-[1.7] mb-3">{g.description}</p>
                            <span className="text-xs font-mono text-ink-soft">
                              Обновлено {g.updated.split('-').reverse().join('.')}
                            </span>
                          </div>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>

                <section className="px-5 sm:px-10 py-10 border-b border-chrome-shadow/30">
                  <h2 className="font-display text-xl sm:text-2xl text-ink mb-6">Бесплатные инструменты</h2>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <Link href="/spisok-literatury-po-gostu" className="window block group">
                      <div className="bg-paper p-5 h-full">
                        <h3 className="font-bold text-base text-title group-hover:text-accent transition-colors leading-snug mb-2">
                          Список литературы по ГОСТу онлайн
                        </h3>
                        <p className="text-sm text-ink-soft leading-[1.7]">
                          Генератор описаний по ГОСТ Р 7.0.100-2018: книги, статьи, сайты, законы, диссертации. Бесплатно и без регистрации.
                        </p>
                      </div>
                    </Link>
                    <Link href="/proverka-oformleniya" className="window block group">
                      <div className="bg-paper p-5 h-full">
                        <h3 className="font-bold text-base text-title group-hover:text-accent transition-colors leading-snug mb-2">
                          Проверка оформления работы
                        </h3>
                        <p className="text-sm text-ink-soft leading-[1.7]">
                          Загрузите .docx и впишите требования методички: поля, шрифт, интервалы, отступы, пустые строки, нумерация. Файл не покидает браузер.
                        </p>
                      </div>
                    </Link>
                  </div>
                </section>

                <section className="px-5 sm:px-10 py-10 bg-chrome/25">
                  <p className="text-sm text-ink-soft leading-[1.7] max-w-[720px]">
                    Нужна помощь с отчётом по практике? Смотрите страницу{' '}
                    <Link href="/otchet-po-praktike" className="text-title hover:text-accent transition-colors underline">
                      «Помощь с отчётом по практике»
                    </Link>
                    . С выпускной работой —{' '}
                    <Link href="/diplom" className="text-title hover:text-accent transition-colors underline">
                      «Помощь с ВКР»
                    </Link>
                    .
                  </p>
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
