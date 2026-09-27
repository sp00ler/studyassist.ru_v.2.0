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

const SITE_TITLE = 'StudyAssist — курсовые, дипломы, рефераты | Консультации'
const SITE_DESCRIPTION =
  'Помощь и консультации по курсовым, дипломным и рефератам. Профильный специалист, ответ за 30 минут, оплата после согласования. Конфиденциально.'

export const metadata: Metadata = {
  title: {
    default: SITE_TITLE,
    // No-op template: every route already writes its own full "X | StudyAssist"
    // title, so this only supplies the fallback above — it must not append a
    // second brand suffix.
    template: '%s',
  },
  description: SITE_DESCRIPTION,
  authors: [{ name: 'StudyAssist' }],
  metadataBase: new URL(process.env.NEXTAUTH_URL || 'https://studyassist.ru'),
  openGraph: {
    type: 'website',
    locale: 'ru_RU',
    url: process.env.NEXTAUTH_URL || 'https://studyassist.ru',
    siteName: 'StudyAssist',
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
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
    <html lang="ru">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* Vintage OS type: Pixelify Sans (display), Golos Text (body), JetBrains Mono
            (prices/system captions). css2 serves Cyrillic subsets automatically for
            families that support them (Pixelify Sans + Golos Text both do). */}
        <link
          href="https://fonts.googleapis.com/css2?family=Pixelify+Sans:wght@400..700&family=Golos+Text:wght@400;500;600;700&family=JetBrains+Mono:wght@400;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans antialiased bg-desk text-ink min-h-screen">
        <MagicCursor />
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[9999] focus:bg-chrome focus:text-ink focus:border focus:border-black focus:shadow-[inset_1px_1px_0_0_#fff,inset_-1px_-1px_0_0_#808080] focus:px-4 focus:py-2 focus:text-sm focus:font-bold focus:outline focus:outline-2 focus:outline-dotted focus:outline-offset-2 focus:outline-black"
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
