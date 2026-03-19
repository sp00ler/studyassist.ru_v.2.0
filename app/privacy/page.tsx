import type { Metadata } from 'next'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'

export const metadata: Metadata = {
  title: 'Политика конфиденциальности — StudyAssist',
}

export default function PrivacyPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-24 pb-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <h1 className="text-3xl font-bold text-white mb-8">Политика конфиденциальности</h1>
          <div className="prose prose-invert max-w-none space-y-6 text-white/70 leading-relaxed">
            <p>Настоящая Политика конфиденциальности определяет порядок обработки персональных данных пользователей сервиса StudyAssist.ru.</p>
            <h2 className="text-xl font-semibold text-white">1. Сбор информации</h2>
            <p>Мы собираем информацию, которую вы предоставляете при регистрации и оформлении заявок: имя, email, телефон. При использовании OAuth-авторизации мы получаем только публичные данные профиля (имя, email, аватар).</p>
            <h2 className="text-xl font-semibold text-white">2. Использование информации</h2>
            <p>Собранные данные используются исключительно для обработки заявок, связи с клиентом и улучшения качества сервиса. Мы не передаём ваши данные третьим лицам.</p>
            <h2 className="text-xl font-semibold text-white">3. Безопасность</h2>
            <p>Все данные хранятся на защищённых серверах. Пароли хранятся в хэшированном виде. Соединение защищено протоколом HTTPS.</p>
            <h2 className="text-xl font-semibold text-white">4. Контакты</h2>
            <p>По вопросам обработки персональных данных: <a href="mailto:support@studyassist.ru" className="text-[#6C3EF4]">support@studyassist.ru</a></p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
