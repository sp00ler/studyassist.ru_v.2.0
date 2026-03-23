import type { Metadata } from 'next'
import Script from 'next/script'
import '@/app/globals.css'
import { SessionProvider } from '@/components/providers/SessionProvider'
import { Toaster } from '@/components/ui/toaster'

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
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'StudyAssist — Помощь студентам',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'StudyAssist — Помощь студентам',
    description: 'Курсовые, дипломные, рефераты. Гарантия уникальности.',
    images: ['/og-image.png'],
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
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans antialiased bg-[#0F0F1A] text-[#F1F5F9] min-h-screen">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[9999] focus:px-4 focus:py-2 focus:bg-[#6C3EF4] focus:text-white focus:rounded-lg focus:text-sm focus:font-medium"
        >
          Перейти к основному содержанию
        </a>
        <SessionProvider>
          {children}
          <Toaster />
        </SessionProvider>

        {/* Yandex Metrika */}
        {metrikaId && (
          <>
            <Script
              id="yandex-metrika"
              strategy="afterInteractive"
              dangerouslySetInnerHTML={{
                __html: `
                  (function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
                  m[i].l=1*new Date();
                  for (var j = 0; j < document.scripts.length; j++) {if (document.scripts[j].src === r) { return; }}
                  k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})
                  (window, document, "script", "https://mc.yandex.ru/metrika/tag.js", "ym");
                  ym(${metrikaId}, "init", {
                    clickmap:true,
                    trackLinks:true,
                    accurateTrackBounce:true,
                    webvisor:true
                  });
                `,
              }}
            />
            <noscript>
              <div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`https://mc.yandex.ru/watch/${metrikaId}`}
                  style={{ position: 'absolute', left: '-9999px' }}
                  alt=""
                />
              </div>
            </noscript>
          </>
        )}
      </body>
    </html>
  )
}
