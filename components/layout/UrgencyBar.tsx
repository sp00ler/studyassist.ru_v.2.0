import Link from 'next/link'

export function UrgencyBar() {
  return (
    <div className="bg-gradient-to-r from-[#C0392B] to-[#FF3B5C] py-2.5 px-6 text-center text-[13px] font-semibold text-white tracking-[.2px] relative z-50">
      ⚡ Эксперты онлайн прямо сейчас — ответ за 30 минут.{' '}
      <Link href="#order" className="text-white underline ml-2.5 hover:no-underline transition-all">
        Оставить заявку →
      </Link>
    </div>
  )
}
