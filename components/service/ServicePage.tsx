import Link from 'next/link'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { CheckCircle, Clock, Shield, Star, ChevronRight, MessageCircle } from 'lucide-react'

export interface ServiceFAQ { q: string; a: string }

export interface ServicePageProps {
  slug: string
  h1: string
  tagline: string
  price: string
  volume: string
  uniqueness: string
  deadline: string
  included: string[]
  faq: ServiceFAQ[]
  jsonLd: object
}

export function ServicePage({
  h1, tagline, price, volume, uniqueness, deadline,
  included, faq, jsonLd,
}: ServicePageProps) {
  const guarantees = [
    { icon: Star,          title: 'Уникальность',    text: `Антиплагиат ${uniqueness} — проверяем перед сдачей` },
    { icon: Clock,         title: 'Срок',             text: `Срочные работы от ${deadline}, плановые — по договорённости` },
    { icon: Shield,        title: 'Бесплатные правки', text: 'Дорабатываем до принятия преподавателем' },
    { icon: MessageCircle, title: 'Поддержка',        text: 'Ответ за 30 минут, работаем 9:00–23:00' },
  ]

  const steps = [
    { n: '01', title: 'Опишите задачу', text: 'Заполните форму: тема, объём, дедлайн, требования кафедры. Прикрепите методичку или образец.' },
    { n: '02', title: 'Согласуем детали', text: 'Свяжемся за 30 минут, уточним детали и назовём итоговую стоимость. Без скрытых доплат.' },
    { n: '03', title: 'Получите работу', text: 'Профильный специалист выполнит работу в срок. Бесплатные правки до полного соответствия требованиям.' },
  ]

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="min-h-screen bg-[#07070E] text-[#F0F0EC]">
        <Navbar />

        <main id="main-content">
          {/* Breadcrumb */}
          <div className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-12 pt-6">
            <nav aria-label="Breadcrumb">
              <ol className="flex items-center gap-1.5 text-[12px] text-[#6A6A88]">
                <li><Link href="/" className="hover:text-[#C5FF45] transition-colors">Главная</Link></li>
                <li><ChevronRight className="w-3 h-3" /></li>
                <li><Link href="/#services" className="hover:text-[#C5FF45] transition-colors">Услуги</Link></li>
                <li><ChevronRight className="w-3 h-3" /></li>
                <li className="text-[#F0F0EC]" aria-current="page">{h1.split('—')[0].trim()}</li>
              </ol>
            </nav>
          </div>

          {/* Hero */}
          <section className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-12 py-16 lg:py-24">
            <div className="max-w-[680px]">
              <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#C5FF45]/10 border border-[#C5FF45]/[.18] text-[#C5FF45] text-[11px] font-bold uppercase tracking-[.8px] mb-6">
                <span className="w-1.5 h-1.5 rounded-full bg-[#C5FF45] animate-pulse" />
                Профильный специалист
              </span>
              <h1 className="font-unbounded font-black leading-[1.1] tracking-[-2px] text-[clamp(32px,5vw,56px)] mb-5">
                {h1.includes('—') ? (
                  <>
                    <span className="text-[#F0F0EC]">{h1.split('—')[0].trim()}</span>
                    <span className="text-[#C5FF45]"> — {h1.split('—')[1].trim()}</span>
                  </>
                ) : (
                  <span className="text-[#F0F0EC]">{h1}</span>
                )}
              </h1>
              <p className="text-[17px] text-[#6A6A88] leading-[1.75] mb-8">{tagline}</p>
              <div className="flex flex-wrap gap-3">
                <Link href="/#order"
                  className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-[#C5FF45] text-[#07070E] font-black font-unbounded text-[13px] hover:bg-[#D4FF60] hover:shadow-[0_14px_36px_rgba(197,255,69,.28)] hover:-translate-y-0.5 transition-all">
                  Оставить заявку
                  <svg viewBox="0 0 16 16" fill="none" width="13" height="13">
                    <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </Link>
                <Link href="/contacts"
                  className="inline-flex items-center gap-2 px-8 py-4 rounded-full border border-white/10 text-[#F0F0EC] font-bold font-unbounded text-[13px] hover:border-white/20 hover:bg-white/5 transition-all">
                  Задать вопрос
                </Link>
              </div>
            </div>
          </section>

          {/* Key stats */}
          <div className="bg-[#0E0E1C] border-t border-b border-white/[.06]">
            <div className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-12 py-8">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-0 sm:divide-x divide-white/[.06]">
                {[
                  { value: price,       label: 'Начальная цена' },
                  { value: volume,      label: 'Объём работы' },
                  { value: uniqueness,  label: 'Уникальность' },
                  { value: '≤ 30 мин', label: 'Время ответа' },
                ].map(s => (
                  <div key={s.label} className="text-center sm:px-8">
                    <div className="font-unbounded font-black text-[#C5FF45] text-[clamp(24px,4vw,36px)] tracking-[-1.5px] leading-none mb-1.5">{s.value}</div>
                    <div className="text-[13px] text-[#6A6A88]">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* What's included */}
          <section className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-12 py-20">
            <span className="section-tag">// Состав</span>
            <h2 className="section-heading">Что входит в работу</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-10">
              {included.map((item) => (
                <div key={item}
                  className="flex items-start gap-3 bg-[#0E0E1C] border border-white/[.06] rounded-2xl p-4 hover:border-[#C5FF45]/[.18] transition-colors">
                  <CheckCircle className="w-4 h-4 text-[#C5FF45] flex-shrink-0 mt-0.5" />
                  <span className="text-[14px] text-[#E8E8E0] leading-snug">{item}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Guarantees */}
          <section className="bg-[#0E0E1C] border-t border-b border-white/[.06]">
            <div className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-12 py-20">
              <span className="section-tag">// Гарантии</span>
              <h2 className="section-heading">Наши обязательства</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mt-10">
                {guarantees.map(({ icon: Icon, title, text }) => (
                  <div key={title} className="bg-[#141428] border border-white/[.06] rounded-2xl p-6">
                    <div className="w-10 h-10 rounded-xl bg-[#C5FF45]/10 border border-[#C5FF45]/[.18] flex items-center justify-center mb-4">
                      <Icon className="w-5 h-5 text-[#C5FF45]" />
                    </div>
                    <div className="font-bold text-[15px] text-[#F0F0EC] mb-2">{title}</div>
                    <div className="text-[13px] text-[#6A6A88] leading-[1.65]">{text}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Process */}
          <section className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-12 py-20">
            <span className="section-tag">// Процесс</span>
            <h2 className="section-heading">Как мы работаем</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-10">
              {steps.map((s) => (
                <div key={s.n} className="relative">
                  <div className="font-unbounded font-black text-[#C5FF45]/10 text-[72px] leading-none mb-3 select-none">{s.n}</div>
                  <h3 className="font-bold text-[17px] text-[#F0F0EC] mb-2">{s.title}</h3>
                  <p className="text-[14px] text-[#6A6A88] leading-[1.7]">{s.text}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Price CTA */}
          <div className="bg-gradient-to-r from-[#C5FF45]/[.06] to-[#7C3AED]/[.06] border-t border-b border-[#C5FF45]/[.12]">
            <div className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-12 py-16 text-center">
              <p className="text-[#6A6A88] text-[13px] font-bold uppercase tracking-[1.2px] mb-3">Стоимость</p>
              <div className="font-unbounded font-black text-[#C5FF45] text-[clamp(36px,6vw,64px)] tracking-[-2px] leading-none mb-3">
                от {price}
              </div>
              <p className="text-[#6A6A88] text-[15px] mb-8">Точную цену называем после изучения задачи — до копейки, без скрытых доплат</p>
              <Link href="/#order"
                className="inline-flex items-center gap-2 px-10 py-4 rounded-full bg-[#C5FF45] text-[#07070E] font-black font-unbounded text-[13px] hover:bg-[#D4FF60] hover:shadow-[0_14px_40px_rgba(197,255,69,.3)] hover:-translate-y-0.5 transition-all">
                Оставить заявку — бесплатно
              </Link>
            </div>
          </div>

          {/* FAQ */}
          <section className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-12 py-20">
            <span className="section-tag">// FAQ</span>
            <h2 className="section-heading">Частые вопросы</h2>
            <div className="mt-10 space-y-4 max-w-[720px]">
              {faq.map(({ q, a }) => (
                <div key={q} className="bg-[#0E0E1C] border border-white/[.06] rounded-2xl p-6 hover:border-[#C5FF45]/[.15] transition-colors">
                  <h3 className="font-bold text-[15px] text-[#F0F0EC] mb-2">{q}</h3>
                  <p className="text-[14px] text-[#6A6A88] leading-[1.7]">{a}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Bottom CTA */}
          <section className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-12 pb-24">
            <div className="bg-[#141428] border border-white/[.06] rounded-3xl p-8 sm:p-12 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              <div>
                <h2 className="font-unbounded font-black text-[20px] sm:text-[24px] text-[#F0F0EC] tracking-[-0.5px] mb-2">
                  Готов начать?
                </h2>
                <p className="text-[#6A6A88] text-[14px]">Опиши задачу — ответим за 30 минут и согласуем детали</p>
              </div>
              <Link href="/#order"
                className="flex-shrink-0 inline-flex items-center gap-2 px-8 py-4 rounded-full bg-[#C5FF45] text-[#07070E] font-black font-unbounded text-[13px] hover:bg-[#D4FF60] hover:shadow-[0_14px_36px_rgba(197,255,69,.28)] hover:-translate-y-0.5 transition-all">
                Оставить заявку →
              </Link>
            </div>
          </section>
        </main>

        <Footer />
      </div>
    </>
  )
}
