import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'

export const metadata: Metadata = {
  title: 'Публичная оферта — StudyAssist',
  description: 'Публичная оферта StudyAssist: условия оказания образовательных консультаций, права и обязанности сторон.',
}

export default function OfferPage() {
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
              <span className="truncate">OFFER.TXT — Публичная оферта</span>
            </div>
            <div className="bg-paper p-6 sm:p-10">
          <h1 className="font-display font-bold text-2xl sm:text-3xl text-ink mb-8">Публичная оферта</h1>
          <div className="space-y-6 text-ink-soft leading-relaxed">
            <p>Настоящая публичная оферта является официальным предложением ИП StudyAssist заключить договор об оказании образовательных консультационных услуг.</p>
            <h2 className="text-xl font-semibold text-ink">1. Предмет договора</h2>
            <p>Исполнитель оказывает образовательные консультационные услуги: консультации по учебным дисциплинам, подбор учебных материалов и литературы, помощь в подготовке к экзаменам, разбор задач и примеров, рецензирование работ Заказчика в соответствии с его запросом.</p>
            <h2 className="text-xl font-semibold text-ink">2. Порядок оплаты</h2>
            <p>Стоимость услуг согласовывается индивидуально до начала оказания услуги. Оплата производится после согласования всех условий. Оплата принимается через платёжную систему ЮKassa.</p>
            <h2 className="text-xl font-semibold text-ink">3. Гарантии</h2>
            <p>Исполнитель гарантирует качество консультационных услуг и готовность ответить на уточняющие вопросы в рамках согласованной темы.</p>
            <h2 className="text-xl font-semibold text-ink">4. Конфиденциальность</h2>
            <p>Исполнитель обязуется не раскрывать информацию о заказах и персональных данных Заказчика третьим лицам.</p>
            <h2 className="text-xl font-semibold text-ink">5. Контакты</h2>
            <p>Email: <a href="mailto:support@studyassist.ru" className="text-title">support@studyassist.ru</a></p>
          </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
