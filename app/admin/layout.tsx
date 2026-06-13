'use client'

import { useSession } from 'next-auth/react'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect } from 'react'
import Link from 'next/link'
import { GraduationCap, LayoutDashboard, Package, Star, Users, LogOut, BookOpen, Newspaper, FolderOpen } from 'lucide-react'
import { PageLoader } from '@/components/ui/page-loader'
import { signOut } from 'next-auth/react'

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

  return (
    <div className="min-h-screen bg-[#0F0F1A] flex">
      {/* Sidebar */}
      <aside className="w-64 bg-[#0A0A14] border-r border-white/5 flex flex-col hidden md:flex">
        <div className="p-6 border-b border-white/5">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#6C3EF4] to-[#3B82F6] flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <span className="text-sm font-bold bg-gradient-to-r from-[#6C3EF4] to-[#3B82F6] bg-clip-text text-transparent">
              StudyAssist
            </span>
          </Link>
          <p className="text-white/30 text-xs mt-1">Панель администратора</p>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {adminNav.map((item) => {
            const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-[#6C3EF4]/20 text-white border border-[#6C3EF4]/30'
                    : 'text-white/50 hover:text-white hover:bg-white/5'
                }`}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t border-white/5">
          <button
            onClick={() => signOut({ callbackUrl: '/' })}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-white/50 hover:text-white hover:bg-white/5 transition-all w-full"
          >
            <LogOut className="w-4 h-4" />
            Выйти
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-hidden">
        {/* Mobile header */}
        <div className="md:hidden flex items-center justify-between px-4 py-3 bg-[#0A0A14] border-b border-white/5">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#6C3EF4] to-[#3B82F6] flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <span className="text-sm font-bold text-white">Admin</span>
          </Link>
          <div className="flex gap-2">
            {adminNav.map((item) => (
              <Link key={item.href} href={item.href}
                className={`p-2 rounded-lg ${pathname.startsWith(item.href) ? 'bg-[#6C3EF4]/20 text-white' : 'text-white/50'}`}>
                <item.icon className="w-4 h-4" />
              </Link>
            ))}
          </div>
        </div>
        <div className="h-full overflow-auto p-6">
          {children}
        </div>
      </main>
    </div>
  )
}
