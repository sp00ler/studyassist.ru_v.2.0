import type { Metadata } from 'next'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'

export const metadata: Metadata = {
  title: 'Публичная оферта — StudyAssist',
}

export default function OfferPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-24 pb-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <h1 className="text-3xl font-bold text-white mb-8">Публичная оферта</h1>
          <div className="space-y-6 text-white/70 leading-relaxed">
            <p>Настоящая публичная оферта является официальным предложением ИП StudyAssist заключить договор об оказании образовательных консультационных услуг.</p>
            <h2 className="text-xl font-semibold text-white">1. Предмет договора</h2>
            <p>Исполнитель оказывает образовательные консультационные услуги: консультации по учебным дисциплинам, репетиторство, подбор учебных материалов и литературы, помощь в подготовке к экзаменам, разбор задач и примеров, рецензирование работ Заказчика в соответствии с его запросом.</p>
            <h2 className="text-xl font-semibold text-white">2. Порядок оплаты</h2>
            <p>Стоимость услуг согласовывается индивидуально до начала оказания услуги. Оплата производится после согласования всех условий. Оплата принимается через платёжную систему ЮKassa.</p>
            <h2 className="text-xl font-semibold text-white">3. Гарантии</h2>
            <p>Исполнитель гарантирует качество консультационных услуг и готовность ответить на уточняющие вопросы в рамках согласованной темы.</p>
            <h2 className="text-xl font-semibold text-white">4. Конфиденциальность</h2>
            <p>Исполнитель обязуется не раскрывать информацию о заказах и персональных данных Заказчика третьим лицам.</p>
            <h2 className="text-xl font-semibold text-white">5. Контакты</h2>
            <p>Email: <a href="mailto:support@studyassist.ru" className="text-[#6C3EF4]">support@studyassist.ru</a></p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
