import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

interface AuthWindowProps {
  /** Window titlebar text — also the page's single H1. */
  title: string
  backHref?: string
  backLabel?: string
  children: React.ReactNode
}

/**
 * Shared "Win95 login dialog" chrome for /auth/* pages: teal desk background,
 * a centered small .window with a navy .titlebar, paper content area. Presentational
 * only — each page still owns its own form/state/logic.
 */
export function AuthWindow({ title, backHref = '/', backLabel = 'На главную', children }: AuthWindowProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-desk dither relative px-4 py-10">
      <Link
        href={backHref}
        className="absolute top-6 left-6 flex items-center gap-2 text-paper hover:text-accent transition-colors text-sm font-semibold"
      >
        <ArrowLeft className="w-4 h-4" aria-hidden="true" />
        {backLabel}
      </Link>

      <div className="w-full max-w-md">
        <div className="window pixel-shadow">
          <div className="titlebar">
            <h1 className="truncate">{title}</h1>
            <div className="flex gap-1 shrink-0" aria-hidden="true">
              <span className="titlebar-btn">_</span>
              <span className="titlebar-btn">□</span>
              <span className="titlebar-btn">×</span>
            </div>
          </div>
          <div className="bg-paper p-6 sm:p-8">{children}</div>
        </div>
      </div>
    </div>
  )
}
