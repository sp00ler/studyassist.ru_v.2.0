import type { Metadata } from 'next'
import { ServicePage, type ServiceFAQ } from '@/components/service/ServicePage'

export const metadata: Metadata = {
  title: 'Реферат на заказ — от 1 000 ₽ | StudyAssist',
  description:
    'Заказать реферат у профильного специалиста. Оформление по ГОСТ, уникальность от 70%, список литературы. Ответ за 30 минут. Без предоплаты.',
  alternates: { canonical: '/referat' },
  openGraph: {
    title: 'Реферат на заказ — от 1 000 ₽ | StudyAssist',
    description:
      'Заказать реферат у профильного специалиста. Оформление по ГОСТ, уникальность от 70%, список литературы. Ответ за 30 минут. Без предоплаты.',
    url: 'https://studyassist.ru/referat',
  },
}

const faq: ServiceFAQ[] = [
  {
    q: 'Сколько стоит написать реферат?',
    a: 'От 1 000 ₽. Точная стоимость зависит от объёма, предмета и срочности. Называем итоговую цену после изучения задания — без скрытых доплат.',
  },
  {
    q: 'За сколько времени напишете реферат?',
    a: 'Срочные рефераты — за 1 день. Плановые — за 2–4 дня. Конкретный срок согласовываем при заказе.',
  },
  {
    q: 'Какую уникальность гарантируете?',
    a: 'От 70% по Антиплагиат и Text.ru. При необходимости можем обеспечить более высокий показатель — уточните при заказе.',
  },
  {
    q: 'Нужна ли предоплата?',
    a: 'Нет. Сначала согласовываем все детали и стоимость, затем оплата. Никаких авансов.',
  },
  {
    q: 'Что нужно предоставить для заказа?',
    a: 'Тему реферата, предмет, объём (количество страниц), дедлайн и требования (если есть). Методичку или образец — приветствуется.',
  },
]

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Service',
      '@id': 'https://studyassist.ru/referat/#service',
      name: 'Реферат на заказ',
      description: 'Помощь в подготовке реферата профильным специалистом. Оформление по ГОСТ, уникальность от 70%, список литературы, бесплатные правки.',
      provider: { '@type': 'Organization', name: 'StudyAssist', url: 'https://studyassist.ru' },
      offers: {
        '@type': 'Offer',
        price: '1000',
        priceCurrency: 'RUB',
        availability: 'https://schema.org/InStock',
        url: 'https://studyassist.ru/referat',
      },
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Главная', item: 'https://studyassist.ru' },
        { '@type': 'ListItem', position: 2, name: 'Услуги', item: 'https://studyassist.ru/#services' },
        { '@type': 'ListItem', position: 3, name: 'Реферат', item: 'https://studyassist.ru/referat' },
      ],
    },
    {
      '@type': 'FAQPage',
      mainEntity: faq.map(({ q, a }) => ({
        '@type': 'Question',
        name: q,
        acceptedAnswer: { '@type': 'Answer', text: a },
      })),
    },
  ],
}

export default function ReferatPage() {
  return (
    <ServicePage
      slug="referat"
      h1="Реферат на заказ — от 1 000 ₽"
      tagline="Профильный специалист поможет подготовить реферат по вашей теме и требованиям. Грамотно, по ГОСТ, с актуальными источниками. Уникальность от 70%, правки бесплатно."
      price="1 000 ₽"
      volume="10–20 стр."
      uniqueness="≥ 70%"
      deadline="1 дня"
      included={[
        'Подбор актуальных источников по теме',
        'Написание по методическим требованиям',
        'Оформление по ГОСТ 7.32',
        'Список литературы — 10–15 источников',
        'Введение и заключение',
        'Содержание и титульный лист',
        'Антиплагиат — уникальность от 70%',
        'Бесплатные правки до принятия',
      ]}
      faq={faq}
      jsonLd={jsonLd}
    />
  )
}
