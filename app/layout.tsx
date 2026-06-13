import type { Metadata } from 'next'
import '@/app/globals.css'
import { SessionProvider } from '@/components/providers/SessionProvider'
import { Toaster } from '@/components/ui/toaster'
import { CookieBanner } from '@/components/CookieBanner'
import { MetrikaScript } from '@/components/MetrikaScript'
import { ChatWidget } from '@/components/ChatWidget'
import { ContactsFloat } from '@/components/ContactsFloat'
import { YandexBrowserBanner } from '@/components/YandexBrowserBanner'
import { MagicCursor } from '@/components/MagicCursor'

export const metadata: Metadata = {
  title: 'StudyAssist — Помощь студентам с учёбой | Курсовые, дипломные, рефераты',
  description:
    'Профессиональная помощь студентам: курсовые работы, дипломные, рефераты, лабораторные. Гарантия уникальности. Оплата после проверки. Быстро, качественно, конфиденциально.',
  keywords:
    'помощь студентам, написать курсовую, заказать курсовую работу, дипломная работа на заказ, реферат на заказ, лабораторная работа помощь, StudyAssist',
  authors: [{ name: 'StudyAssist' }],
  metadataBase: new URL(process.env.NEXTAUTH_URL || 'https://studyassist.ru'),
  openGraph: {
    type: 'website',
    locale: 'ru_RU',
    url: process.env.NEXTAUTH_URL || 'https://studyassist.ru',
    siteName: 'StudyAssist',
    title: 'StudyAssist — Помощь студентам с учёбой',
    description:
      'Профессиональная помощь студентам: курсовые, дипломные, рефераты. Гарантия уникальности. Оплата после проверки.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'StudyAssist — Помощь студентам',
    description: 'Курсовые, дипломные, рефераты. Гарантия уникальности.',
  },
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const metrikaId = process.env.NEXT_PUBLIC_METRIKA_ID

  return (
    <html lang="ru" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Unbounded:wght@400;700;900&family=Plus+Jakarta+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&family=JetBrains+Mono:wght@400;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans antialiased bg-[#07070E] text-[#F0F0EC] min-h-screen">
        <MagicCursor />
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[9999] focus:px-4 focus:py-2 focus:bg-[#C5FF45] focus:text-[#07070E] focus:rounded-full focus:text-sm focus:font-bold"
        >
          Перейти к основному содержанию
        </a>
        <YandexBrowserBanner />
        <SessionProvider>
          {children}
          <Toaster />
          <CookieBanner />
          <ChatWidget />
          <ContactsFloat />
          {metrikaId && <MetrikaScript metrikaId={metrikaId} />}
        </SessionProvider>
      </body>
    </html>
  )
}
