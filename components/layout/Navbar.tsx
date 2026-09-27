'use client'

import { useState } from 'react'
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
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <header
      style={{ top: 'var(--yb-banner-h, 0px)' }}
      className="sticky left-0 right-0 z-40 bg-chrome border-b border-chrome-shadow shadow-[inset_0_1px_0_0_rgb(var(--chrome-light))]"
    >
      <nav className="max-w-[1200px] mx-auto px-3 sm:px-6">
        <div className="flex items-center justify-between h-16 md:h-[60px] gap-3">
          {/* Logo */}
          <Link
            href="/"
            className="font-sans font-bold text-[15px] sm:text-[18px] text-ink hover:text-title transition-colors shrink-0"
          >
            Study<span className="text-title">Assist</span>
          </Link>

          {/* Desktop nav: OS toolbar row */}
          <div className="hidden md:flex items-center gap-1 flex-1 justify-center">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href} className="btn-95 h-9 px-4 text-[13px] font-sans font-semibold">
                {link.label}
              </Link>
            ))}
          </div>

          {/* Desktop actions */}
          <div className="hidden md:flex items-center gap-2 shrink-0">
            {session ? (
              <>
                <Link href="/dashboard">
                  <button className="btn-95 h-9 px-4 text-[13px] inline-flex items-center gap-2">
                    <LayoutDashboard className="w-4 h-4" />
                    Личный кабинет
                  </button>
                </Link>
                {session.user.isAdmin && (
                  <Link href="/admin">
                    <button className="btn-95 h-9 px-3 text-[13px]">Админ</button>
                  </Link>
                )}
                <button
                  onClick={() => signOut()}
                  aria-label="Выйти из аккаунта"
                  className="btn-95 h-9 w-9 inline-flex items-center justify-center"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            ) : (
              <>
                <Link href="/auth/login">
                  <button className="btn-95 h-9 px-4 text-[13px] font-semibold">Войти</button>
                </Link>
                <Link href="/#order">
                  <button className="btn-95-primary h-9 px-5 text-[13px]">Заказать</button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile: CTA always visible + Start-menu-style burger */}
          <div className="flex md:hidden items-center gap-2">
            <Link href="/#order">
              <button className="btn-95-primary min-h-[44px] px-4 text-[13px]">Заказать</button>
            </Link>
            <button
              className="btn-95 min-w-[44px] min-h-[44px] inline-flex items-center justify-center"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label={mobileOpen ? 'Закрыть меню' : 'Открыть меню'}
              aria-expanded={mobileOpen}
              aria-controls="mobile-menu"
            >
              {mobileOpen ? <X className="w-5 h-5" aria-hidden="true" /> : <Menu className="w-5 h-5" aria-hidden="true" />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Start-menu-style dropdown */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            id="mobile-menu"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.15 }}
            className="md:hidden bg-chrome border-t border-chrome-shadow overflow-hidden"
          >
            <div className="px-3 py-3 space-y-1.5">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="btn-95 w-full min-h-[44px] flex items-center px-4 text-[14px] font-sans font-semibold justify-start"
                  onClick={() => setMobileOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              <div className="pt-2 mt-2 border-t border-chrome-shadow/40 space-y-1.5">
                {session ? (
                  <>
                    <Link href="/dashboard" onClick={() => setMobileOpen(false)}>
                      <button className="btn-95 w-full min-h-[44px] flex items-center gap-2 px-4 text-[14px] justify-start">
                        <LayoutDashboard className="w-4 h-4" />
                        Личный кабинет
                      </button>
                    </Link>
                    {session.user.isAdmin && (
                      <Link href="/admin" onClick={() => setMobileOpen(false)}>
                        <button className="btn-95 w-full min-h-[44px] flex items-center px-4 text-[14px] justify-start">
                          Админ
                        </button>
                      </Link>
                    )}
                    <button
                      className="btn-95 w-full min-h-[44px] flex items-center gap-2 px-4 text-[14px] justify-start"
                      onClick={() => {
                        signOut()
                        setMobileOpen(false)
                      }}
                    >
                      <LogOut className="w-4 h-4" />
                      Выйти
                    </button>
                  </>
                ) : (
                  <Link href="/auth/login" onClick={() => setMobileOpen(false)}>
                    <button className="btn-95 w-full min-h-[44px] flex items-center px-4 text-[14px] justify-start">
                      Войти
                    </button>
                  </Link>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
