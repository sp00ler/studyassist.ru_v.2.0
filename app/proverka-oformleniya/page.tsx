import type { Metadata } from 'next'
import Link from 'next/link'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { Button } from '@/components/ui/button'
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion'
import { ChevronRight } from 'lucide-react'
import { DocxCheckTool } from '@/components/tools/DocxCheckTool'

const SITE = 'https://studyassist.ru'
const PAGE_URL = `${SITE}/proverka-oformleniya`
const TITLE = 'Проверка оформления работы по ГОСТу онлайн бесплатно | StudyAssist'
const DESCRIPTION =
  'Бесплатная проверка оформления курсовой, реферата или ВКР в .docx по требованиям вашей методички: поля, шрифт, интервал, отступы, пустые строки, заголовки, нумерация страниц. Файл не загружается на сервер.'

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: '/proverka-oformleniya' },
  openGraph: { title: TITLE, description: DESCRIPTION, url: PAGE_URL, type: 'website' },
}

const faq = [
  {
    q: 'Мой файл куда-то загружается?',
    a: 'Нет. Документ читается и проверяется прямо в вашем браузере, на сервер ничего не отправляется и нигде не сохраняется. Можно даже отключить интернет после открытия страницы — проверка продолжит работать.',
  },
  {
    q: 'Почему нет готовых настроек «по ГОСТу»?',
    a: 'Потому что у каждой кафедры свои требования: где-то правое поле 10 мм, где-то 15, где-то номер страницы вверху, где-то внизу. Проверка по чужим настройкам дала бы ложные ошибки. Впишите значения из своей методички — и проверка будет точной именно для вас.',
  },
  {
    q: 'Что проверяется, если оставить поля пустыми?',
    a: 'Только то, что является ошибкой при любых требованиях: формат страницы A4, несколько пустых строк подряд вместо разрыва страницы, отступ первой строки пробелами или табуляцией, двойные пробелы и заголовки, оформленные вручную без стиля.',
  },
  {
    q: 'Почему титульный лист и таблицы не проверяются?',
    a: 'Титульный лист почти везде оформляют по бланку кафедры с другими шрифтами и выравниванием, а для текста в таблицах методички часто разрешают меньший шрифт и одинарный интервал. Чтобы не показывать ложные ошибки, эти части пропускаются.',
  },
  {
    q: 'Что значит «проверить вручную»?',
    a: 'Это места, где проверка не может быть уверена: например, короткая строка по центру может быть и ошибкой, и подписью к рисунку. Такие места не считаются ошибками, но на них стоит посмотреть.',
  },
  {
    q: 'Можно проверить файл .doc или PDF?',
    a: 'Нет, только .docx. Файл .doc откройте в Word и сохраните как «Документ Word (.docx)». В PDF оформление уже «застыло», и его нельзя проверить по стилям.',
  },
]

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebApplication',
      '@id': `${PAGE_URL}#app`,
      name: 'Проверка оформления работы по ГОСТу онлайн',
      url: PAGE_URL,
      description: DESCRIPTION,
      applicationCategory: 'EducationalApplication',
      operatingSystem: 'Any',
      inLanguage: 'ru',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'RUB' },
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Главная', item: SITE },
        { '@type': 'ListItem', position: 2, name: 'Проверка оформления', item: PAGE_URL },
      ],
    },
    {
      '@type': 'FAQPage',
      mainEntity: faq.map(({ q, a }) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })),
    },
  ],
}

const h2 = 'font-display text-xl sm:text-2xl text-ink mb-4 leading-[1.4]'
const p = 'text-base text-ink leading-[1.75] max-w-[72ch]'
const link = 'text-title hover:text-accent transition-colors underline'
const ul = 'list-disc pl-6 space-y-2 text-base text-ink leading-[1.7] max-w-[72ch] marker:text-title'

export default function ProverkaOformleniyaPage() {
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
                <li className="text-white/90" aria-current="page">Проверка оформления</li>
              </ol>
            </nav>

            <div className="mb-6 max-w-[760px]">
              <h1 className="font-display leading-[1.4] text-[clamp(20px,4.5vw,36px)] break-words text-white mb-3">
                Проверка оформления работы по ГОСТу онлайн
              </h1>
              <p className="text-[17px] text-white/90 leading-[1.7]">
                Впишите требования из методички, загрузите .docx — и получите список ошибок с подсказками, как их исправить. Бесплатно, файл не покидает ваш компьютер.
              </p>
            </div>

            <DocxCheckTool />

            <article className="window mt-8">
              <div className="titlebar">
                <span className="truncate">СПРАВКА.EXE — StudyAssist</span>
                <div className="flex items-center gap-1 flex-shrink-0" aria-hidden="true">
                  <span className="titlebar-btn">_</span>
                  <span className="titlebar-btn">□</span>
                  <span className="titlebar-btn">×</span>
                </div>
              </div>

              <div className="bg-paper px-5 sm:px-10 py-10 space-y-10">
                <section aria-labelledby="what">
                  <h2 id="what" className={h2}>Что проверяется</h2>
                  <ul className={ul}>
                    <li><strong>Поля и формат страницы</strong> — по значениям, которые вы ввели, и A4.</li>
                    <li><strong>Шрифт и размер</strong> основного текста, в том числе фрагменты, вставленные из интернета со своим шрифтом.</li>
                    <li><strong>Межстрочный интервал, абзацный отступ и выравнивание.</strong></li>
                    <li><strong>Пустые строки подряд</strong> — когда страницу «добивают» Enter&apos;ами вместо разрыва страницы.</li>
                    <li><strong>Отступы пробелами и двойные пробелы.</strong></li>
                    <li><strong>Заголовки без стиля</strong>, которые не попадут в автоматическое оглавление, и наличие самого оглавления.</li>
                    <li><strong>Нумерация страниц</strong>: есть ли она, вверху или внизу и нет ли номера на титульном листе.</li>
                  </ul>
                  <p className={`${p} mt-4`}>
                    Для каждой ошибки показано начало абзаца — найдите его в Word через Ctrl+F — и короткая инструкция, как исправить.
                  </p>
                </section>

                <section aria-labelledby="how">
                  <h2 id="how" className={h2}>Как пользоваться</h2>
                  <ol className="list-decimal pl-6 space-y-2 text-base text-ink leading-[1.7] max-w-[72ch] marker:font-mono marker:font-bold marker:text-title">
                    <li>Откройте методичку своей кафедры и найдите раздел про оформление.</li>
                    <li>Впишите в форму значения, которые там указаны. То, чего в методичке нет, оставьте пустым. Значения запоминаются в браузере для следующей проверки.</li>
                    <li>Перетащите свою работу в формате .docx в поле или нажмите на него и выберите файл.</li>
                    <li>Исправьте ошибки в Word и проверьте файл ещё раз.</li>
                  </ol>
                </section>

                <section aria-labelledby="limits">
                  <h2 id="limits" className={h2}>Чего проверка не делает</h2>
                  <p className={`${p} mb-4`}>
                    Мы сознательно проверяем только то, в чём можно быть уверенными. Лучше пропустить спорное место, чем показать ложную ошибку.
                  </p>
                  <ul className={ul}>
                    <li>Не проверяет содержание, структуру глав и объём работы — у каждой кафедры свои требования.</li>
                    <li>Не проверяет титульный лист и текст в таблицах.</li>
                    <li>Не проверяет подписи рисунков и таблиц и список литературы. Описания источников удобно собрать в нашем{' '}
                      <Link href="/spisok-literatury-po-gostu" className={link}>генераторе списка литературы по ГОСТу</Link>.</li>
                    <li>Не исправляет файл автоматически — только показывает, что исправить.</li>
                  </ul>
                </section>

                <section aria-labelledby="template">
                  <h2 id="template" className={h2}>Чтобы ошибок не было с самого начала</h2>
                  <p className={p}>
                    Пишите работу в шаблоне, где оформление уже настроено, и пользуйтесь стилями. Как это делать — в гайде{' '}
                    <Link href="/gid/shablon-word-po-gostu" className={link}>«Шаблон Word по ГОСТу: чистый лист с готовым оформлением»</Link>
                    , там же можно бесплатно скачать шаблон.
                  </p>
                </section>

                <section aria-labelledby="faq">
                  <h2 id="faq" className={h2}>Частые вопросы</h2>
                  <Accordion type="single" collapsible className="max-w-[760px]">
                    {faq.map(({ q, a }) => (
                      <AccordionItem key={q} value={q}>
                        <AccordionTrigger className="text-left text-base">{q}</AccordionTrigger>
                        <AccordionContent>{a}</AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </section>

                <section aria-label="Помощь с оформлением">
                  <div className="window max-w-[760px]">
                    <div className="bg-paper p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
                      <div>
                        <h2 className="font-display text-lg text-ink mb-2 leading-[1.4]">Ошибок много, а сдавать скоро?</h2>
                        <p className="text-sm text-ink-soft leading-[1.7]">
                          Пришлите методичку и работу — проконсультируем по требованиям кафедры и поможем привести оформление в порядок.
                        </p>
                      </div>
                      <Button asChild size="lg" className="flex-shrink-0">
                        <Link href="/tseny">
                          Цены на помощь
                          <ChevronRight className="w-4 h-4 ml-1" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </section>
              </div>
            </article>
          </div>
        </main>
        <Footer />
      </div>
    </>
  )
}
