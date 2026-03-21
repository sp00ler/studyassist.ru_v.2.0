import Link from 'next/link'
import { GraduationCap, Mail } from 'lucide-react'

export function Footer() {
  return (
    <footer className="bg-[#0A0A14] border-t border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#6C3EF4] to-[#3B82F6] flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-[#6C3EF4] to-[#3B82F6] bg-clip-text text-transparent">
                StudyAssist
              </span>
            </div>
            <p className="text-white/50 text-sm leading-relaxed">
              Профессиональная помощь студентам. Курсовые, дипломные, рефераты — быстро и качественно.
            </p>
          </div>

          {/* Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">Правовая информация</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/privacy" className="text-white/50 hover:text-white text-sm transition-colors">
                  Политика конфиденциальности
                </Link>
              </li>
              <li>
                <Link href="/consent" className="text-white/50 hover:text-white text-sm transition-colors">
                  Согласие на обработку данных
                </Link>
              </li>
              <li>
                <Link href="/consent-marketing" className="text-white/50 hover:text-white text-sm transition-colors">
                  Согласие на рекламные рассылки
                </Link>
              </li>
              <li>
                <Link href="/refund" className="text-white/50 hover:text-white text-sm transition-colors">
                  Правила возврата и оплаты
                </Link>
              </li>
              <li>
                <Link href="/offer" className="text-white/50 hover:text-white text-sm transition-colors">
                  Публичная оферта
                </Link>
              </li>
              <li>
                <Link href="/contacts" className="text-white/50 hover:text-white text-sm transition-colors">
                  Контакты
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-white font-semibold mb-4">Контакты</h3>
            <a
              href="mailto:support@studyassist.ru"
              className="flex items-center gap-2 text-white/50 hover:text-[#6C3EF4] text-sm transition-colors group"
            >
              <Mail className="w-4 h-4 group-hover:text-[#6C3EF4]" />
              support@studyassist.ru
            </a>
            <p className="text-white/30 text-xs mt-4">Отвечаем ежедневно с 9:00 до 23:00 МСК</p>
          </div>
        </div>

        <div className="border-t border-white/5 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-white/30 text-sm">© 2025 StudyAssist.ru — Все права защищены</p>
          <p className="text-white/20 text-xs">
            Сервис предназначен для помощи в обучении. 18+
          </p>
        </div>
      </div>
    </footer>
  )
}
