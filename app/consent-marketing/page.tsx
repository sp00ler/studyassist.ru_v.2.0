import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'

export const metadata: Metadata = {
  title: 'Согласие на получение рекламных сообщений — StudyAssist',
  description: 'Согласие на получение рекламных и информационных сообщений от StudyAssist.',
}

export default function ConsentMarketingPage() {
  return (
    <>
      <Navbar />
      <main id="main-content" className="min-h-screen bg-desk dither pt-24 pb-16 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto">
          <Link href="/" className="inline-flex items-center gap-2 text-white hover:text-accent transition-colors text-sm mb-6">
            <ArrowLeft className="w-4 h-4" />
            На главную
          </Link>
          <div className="window">
            <div className="titlebar">
              <span className="truncate">MARKETING.TXT — Согласие на рекламные сообщения</span>
            </div>
            <div className="bg-paper p-6 sm:p-10">
          <h1 className="font-display font-bold text-2xl sm:text-3xl text-ink mb-2">
            Согласие на получение рекламных и информационных сообщений
          </h1>

          <div className="space-y-6 text-ink-soft leading-relaxed mt-10">
            <p>
              Настоящее Согласие предоставляется в соответствии с Федеральным законом от 13.03.2006 № 38-ФЗ
              «О рекламе», Федеральным законом от 27.07.2006 № 152-ФЗ «О персональных данных», а также
              Федеральным законом от 27.07.2006 № 149-ФЗ «Об информации, информационных технологиях и о
              защите информации».
            </p>
            <p>
              Пользователь сайта{' '}
              <a href="https://studyassist.ru" className="text-title hover:underline">https://studyassist.ru</a>,
              отмечая соответствующий элемент интерфейса при регистрации или оформлении заказа, выражает
              добровольное согласие на получение рекламных и информационных материалов на следующих условиях.
            </p>

            <h2 className="text-xl font-semibold text-ink pt-2">1. Распространитель</h2>
            <p>
              Приходько Денис Сергеевич (ИНН: 701740486305), плательщик налога на профессиональный доход,
              осуществляющий деятельность под обозначением StudyAssist.ru.
            </p>

            <h2 className="text-xl font-semibold text-ink pt-2">2. Каналы распространения</h2>
            <p>Согласие распространяется на получение материалов следующими способами:</p>
            <ul className="space-y-1 pl-4 list-none">
              {[
                'по адресу электронной почты, указанному пользователем при регистрации;',
                'посредством push-уведомлений на устройстве пользователя (при соответствующем разрешении);',
                'посредством сообщений в мессенджерах (при указании пользователем номера телефона и предоставлении соответствующего согласия).',
              ].map((item) => (
                <li key={item} className="flex gap-2"><span className="text-title flex-shrink-0">—</span>{item}</li>
              ))}
            </ul>

            <h2 className="text-xl font-semibold text-ink pt-2">3. Характер сообщений</h2>
            <p>Пользователь соглашается на получение следующих видов сообщений:</p>
            <ul className="space-y-1 pl-4 list-none">
              {[
                'информация об акциях, скидках, специальных предложениях сервиса StudyAssist.ru;',
                'анонсы новых услуг и функций сервиса;',
                'образовательные и методические материалы, полезные советы, связанные с тематикой сервиса;',
                'результаты опросов, информация об обновлениях условий оказания услуг.',
              ].map((item) => (
                <li key={item} className="flex gap-2"><span className="text-title flex-shrink-0">—</span>{item}</li>
              ))}
            </ul>

            <h2 className="text-xl font-semibold text-ink pt-2">4. Обработка персональных данных</h2>
            <p>
              В целях рассылки Оператор обрабатывает адрес электронной почты пользователя и, при необходимости,
              номер телефона. Обработка осуществляется в соответствии с{' '}
              <a href="/privacy" className="text-title hover:underline">Политикой конфиденциальности</a>,
              размещённой на Сайте.
            </p>

            <h2 className="text-xl font-semibold text-ink pt-2">5. Отказ от получения сообщений</h2>
            <p>
              5.1. Пользователь вправе в любой момент отказаться от получения рекламных и информационных
              сообщений, воспользовавшись одним из следующих способов:
            </p>
            <ul className="space-y-1 pl-4 list-none">
              {[
                'нажав ссылку «Отписаться» (или аналогичную) в любом из полученных сообщений;',
                <span key="email">направив соответствующий запрос на электронный адрес:{' '}
                  <a href="mailto:support@studyassist.ru" className="text-title hover:underline">support@studyassist.ru</a>;
                </span>,
                'изменив настройки уведомлений в личном кабинете на Сайте.',
              ].map((item, i) => (
                <li key={i} className="flex gap-2"><span className="text-title flex-shrink-0">—</span><span>{item}</span></li>
              ))}
            </ul>
            <p>
              5.2. Отказ от получения рекламных и информационных сообщений не влечёт отзыва Согласия на обработку
              персональных данных в иных целях, предусмотренных Пользовательским соглашением и Политикой
              конфиденциальности.
            </p>
            <p>
              5.3. После получения запроса об отказе Оператор прекращает направление рекламных материалов в
              течение 10 (десяти) рабочих дней.
            </p>

            <h2 className="text-xl font-semibold text-ink pt-2">6. Срок действия согласия</h2>
            <p>
              Согласие действует с момента его предоставления и до его отзыва пользователем способами,
              указанными в разделе 5 настоящего документа.
            </p>

            <div className="border-t border-chrome-shadow/50 pt-6 mt-6">
              <p className="text-ink-soft">
                Пользователь подтверждает, что ознакомлен с настоящим Согласием, понимает его содержание
                и предоставляет его добровольно, без принуждения.
              </p>
            </div>
          </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
