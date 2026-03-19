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
            <p>Исполнитель оказывает услуги по написанию учебных материалов: курсовых работ, рефератов, дипломных работ, решению задач и иных академических заданий в соответствии с требованиями Заказчика.</p>
            <h2 className="text-xl font-semibold text-white">2. Порядок оплаты</h2>
            <p>Оплата производится после выполнения работы и её проверки Заказчиком. Стоимость согласовывается индивидуально. Оплата принимается через платёжную систему ЮKassa.</p>
            <h2 className="text-xl font-semibold text-white">3. Гарантии</h2>
            <p>Исполнитель гарантирует оригинальность работы не менее 80% по системе Антиплагиат и предоставляет бесплатные правки в течение 3 дней с момента передачи работы.</p>
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
