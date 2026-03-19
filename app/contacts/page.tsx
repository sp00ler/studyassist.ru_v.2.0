import type { Metadata } from 'next'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { Mail, Clock } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Контакты — StudyAssist',
}

export default function ContactsPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-24 pb-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <h1 className="text-3xl font-bold text-white mb-8">Контакты</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <div className="w-12 h-12 bg-[#6C3EF4]/20 rounded-xl flex items-center justify-center mb-4">
                <Mail className="w-6 h-6 text-[#6C3EF4]" />
              </div>
              <h2 className="text-white font-semibold mb-2">Email</h2>
              <a href="mailto:support@studyassist.ru" className="text-[#6C3EF4] hover:underline">
                support@studyassist.ru
              </a>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <div className="w-12 h-12 bg-[#3B82F6]/20 rounded-xl flex items-center justify-center mb-4">
                <Clock className="w-6 h-6 text-[#3B82F6]" />
              </div>
              <h2 className="text-white font-semibold mb-2">Режим работы</h2>
              <p className="text-white/60 text-sm">Ежедневно с 9:00 до 23:00 МСК</p>
              <p className="text-white/40 text-xs mt-1">Ответ в течение 30 минут</p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
