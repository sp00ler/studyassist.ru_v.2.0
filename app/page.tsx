import type { Metadata } from 'next'
import Script from 'next/script'
import { UrgencyBar } from '@/components/layout/UrgencyBar'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { HeroSection } from '@/components/home/HeroSection'
import { StatsSection } from '@/components/home/StatsSection'
import { ServicesSection } from '@/components/home/ServicesSection'
import { HowItWorks } from '@/components/home/HowItWorks'
import { PricingSection } from '@/components/home/PricingSection'
import { ReviewsSection } from '@/components/home/ReviewsSection'
import { OrderForm } from '@/components/home/OrderForm'
import { FaqSection } from '@/components/home/FaqSection'

export const metadata: Metadata = {
  title: 'StudyAssist — Образовательные консультации для студентов | Помощь в учёбе онлайн',
  description:
    'Профессиональные консультации для студентов: объяснение тем, подбор материалов и литературы, помощь в подготовке к экзаменам. Быстро, качественно, конфиденциально.',
  keywords:
    'консультации для студентов, подбор учебных материалов, помощь в учёбе, подготовка к экзаменам, образовательные консультации, StudyAssist',
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
          name: 'Как быстро можно получить консультацию?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Консультация по большинству предметов доступна в течение 30–60 минут после согласования деталей запроса.',
          },
        },
        {
          '@type': 'Question',
          name: 'Какие предметы вы охватываете?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Мы консультируем по широкому кругу дисциплин: математика, экономика, право, IT, гуманитарные науки и другие.',
          },
        },
        {
          '@type': 'Question',
          name: 'Когда нужно платить?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Стоимость согласовывается до начала работы. Оплата производится после согласования всех условий.',
          },
        },
        {
          '@type': 'Question',
          name: 'Можно ли задать уточняющие вопросы?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Да, наши специалисты готовы ответить на дополнительные вопросы в рамках темы консультации.',
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
      <UrgencyBar />
      <Navbar />
      <main id="main-content">
        <HeroSection />
        <StatsSection />
        <ServicesSection />
        <HowItWorks />
        <PricingSection />
        <ReviewsSection />
        <OrderForm />
        <FaqSection />
      </main>
      <Footer />
    </>
  )
}
