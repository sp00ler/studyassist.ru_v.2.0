import Link from 'next/link'

export function UrgencyBar() {
  return (
    <div className="bg-[#C0392B] py-2.5 px-6 text-center text-[13px] font-semibold text-white tracking-[.2px] relative z-50">
      <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#E8A33D] mr-2 align-middle led-hdd" />
      Эксперты онлайн прямо сейчас — ответ за 30 минут.{' '}
      <Link href="#order" className="text-white underline ml-2.5 hover:no-underline transition-all">
        Оставить заявку →
      </Link>
    </div>
  )
}
