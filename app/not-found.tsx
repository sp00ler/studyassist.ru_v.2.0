import Link from 'next/link'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#07070E] text-[#F0F0EC]">
      <Navbar />
      <main className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-12 py-32 text-center">
        <div className="font-unbounded font-black text-[#C5FF45]/10 text-[clamp(80px,20vw,180px)] leading-none select-none mb-6">
          404
        </div>
        <h1 className="font-unbounded font-black text-[clamp(22px,4vw,36px)] tracking-[-1px] mb-4">
          Страница не найдена
        </h1>
        <p className="text-[#6A6A88] text-[16px] mb-10">
          Возможно, ссылка устарела или страница была удалена
        </p>
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-[#C5FF45] text-[#07070E] font-black font-unbounded text-[13px] hover:bg-[#D4FF60] hover:shadow-[0_14px_36px_rgba(197,255,69,.28)] hover:-translate-y-0.5 transition-all"
          >
            На главную
          </Link>
          <Link
            href="/#order"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-full border border-white/10 text-[#F0F0EC] font-bold font-unbounded text-[13px] hover:border-white/20 hover:bg-white/5 transition-all"
          >
            Оставить заявку
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  )
}
