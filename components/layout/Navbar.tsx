'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X, LogOut, LayoutDashboard } from 'lucide-react'

const navLinks = [
  { href: '/#services', label: 'Услуги' },
  { href: '/#pricing', label: 'Цены' },
  { href: '/portfolio', label: 'Примеры работ' },
  { href: '/blog', label: 'Блог' },
  { href: '/#reviews', label: 'Отзывы' },
]

// Service pages for internal linking (used in footer/SEO — not in main nav to keep it clean)
export const serviceLinks = [
  { href: '/kursovaya', label: 'Курсовая работа' },
  { href: '/diplom', label: 'Дипломная работа' },
  { href: '/referat', label: 'Реферат' },
]

export function Navbar() {
  const { data: session } = useSession()
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <motion.header
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      style={{ top: 'var(--yb-banner-h, 0px)' }}
      className={`sticky left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-[#07070E]/92 backdrop-blur-xl border-b border-white/[.06] shadow-[0_4px_24px_rgba(0,0,0,.5)]'
          : 'bg-[#07070E]/60 backdrop-blur-md border-b border-white/[.04]'
      }`}
    >
      <nav className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-12">
        <div className="flex items-center justify-between h-16 md:h-[72px]">

          {/* Logo */}
          <Link href="/" className="font-unbounded text-[17px] font-black tracking-[-0.3px] text-[#F0F0EC] hover:text-white transition-colors">
            Study<span className="text-[#C5FF45]">Assist</span>
          </Link>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-[#6A6A88] hover:text-[#F0F0EC] transition-colors duration-200 text-[14px] font-medium"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Desktop actions */}
          <div className="hidden md:flex items-center gap-3">
            {session ? (
              <>
                <Link href="/dashboard">
                  <button className="flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 text-[#F0F0EC] text-[13px] font-semibold hover:border-white/20 hover:bg-white/5 transition-all">
                    <LayoutDashboard className="w-4 h-4" />
                    Личный кабинет
                  </button>
                </Link>
                {session.user.isAdmin && (
                  <Link href="/admin">
                    <button className="px-3 py-2 rounded-full text-[#6A6A88] text-[13px] font-medium hover:text-[#F0F0EC] transition-colors">
                      Админ
                    </button>
                  </Link>
                )}
                <button
                  onClick={() => signOut()}
                  aria-label="Выйти из аккаунта"
                  className="p-2 rounded-full text-[#6A6A88] hover:text-[#F0F0EC] transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            ) : (
              <>
                <Link href="/auth/login">
                  <button className="px-5 py-2 rounded-full border border-white/10 text-[#F0F0EC] text-[13px] font-semibold hover:border-white/20 hover:bg-white/5 transition-all">
                    Войти
                  </button>
                </Link>
                <Link href="/#order">
                  <button className="px-5 py-2 rounded-full bg-[#C5FF45] text-[#07070E] text-[13px] font-bold font-unbounded hover:bg-[#D4FF60] hover:shadow-[0_8px_28px_rgba(197,255,69,.28)] hover:-translate-y-px transition-all active:scale-95">
                    Заказать →
                  </button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile burger */}
          <button
            className="md:hidden text-[#F0F0EC] p-2 rounded-lg hover:bg-white/8 transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? 'Закрыть меню' : 'Открыть меню'}
            aria-expanded={mobileOpen}
            aria-controls="mobile-menu"
          >
            {mobileOpen
              ? <X className="w-6 h-6" aria-hidden="true" />
              : <Menu className="w-6 h-6" aria-hidden="true" />}
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            id="mobile-menu"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="md:hidden bg-[#07070E]/98 backdrop-blur-xl border-b border-white/[.06]"
          >
            <div className="px-4 py-6 space-y-4 max-w-[1100px] mx-auto">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="block text-[#6A6A88] hover:text-[#F0F0EC] py-2 text-base font-medium transition-colors"
                  onClick={() => setMobileOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              <div className="pt-4 border-t border-white/[.06] space-y-3">
                {session ? (
                  <>
                    <Link href="/dashboard" onClick={() => setMobileOpen(false)}>
                      <button className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-full border border-white/10 text-[#F0F0EC] text-[14px] font-semibold hover:bg-white/5 transition-all">
                        <LayoutDashboard className="w-4 h-4" />
                        Личный кабинет
                      </button>
                    </Link>
                    <button
                      className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-full text-[#FF3B5C] text-[14px] font-semibold hover:bg-[#FF3B5C]/10 transition-all"
                      onClick={() => { signOut(); setMobileOpen(false) }}
                    >
                      <LogOut className="w-4 h-4" />
                      Выйти
                    </button>
                  </>
                ) : (
                  <>
                    <Link href="/auth/login" onClick={() => setMobileOpen(false)}>
                      <button className="w-full px-5 py-3 rounded-full border border-white/10 text-[#F0F0EC] text-[14px] font-semibold hover:bg-white/5 transition-all">
                        Войти
                      </button>
                    </Link>
                    <Link href="/#order" onClick={() => setMobileOpen(false)}>
                      <button className="w-full px-5 py-3 rounded-full bg-[#C5FF45] text-[#07070E] text-[14px] font-bold font-unbounded hover:bg-[#D4FF60] transition-all">
                        Заказать →
                      </button>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  )
}
