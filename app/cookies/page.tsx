import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'

export const metadata: Metadata = {
  title: 'Политика использования cookie — StudyAssist',
  description: 'Политика использования cookie на сайте StudyAssist: какие данные собираются и как управлять настройками.',
  alternates: { canonical: '/cookies' },
}

export default function CookiesPage() {
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
              <span className="truncate">COOKIE.TXT — Политика использования cookie</span>
            </div>
            <div className="bg-paper p-6 sm:p-10">
          <h1 className="font-display text-lg sm:text-2xl leading-snug break-words text-ink mb-2">Политика использования cookie</h1>
          <p className="font-mono text-ink-soft text-sm mb-10">сервиса StudyAssist.ru · Редакция от 30.03.2026</p>

          <div className="space-y-6 text-ink-soft leading-relaxed">

            <h2 className="text-xl font-semibold text-ink pt-2">1. Что такое cookie</h2>
            <p>
              Cookie (куки) — небольшие текстовые файлы, которые сохраняются в браузере пользователя при
              посещении сайта. Они позволяют сайту запоминать действия и настройки пользователя
              (например, авторизацию) на протяжении определённого времени.
            </p>

            <h2 className="text-xl font-semibold text-ink pt-2">2. Какие cookie мы используем</h2>

            <h3 className="text-base font-semibold text-ink">2.1. Необходимые cookie (технические)</h3>
            <p>
              Эти файлы обязательны для работы сайта. Без них невозможна авторизация, навигация и
              использование личного кабинета. Они не требуют вашего согласия.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-chrome-shadow/50">
                    <th className="text-left py-2 pr-4 text-ink-soft font-medium">Название</th>
                    <th className="text-left py-2 pr-4 text-ink-soft font-medium">Назначение</th>
                    <th className="text-left py-2 text-ink-soft font-medium">Срок</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-chrome-shadow/30">
                  <tr>
                    <td className="py-2 pr-4 font-mono text-ink-soft">next-auth.session-token</td>
                    <td className="py-2 pr-4">Авторизация пользователя</td>
                    <td className="py-2">30 дней</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4 font-mono text-ink-soft">next-auth.csrf-token</td>
                    <td className="py-2 pr-4">Защита от CSRF-атак</td>
                    <td className="py-2">Сессия</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4 font-mono text-ink-soft">sa_cookie_consent</td>
                    <td className="py-2 pr-4">Сохранение выбора настроек cookie</td>
                    <td className="py-2">1 год</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h3 className="text-base font-semibold text-ink">2.2. Аналитические cookie (только с вашего согласия)</h3>
            <p>
              Эти файлы устанавливаются только если вы нажали «Принять все» в баннере cookie.
              Они помогают нам улучшать сайт: анализировать посещаемость, поведение пользователей и
              эффективность страниц.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-chrome-shadow/50">
                    <th className="text-left py-2 pr-4 text-ink-soft font-medium">Сервис</th>
                    <th className="text-left py-2 pr-4 text-ink-soft font-medium">Что собирается</th>
                    <th className="text-left py-2 pr-4 text-ink-soft font-medium">Срок cookie</th>
                    <th className="text-left py-2 text-ink-soft font-medium">Передача данных</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-chrome-shadow/30">
                  <tr>
                    <td className="py-2 pr-4 text-ink-soft">Яндекс.Метрика</td>
                    <td className="py-2 pr-4">Просмотры, клики, переходы, источники трафика, Вебвизор (запись действий)</td>
                    <td className="py-2 pr-4">До 1 года</td>
                    <td className="py-2">Яндекс (Россия). Данные анонимизированы</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-ink-soft text-sm">
              Яндекс.Метрика работает в соответствии с{' '}
              <a
                href="https://yandex.ru/legal/confidential/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-title hover:underline"
              >
                Политикой конфиденциальности Яндекс
              </a>.
            </p>

            <h2 className="text-xl font-semibold text-ink pt-2">3. Управление cookie</h2>
            <p>Вы можете управлять cookie несколькими способами:</p>
            <ul className="space-y-2 pl-4 list-none">
              {[
                'Через баннер на сайте — при первом посещении выберите «Только необходимые», чтобы отключить аналитику.',
                'В настройках браузера — заблокируйте все или отдельные cookie (инструкции для Chrome, Firefox, Safari доступны в справке браузера).',
                'Через Яндекс.Оптаут — отключите трекинг Метрики по адресу yandex.ru/support/metrika/general/opt-out.html.',
              ].map((item) => (
                <li key={item} className="flex gap-2">
                  <span className="text-title flex-shrink-0">—</span>{item}
                </li>
              ))}
            </ul>
            <p className="text-ink-soft text-sm">
              Отказ от аналитических cookie не влияет на функциональность сайта. Отключение
              необходимых cookie может нарушить работу авторизации.
            </p>

            <h2 className="text-xl font-semibold text-ink pt-2">4. Изменение настроек согласия</h2>
            <p>
              Вы можете изменить свой выбор в любой момент, нажав кнопку «Настройки cookie» или
              очистив данные сайта в браузере (Настройки → Конфиденциальность → Очистить данные сайта).
              После очистки баннер появится снова.
            </p>

            <h2 className="text-xl font-semibold text-ink pt-2">5. Обновление политики</h2>
            <p>
              Мы вправе изменять настоящую Политику. При существенных изменениях мы обновим дату
              редакции. Актуальная версия всегда доступна по адресу{' '}
              <Link href="/cookies" className="text-title hover:underline">studyassist.ru/cookies</Link>.
            </p>

            <h2 className="text-xl font-semibold text-ink pt-2">6. Контакты</h2>
            <p>
              По вопросам использования cookie обращайтесь:{' '}
              <a href="mailto:support@studyassist.ru" className="text-title hover:underline">
                support@studyassist.ru
              </a>
            </p>
          </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
