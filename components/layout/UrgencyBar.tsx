import Link from 'next/link'

export function UrgencyBar() {
  return (
    <div className="bg-danger text-white py-1.5 px-4 text-center text-[12px] sm:text-[13px] font-mono tracking-[.2px] relative z-50 flex items-center justify-center gap-2 flex-wrap">
      <span className="inline-block w-2 h-2 bg-accent led-hdd" aria-hidden="true" />
      <span>Эксперты онлайн прямо сейчас — ответ за 30 минут.</span>
      <Link
        href="#order"
        className="text-white underline decoration-dotted underline-offset-2 hover:text-accent transition-colors font-bold"
      >
        Оставить заявку →
      </Link>
    </div>
  )
}
