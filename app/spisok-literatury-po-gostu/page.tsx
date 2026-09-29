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
import { GostBibTool } from '@/components/tools/GostBibTool'

const SITE = 'https://studyassist.ru'
const PAGE_URL = `${SITE}/spisok-literatury-po-gostu`
const TITLE = 'Список литературы по ГОСТу онлайн бесплатно | StudyAssist'
const DESCRIPTION =
  'Бесплатный генератор списка литературы по ГОСТ Р 7.0.100-2018: книги, статьи, сайты, законы, диссертации. Правильные тире и инициалы, сортировка, копирование.'

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: '/spisok-literatury-po-gostu' },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: PAGE_URL,
    type: 'website',
  },
}

const faq = [
  {
    q: 'Какой ГОСТ действует для списка литературы в 2026 году?',
    a: 'Библиографическую запись оформляют по ГОСТ Р 7.0.100-2018 «Библиографическая запись. Библиографическое описание». Он заменил ГОСТ 7.1-2003. Внешний вид самой работы регулируют другие документы, например ГОСТ 7.32-2017 для отчётов, а требования кафедры могут их уточнять.',
  },
  {
    q: 'Как сортировать список литературы: по алфавиту или по порядку упоминания?',
    a: 'Зависит от методички. Если требований нет, обычно нормативные акты ставят первыми по юридической силе, затем литературу и электронные ресурсы по алфавиту. В некоторых вузах список нумеруют по порядку появления ссылок в тексте.',
  },
  {
    q: 'Сколько авторов указывать в описании?',
    a: 'Для одного, двух и трёх авторов в заголовке стоит первый, а после косой черты перечислены все. Для четырёх авторов заголовка нет, описание начинается с заглавия, а после косой черты названы все четверо. Для пяти и более указывают первых трёх и добавляют «[и др.]».',
  },
  {
    q: 'Нужна ли дата обращения для сайтов?',
    a: 'Да, для ресурсов удалённого доступа после URL указывают «(дата обращения: ДД.ММ.ГГГГ)». Это дата, когда вы открывали страницу. Генератор подставляет сегодняшнюю, но её можно изменить.',
  },
  {
    q: 'Как оформить книгу под редакцией без авторов?',
    a: 'Описание начинается с заглавия, а после косой черты пишут «под редакцией И. И. Иванова». Фамилию редактора нужно вводить в родительном падеже самостоятельно, поэтому в поле вы вводите фразу целиком.',
  },
  {
    q: 'Сохраняются ли мои данные?',
    a: 'Список хранится только в вашем браузере (localStorage) и никуда не отправляется. Генератор работает без регистрации и запросов к серверу. Если очистить данные сайта, список исчезнет, поэтому скопируйте его в документ.',
  },
]

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebApplication',
      '@id': `${PAGE_URL}#app`,
      name: 'Список литературы по ГОСТу онлайн',
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
        { '@type': 'ListItem', position: 2, name: 'Список литературы по ГОСТу', item: PAGE_URL },
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

const examples: { title: string; text: string }[] = [
  {
    title: 'Книга (1–3 автора)',
    text: 'Иванов, И. И. Экономика предприятия : учебник для вузов / И. И. Иванов, П. П. Петров. – 3-е изд., перераб. и доп. – Москва : Юрайт, 2023. – 320 с. – ISBN 978-5-534-00000-0. – Текст : непосредственный.',
  },
  {
    title: 'Книга (4 автора)',
    text: 'Экономика предприятия : учебник / И. И. Иванов, П. П. Петров, С. С. Сидоров, А. А. Андреев. – Москва : Юрайт, 2023. – 320 с. – Текст : непосредственный.',
  },
  {
    title: 'Книга (5 и более авторов)',
    text: 'Экономика предприятия : учебник / И. И. Иванов, П. П. Петров, С. С. Сидоров [и др.]. – Москва : Юрайт, 2023. – 320 с. – Текст : непосредственный.',
  },
  {
    title: 'Книга под редакцией',
    text: 'Менеджмент : учебник / под редакцией И. И. Иванова. – Москва : Юрайт, 2023. – 400 с. – Текст : непосредственный.',
  },
  {
    title: 'Статья из журнала',
    text: 'Иванов, И. И. Цифровизация бухгалтерского учёта / И. И. Иванов, П. П. Петров. – Текст : непосредственный // Бухгалтерский учёт. – 2024. – № 3. – С. 15–20.',
  },
  {
    title: 'Страница сайта',
    text: 'Иванов, И. И. Как оформить список литературы / И. И. Иванов. – Текст : электронный // Название сайта : [сайт]. – 2024. – 5 мая. – URL: https://example.ru/page (дата обращения: 15.07.2026).',
  },
  {
    title: 'Закон из официального издания',
    text: 'О бухгалтерском учёте : федеральный закон от 06.12.2011 № 402-ФЗ. – Текст : непосредственный // Собрание законодательства Российской Федерации. – 2011. – № 50. – Ст. 7344.',
  },
  {
    title: 'Закон из правовой базы',
    text: 'О бухгалтерском учёте : федеральный закон от 06.12.2011 № 402-ФЗ : [ред. от 12.12.2023]. – Текст : электронный // КонсультантПлюс : [сайт]. – URL: https://www.consultant.ru/document/cons_doc_LAW_122855/ (дата обращения: 15.07.2026).',
  },
  {
    title: 'Диссертация',
    text: 'Иванов, И. И. Управление затратами на промышленном предприятии : специальность 5.2.3 «Региональная и отраслевая экономика» : диссертация на соискание ученой степени кандидата экономических наук / Иванов Иван Иванович ; Московский государственный университет. – Москва, 2022. – 180 с. – Текст : непосредственный.',
  },
]

const h2 = 'font-display text-xl sm:text-2xl text-ink mb-4 leading-[1.4]'
const p = 'text-base text-ink leading-[1.75] max-w-[72ch]'
const link = 'text-title hover:text-accent transition-colors underline'
const ul =
  'list-disc pl-6 space-y-2 text-base text-ink leading-[1.7] max-w-[72ch] marker:text-title'

export default function SpisokLiteraturyPage() {
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
                <li className="text-white/90" aria-current="page">Список литературы по ГОСТу</li>
              </ol>
            </nav>

            <div className="mb-6 max-w-[720px]">
              <h1 className="font-display leading-[1.4] text-[clamp(20px,4.5vw,36px)] break-words text-white mb-3">
                Список литературы по ГОСТу онлайн
              </h1>
              <p className="text-[17px] text-white/90 leading-[1.7]">
                Оформление по ГОСТ Р 7.0.100-2018: книги, статьи, сайты, законы, диссертации
              </p>
            </div>

            <GostBibTool />

            <article className="window mt-8">
              <div className="titlebar">
                <span className="truncate">ПРАВИЛА.EXE — StudyAssist</span>
                <div className="flex items-center gap-1 flex-shrink-0" aria-hidden="true">
                  <span className="titlebar-btn">_</span>
                  <span className="titlebar-btn">□</span>
                  <span className="titlebar-btn">×</span>
                </div>
              </div>

              <div className="bg-paper px-5 sm:px-10 py-10 space-y-10">
                <section aria-labelledby="how">
                  <h2 id="how" className={h2}>Как пользоваться генератором</h2>
                  <ol className="list-decimal pl-6 space-y-2 text-base text-ink leading-[1.7] max-w-[72ch] marker:font-mono marker:font-bold marker:text-title">
                    <li>Выберите тип источника: книга, статья, сайт, закон или диссертация.</li>
                    <li>Впишите авторов: фамилию и инициалы в отдельных полях. Инициалы можно набрать как «ИИ», «И.И.» или «И И», генератор приведёт их к виду «И. И.».</li>
                    <li>Заполните остальные поля. Подсказки в полях показывают, как выглядят данные.</li>
                    <li>Проверьте готовое описание и нажмите «Скопировать» или «Добавить в список».</li>
                    <li>Когда список готов, отсортируйте его по алфавиту и скопируйте целиком в документ.</li>
                  </ol>
                  <p className={`${p} mt-4`}>
                    Данные обрабатываются прямо в браузере: ничего не отправляется на сервер, регистрация не нужна.
                  </p>
                </section>

                <section aria-labelledby="rules">
                  <h2 id="rules" className={h2}>Правила оформления по ГОСТ Р 7.0.100-2018</h2>
                  <p className={`${p} mb-4`}>
                    Библиографическое описание состоит из областей, и каждая следующая область отделяется от предыдущей разделителем «. – » (точка, пробел, тире, пробел). Это именно тире, а не дефис, и вокруг него стоят пробелы. Диапазон страниц тоже пишут с тире: «С. 15–20».
                  </p>
                  <ul className={ul}>
                    <li>
                      <strong>Инициалы.</strong> В заголовке описания: «Иванов, И. И.» (после фамилии запятая). После косой черты порядок обратный: «И. И. Иванов». Между инициалами ставится пробел.
                    </li>
                    <li>
                      <strong>Один, два или три автора.</strong> В заголовке указывают первого автора, после «/» перечисляют всех.
                    </li>
                    <li>
                      <strong>Четыре автора.</strong> Заголовка нет, запись начинается с заглавия. После «/» названы все четыре автора.
                    </li>
                    <li>
                      <strong>Пять и более авторов.</strong> Заголовка нет. После «/» указывают первых трёх и добавляют «[и др.]».
                    </li>
                    <li>
                      <strong>Вид носителя.</strong> Для печатных источников пишут «Текст : непосредственный», для ресурсов из интернета «Текст : электронный».
                    </li>
                    <li>
                      <strong>Дата обращения.</strong> Для электронных ресурсов после адреса указывают «URL: … (дата обращения: ДД.ММ.ГГГГ)».
                    </li>
                    <li>
                      <strong>Издательство.</strong> Город пишут полностью: «Москва», «Санкт-Петербург». Затем двоеточие, издательство, запятая и год.
                    </li>
                    <li>
                      <strong>Двойные знаки.</strong> Если название заканчивается вопросительным знаком, точку после него не ставят: «Что делать? – Москва».
                    </li>
                  </ul>
                </section>

                <section aria-labelledby="examples">
                  <h2 id="examples" className={h2}>Примеры оформления для каждого типа источника</h2>
                  <p className={`${p} mb-5`}>
                    Названия, авторы и адреса в примерах условные. Подставьте свои данные или соберите описание в генераторе выше.
                  </p>
                  <div className="space-y-4 max-w-[860px]">
                    {examples.map((e) => (
                      <div key={e.title} className="window">
                        <div className="bg-paper p-4">
                          <h3 className="text-xs font-mono font-bold uppercase tracking-[1.5px] text-ink-soft mb-2">{e.title}</h3>
                          <p className="text-[15px] text-ink leading-[1.7] break-words">{e.text}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                <section aria-labelledby="order">
                  <h2 id="order" className={h2}>Порядок источников в списке</h2>
                  <p className={`${p} mb-4`}>
                    Если методичка не требует иного, список делят на группы. Сначала идут нормативные правовые акты по юридической силе: Конституция, кодексы, федеральные законы, указы Президента, постановления Правительства, ведомственные акты. Затем литература (книги, статьи, диссертации) и электронные ресурсы в алфавитном порядке по первому слову описания. Нумерация обычно сквозная, арабскими цифрами.
                  </p>
                  <p className={p}>
                    Важно: требования вашей кафедры важнее общих правил. Если в методичке написано «в порядке упоминания в тексте» или «источники на иностранных языках в конце», следуйте методичке. Кнопка сортировки в генераторе расставляет записи по алфавиту, а группы с нормативными актами удобнее собрать вручную.
                  </p>
                </section>

                <section aria-labelledby="mistakes">
                  <h2 id="mistakes" className={h2}>Частые ошибки в списке литературы</h2>
                  <ul className={ul}>
                    <li>Дефис вместо тире между областями и в диапазонах страниц: «15-20» вместо «15–20».</li>
                    <li>Инициалы без пробела: «И.И.» вместо «И. И.», или инициалы перед фамилией в заголовке.</li>
                    <li>У электронного ресурса нет даты обращения или она указана в другом формате.</li>
                    <li>«[и др.]» при четырёх авторах: сокращать можно только начиная с пяти.</li>
                    <li>Двойные точки после названия, оканчивающегося на «?» или «.».</li>
                    <li>Не указан вид носителя «Текст : непосредственный» или «Текст : электронный».</li>
                    <li>Устаревшая редакция закона: проверяйте актуальную в справочной правовой системе.</li>
                    <li>Источники, на которые нет ссылок в тексте, и ссылки на источники, которых нет в списке.</li>
                  </ul>
                </section>

                <section aria-labelledby="related">
                  <h2 id="related" className={h2}>Где пригодится список литературы</h2>
                  <p className={`${p} mb-4`}>
                    Библиографический список нужен в курсовой, дипломной работе, реферате и отчёте по практике. О структуре отчёта и оформлении источников в нём читайте в{' '}
                    <Link href="/gid/kak-napisat-otchet-po-praktike" className={link}>
                      руководстве «Как написать отчёт по практике»
                    </Link>
                    . Если вы готовите большую работу, посмотрите страницы про{' '}
                    <Link href="/kursovaya" className={link}>курсовые работы</Link>
                    {' '}и{' '}
                    <Link href="/diplom" className={link}>дипломные работы</Link>
                    .
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
                        <h2 className="font-display text-lg text-ink mb-2 leading-[1.4]">
                          Нужна помощь с оформлением всей работы по ГОСТу?
                        </h2>
                        <p className="text-sm text-ink-soft leading-[1.7]">
                          Поможем оформить работу целиком: титульный лист, содержание, ссылки и список источников по требованиям вашей кафедры.
                        </p>
                      </div>
                      <Button asChild size="lg" className="flex-shrink-0">
                        <Link href="/kursovaya">
                          Подробнее
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
