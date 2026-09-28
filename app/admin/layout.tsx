'use client'

import { useSession } from 'next-auth/react'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect } from 'react'
import Link from 'next/link'
import { LayoutDashboard, Package, Star, Users, LogOut, BookOpen, FolderOpen, Wallet } from 'lucide-react'
import { PageLoader } from '@/components/ui/page-loader'
import { signOut } from 'next-auth/react'
import { cn } from '@/lib/utils'

const adminNav = [
  { href: '/admin', label: 'Дашборд', icon: LayoutDashboard, exact: true },
  { href: '/admin/orders', label: 'Заявки', icon: Package },
  { href: '/admin/reviews', label: 'Отзывы', icon: Star },
  { href: '/admin/users', label: 'Пользователи', icon: Users },
  { href: '/admin/posts', label: 'Блог и новости', icon: BookOpen },
  { href: '/admin/portfolio', label: 'Портфолио', icon: FolderOpen },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login')
    } else if (status === 'authenticated' && !session?.user?.isAdmin) {
      router.push('/')
    }
  }, [status, session, router])

  if (status === 'loading') {
    return <PageLoader />
  }

  if (!session?.user?.isAdmin) return null

  const navItems = session.user.isSuperAdmin
    ? [...adminNav, { href: '/admin/payments', label: 'Платежи', icon: Wallet }]
    : adminNav

  return (
    <div className="min-h-screen bg-desk dither flex">
      {/* Sidebar */}
      <aside className="w-64 bg-chrome border-r border-chrome-shadow flex-col hidden md:flex">
        <div className="p-4 border-b border-chrome-shadow">
          <Link href="/" className="font-display text-[15px] text-ink hover:text-title transition-colors">
            Study<span className="text-title">Assist</span>
          </Link>
          <p className="text-ink-soft text-xs mt-1 font-mono">Панель администратора</p>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => {
            const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'w-full h-11 min-h-[44px] px-3 flex items-center gap-3 text-[11px] font-display justify-start',
                  isActive ? 'btn-95-primary' : 'btn-95 text-ink-soft hover:text-ink'
                )}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="p-3 border-t border-chrome-shadow">
          <button
            onClick={() => signOut({ callbackUrl: '/' })}
            className="btn-95 w-full h-11 min-h-[44px] px-3 flex items-center gap-3 text-[11px] font-display justify-start text-danger hover:bg-danger hover:text-white"
          >
            <LogOut className="w-4 h-4" />
            Выйти
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-hidden flex flex-col">
        {/* Mobile header */}
        <div className="md:hidden flex items-center justify-between px-3 py-2 gap-2 bg-chrome border-b border-chrome-shadow">
          <Link href="/" className="font-display text-[13px] text-ink shrink-0">
            Study<span className="text-title">Assist</span>
          </Link>
          <div className="flex gap-1 overflow-x-auto">
            {navItems.map((item) => {
              const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href)
              return (
                <Link key={item.href} href={item.href}
                  className={cn('min-w-[44px] min-h-[44px] flex items-center justify-center shrink-0', isActive ? 'btn-95-primary' : 'btn-95 text-ink-soft')}>
                  <item.icon className="w-4 h-4" />
                </Link>
              )
            })}
          </div>
        </div>
        <div className="flex-1 overflow-auto p-4 sm:p-6">
          {children}
        </div>
      </main>
    </div>
  )
}
