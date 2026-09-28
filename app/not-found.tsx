import Link from 'next/link'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-desk dither">
      <Navbar />
      <main id="main-content" className="pt-10 pb-16 px-4 sm:px-6 lg:px-12">
        <div className="max-w-[720px] mx-auto">
          <div className="window">
            <div className="titlebar">
              <span className="truncate">ОШИБКА.EXE</span>
              <div className="flex items-center gap-1 flex-shrink-0" aria-hidden="true">
                <span className="titlebar-btn">_</span>
                <span className="titlebar-btn">□</span>
                <span className="titlebar-btn">×</span>
              </div>
            </div>
            <div className="bg-paper p-8 sm:p-14 text-center">
              <div className="font-mono font-bold text-title/15 text-[clamp(64px,16vw,140px)] leading-none select-none mb-4">
                404
              </div>
              <h1 className="font-display text-[clamp(20px,4vw,32px)] leading-[1.4] text-ink mb-4">
                Страница не найдена
              </h1>
              <p className="text-ink-soft text-base mb-9">
                Возможно, ссылка устарела или страница была удалена
              </p>
              <div className="flex items-center justify-center gap-3 flex-wrap">
                <Button asChild size="lg">
                  <Link href="/">На главную</Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link href="/#order">Оставить заявку</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
