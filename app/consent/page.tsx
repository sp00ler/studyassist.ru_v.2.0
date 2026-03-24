import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'

export const metadata: Metadata = {
  title: 'Согласие на обработку персональных данных — StudyAssist',
}

export default function ConsentPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-24 pb-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <Link href="/" className="inline-flex items-center gap-2 text-white/50 hover:text-white transition-colors text-sm mb-8">
            <ArrowLeft className="w-4 h-4" />
            На главную
          </Link>
          <h1 className="text-3xl font-bold text-white mb-2">Согласие на обработку персональных данных</h1>

          <div className="space-y-6 text-white/70 leading-relaxed mt-10">
            <p>
              Настоящее Согласие предоставляется в соответствии со статьёй 9 Федерального закона от 27.07.2006
              № 152-ФЗ «О персональных данных».
            </p>
            <p>
              Пользователь сайта{' '}
              <a href="https://studyassist.ru" className="text-[#6C3EF4] hover:underline">https://studyassist.ru</a>,
              совершая регистрацию, оформление заказа или иные действия на Сайте, выражает свободное, конкретное,
              информированное и сознательное согласие на обработку своих персональных данных на следующих условиях.
            </p>

            <h2 className="text-xl font-semibold text-white pt-2">1. Оператор</h2>
            <p>
              Приходько Денис Сергеевич (ИНН: 701740486305), плательщик налога на профессиональный доход,
              осуществляющий деятельность под обозначением StudyAssist.ru.
            </p>

            <h2 className="text-xl font-semibold text-white pt-2">2. Перечень персональных данных</h2>
            <p>Согласие распространяется на следующие персональные данные:</p>
            <ul className="space-y-1 pl-4 list-none">
              {[
                'фамилия, имя, отчество;',
                'адрес электронной почты;',
                'номер телефона (при его указании пользователем);',
                'IP-адрес, данные cookie, сведения о браузере и устройстве;',
                'содержание обращений, заказов и иной информации, добровольно предоставленной пользователем;',
                'платёжные реквизиты в объёме, необходимом для проведения расчётов через платёжного партнёра.',
              ].map((item) => (
                <li key={item} className="flex gap-2"><span className="text-[#6C3EF4] flex-shrink-0">—</span>{item}</li>
              ))}
            </ul>

            <h2 className="text-xl font-semibold text-white pt-2">3. Цели обработки</h2>
            <p>Персональные данные обрабатываются в следующих целях:</p>
            <ul className="space-y-1 pl-4 list-none">
              {[
                'регистрация и идентификация пользователя на Сайте;',
                'исполнение заказов и оказание услуг;',
                'проведение расчётов;',
                'направление сервисных и информационных уведомлений;',
                'улучшение качества сервиса;',
                'исполнение требований законодательства.',
              ].map((item) => (
                <li key={item} className="flex gap-2"><span className="text-[#6C3EF4] flex-shrink-0">—</span>{item}</li>
              ))}
            </ul>

            <h2 className="text-xl font-semibold text-white pt-2">4. Действия с персональными данными</h2>
            <p>
              Оператор вправе совершать следующие действия: сбор, запись, систематизацию, накопление, хранение,
              уточнение (обновление, изменение), извлечение, использование, передачу (предоставление, доступ)
              в случаях, предусмотренных Политикой конфиденциальности, обезличивание, блокирование, удаление,
              уничтожение персональных данных.
            </p>

            <h2 className="text-xl font-semibold text-white pt-2">5. Передача третьим лицам</h2>
            <p>
              Передача персональных данных третьим лицам допускается исключительно в целях и объёме,
              предусмотренных Политикой конфиденциальности. Лица, которым передаются данные, обязаны обеспечивать
              их конфиденциальность.
            </p>

            <h2 className="text-xl font-semibold text-white pt-2">6. Срок действия согласия</h2>
            <p>
              Согласие действует с момента его предоставления и до истечения сроков хранения персональных данных,
              установленных законодательством, либо до отзыва согласия субъектом персональных данных.
            </p>

            <h2 className="text-xl font-semibold text-white pt-2">7. Отзыв согласия</h2>
            <p>
              Субъект персональных данных вправе отозвать настоящее Согласие в любое время, направив письменное
              заявление Оператору на адрес электронной почты:{' '}
              <a href="mailto:support@studyassist.ru" className="text-[#6C3EF4] hover:underline">support@studyassist.ru</a>.
              Отзыв Согласия не влечёт прекращения обработки персональных данных в случаях, когда такая обработка
              допускается без согласия субъекта на основании требований законодательства.
            </p>

            <h2 className="text-xl font-semibold text-white pt-2">8. Последствия отзыва</h2>
            <p>
              Оператор вправе после получения отзыва Согласия прекратить оказание услуг пользователю в части,
              требующей обработки персональных данных.
            </p>

            <p className="pt-2">
              Политика конфиденциальности размещена на Сайте:{' '}
              <a href="https://studyassist.ru/privacy" className="text-[#6C3EF4] hover:underline">https://studyassist.ru/privacy</a>.
            </p>

            <div className="border-t border-white/10 pt-6 mt-6">
              <p className="text-white/50">
                Пользователь подтверждает, что ознакомлен с настоящим Согласием и{' '}
                <a href="/privacy" className="text-[#6C3EF4] hover:underline">Политикой конфиденциальности</a>,
                понимает их содержание и предоставляет Согласие добровольно.
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
