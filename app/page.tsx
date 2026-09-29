import type { Metadata } from 'next'
import Script from 'next/script'
import { cookies } from 'next/headers'
import { HomeExperience } from '@/components/home/HomeExperience'
import { GATE_SEEN_COOKIE } from '@/components/home/gate-cookie'
import { PortfolioPreviewSection } from '@/components/home/PortfolioPreviewSection'
import { BlogPreviewSection } from '@/components/home/BlogPreviewSection'
import { faqs } from '@/components/home/faq-data'

const HOME_TITLE = 'StudyAssist — курсовые, дипломы, рефераты | Консультации'
const HOME_DESCRIPTION =
  'Помощь и консультации по курсовым, дипломным и рефератам. Профильный специалист, ответ за 30 минут, оплата после согласования. Конфиденциально.'

export const metadata: Metadata = {
  title: HOME_TITLE,
  description: HOME_DESCRIPTION,
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: HOME_TITLE,
    description: HOME_DESCRIPTION,
    url: '/',
  },
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': 'https://studyassist.ru/#organization',
      name: 'StudyAssist',
      url: 'https://studyassist.ru',
      logo: 'https://studyassist.ru/logo.png',
      contactPoint: {
        '@type': 'ContactPoint',
        email: 'support@studyassist.ru',
        contactType: 'customer support',
        availableLanguage: 'Russian',
      },
      sameAs: [],
    },
    {
      '@type': 'WebSite',
      '@id': 'https://studyassist.ru/#website',
      url: 'https://studyassist.ru',
      name: 'StudyAssist',
      publisher: { '@id': 'https://studyassist.ru/#organization' },
      // ponytail SEO-6: no SearchAction — the site has no ?q= search feature,
      // so a sitelinks-search-box markup here would be fake structured data.
    },
    {
      '@type': 'Service',
      '@id': 'https://studyassist.ru/#service',
      name: 'Консультации и помощь в подготовке учебных работ',
      provider: { '@id': 'https://studyassist.ru/#organization' },
      areaServed: 'RU',
      // Prices mirror components/home/PricingSection.tsx exactly — do not
      // invent figures here; update both together if pricing changes.
      hasOfferCatalog: {
        '@type': 'OfferCatalog',
        name: 'Услуги StudyAssist',
        itemListElement: [
          { '@type': 'Offer', name: 'Реферат / Эссе', price: '1000', priceCurrency: 'RUB', url: 'https://studyassist.ru/referat' },
          { '@type': 'Offer', name: 'Курсовая работа', price: '3500', priceCurrency: 'RUB', url: 'https://studyassist.ru/kursovaya' },
          { '@type': 'Offer', name: 'ВКР / Диплом', price: '15000', priceCurrency: 'RUB', url: 'https://studyassist.ru/diplom' },
          { '@type': 'Offer', name: 'Лабораторная работа', price: '1000', priceCurrency: 'RUB', url: 'https://studyassist.ru/laboratornaya' },
          { '@type': 'Offer', name: 'Отчёт по практике', price: '5000', priceCurrency: 'RUB', url: 'https://studyassist.ru/otchet-po-praktike' },
          { '@type': 'Offer', name: 'УИР', price: '7000', priceCurrency: 'RUB' },
          { '@type': 'Offer', name: 'Презентация', price: '1200', priceCurrency: 'RUB', url: 'https://studyassist.ru/prezentatsiya' },
          { '@type': 'Offer', name: 'Чертёж', price: '3000', priceCurrency: 'RUB', url: 'https://studyassist.ru/chertezhi' },
          { '@type': 'Offer', name: 'Решение задачи', price: '550', priceCurrency: 'RUB', url: 'https://studyassist.ru/reshenie-zadach' },
          { '@type': 'Offer', name: 'Контрольная работа', price: '750', priceCurrency: 'RUB', url: 'https://studyassist.ru/kontrolnaya' },
        ],
      },
    },
    {
      '@type': 'FAQPage',
      '@id': 'https://studyassist.ru/#faq',
      // ponytail SEO-3: mirrors components/home/FaqSection.tsx's exported
      // `faqs` array word-for-word — never hand-edit this separately.
      mainEntity: faqs.map((faq) => ({
        '@type': 'Question',
        name: faq.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: faq.answer,
        },
      })),
    },
  ],
}

export default function HomePage({
  searchParams,
}: {
  searchParams: { go?: string }
}) {
  // `?go=order` / `?go=site` (used by links that would otherwise dump the
  // user on the RetroGate — dashboard "Новая заявка", "На сайт", service
  // pages, etc.) skip the gate and open straight on the site view.
  const go = searchParams.go
  const gateSeen = cookies().get(GATE_SEEN_COOKIE)?.value === '1'
  const initialPhase = go === 'order' || go === 'site' || gateSeen ? 'site' : 'gate'
  const initialScrollTarget = go === 'order' ? 'order' : undefined

  return (
    <>
      <Script
        id="json-ld-homepage"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <HomeExperience
        portfolioSection={<PortfolioPreviewSection />}
        blogSection={<BlogPreviewSection />}
        initialPhase={initialPhase}
        initialScrollTarget={initialScrollTarget}
      />
    </>
  )
}
