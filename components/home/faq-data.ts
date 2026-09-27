// Single source of truth for the FAQ content shown in components/home/FaqSection.tsx
// and mirrored into the FAQPage JSON-LD in app/page.tsx. Kept in its own plain
// (non-'use client') module because FaqSection.tsx is a Client Component —
// importing a value export from a 'use client' file into a Server Component
// resolves to an opaque client reference there, not the real array, so the
// data must live outside that boundary for both sides to read the same thing.
export const faqs = [
  {
    question: 'Как быстро вы отвечаете на заявку?',
    answer:
      'В течение 30 минут после заявки мы выходим на связь, уточняем детали и называем стоимость. В большинстве случаев приступаем к работе в тот же день.',
  },
  {
    question: 'Какие предметы и типы работ вы охватываете?',
    answer:
      'Практически любые дисциплины: математика, физика, химия, право, экономика, программирование, психология, медицина, история и другие. Курсовые, дипломы, рефераты, лабораторные, отчёты по практике. Если сомневаетесь — напишите, уточним.',
  },
  {
    question: 'Когда нужно платить?',
    answer:
      'Только после того, как мы согласовали объём работы и стоимость. Предоплаты «на удачу» нет.',
  },
  {
    question: 'Можно ли задать вопросы после того, как работа готова?',
    answer:
      'Да. Если что-то осталось непонятным или преподаватель попросил доработку — пишите, разберёмся. Мы не пропадаем после оплаты.',
  },
  {
    question: 'Это конфиденциально?',
    answer:
      'Полностью. Мы не передаём данные о заявках и работах третьим лицам — информация остаётся только у нас.',
  },
]
