import type { Metadata } from 'next'
import Script from 'next/script'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { HeroSection } from '@/components/home/HeroSection'
import { HowItWorks } from '@/components/home/HowItWorks'
import { ServicesSection } from '@/components/home/ServicesSection'
import { PricingSection } from '@/components/home/PricingSection'
import { OrderForm } from '@/components/home/OrderForm'
import { ReviewsSection } from '@/components/home/ReviewsSection'
import { FaqSection } from '@/components/home/FaqSection'

export const metadata: Metadata = {
  title: 'StudyAssist — Помощь студентам с учёбой | Курсовые, дипломные, рефераты',
  description:
    'Профессиональная помощь студентам: курсовые работы, дипломные, рефераты, лабораторные. Гарантия уникальности. Оплата после проверки. Быстро, качественно, конфиденциально.',
  keywords:
    'помощь студентам, написать курсовую, заказать курсовую работу, дипломная работа на заказ, реферат на заказ, лабораторная работа помощь, StudyAssist',
  alternates: {
    canonical: '/',
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
      potentialAction: {
        '@type': 'SearchAction',
        target: 'https://studyassist.ru/?q={search_term_string}',
        'query-input': 'required name=search_term_string',
      },
    },
    {
      '@type': 'AggregateRating',
      '@id': 'https://studyassist.ru/#rating',
      itemReviewed: { '@id': 'https://studyassist.ru/#organization' },
      ratingValue: '5',
      bestRating: '5',
      worstRating: '1',
      ratingCount: '1000',
      reviewCount: '1000',
    },
    {
      '@type': 'FAQPage',
      '@id': 'https://studyassist.ru/#faq',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'Как быстро вы выполняете работы?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Срок выполнения зависит от сложности. Рефераты — от нескольких часов, курсовые — 1-5 дней, дипломные — 5-14 дней.',
          },
        },
        {
          '@type': 'Question',
          name: 'Гарантируете ли вы уникальность?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Да, гарантируем уникальность минимум 80% по системе Антиплагиат.',
          },
        },
        {
          '@type': 'Question',
          name: 'Когда нужно платить?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Оплата только после того, как вы получили и проверили работу. Никаких предоплат.',
          },
        },
        {
          '@type': 'Question',
          name: 'Можно ли вносить правки?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Да, бесплатные правки в течение 3 дней после сдачи работы.',
          },
        },
        {
          '@type': 'Question',
          name: 'Конфиденциально ли это?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Да, все данные защищены и не передаются третьим лицам.',
          },
        },
      ],
    },
  ],
}

export default function HomePage() {
  return (
    <>
      <Script
        id="json-ld-homepage"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Navbar />
      <main>
        <HeroSection />
        <HowItWorks />
        <ServicesSection />
        <PricingSection />
        <OrderForm />
        <ReviewsSection />
        <FaqSection />
      </main>
      <Footer />
    </>
  )
}
