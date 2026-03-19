import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const { pathname } = req.nextUrl

    // Защита admin роутов
    if (pathname.startsWith('/admin')) {
      if (!token) {
        return NextResponse.redirect(new URL('/auth/login', req.url))
      }
      if (!token.isAdmin) {
        // Проверяем ADMIN_SECRET из Basic Auth заголовка (fallback)
        const authHeader = req.headers.get('authorization')
        if (authHeader) {
          const base64Credentials = authHeader.split(' ')[1]
          const credentials = Buffer.from(base64Credentials, 'base64').toString('utf-8')
          const [, password] = credentials.split(':')
          if (password === process.env.ADMIN_SECRET) {
            return NextResponse.next()
          }
        }
        return NextResponse.redirect(new URL('/', req.url))
      }
    }

    // Защита dashboard
    if (pathname.startsWith('/dashboard')) {
      if (!token) {
        return NextResponse.redirect(new URL('/auth/login', req.url))
      }
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl
        // Для admin и dashboard требуем авторизацию
        if (pathname.startsWith('/admin') || pathname.startsWith('/dashboard')) {
          return !!token
        }
        return true
      },
    },
  }
)

export const config = {
  matcher: ['/admin/:path*', '/dashboard/:path*'],
}
