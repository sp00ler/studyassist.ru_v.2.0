import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

// ponytail: hardcoded list, move to DB/env if it starts changing.
export const SUPER_ADMIN_EMAILS = ['support@studyassist.ru']

export function isSuperAdminEmail(email?: string | null): boolean {
  if (!email) return false
  const normalized = email.trim().toLowerCase()
  return SUPER_ADMIN_EMAILS.some((e) => e.trim().toLowerCase() === normalized)
}

/**
 * Loads the acting user from the DB by session.user.id and returns it
 * only if they are a super-admin (isAdmin === true && isSuperAdminEmail(email)).
 * Otherwise returns a 403 NextResponse to send back to the client.
 */
export async function requireSuperAdmin(): Promise<
  | { user: { id: string; email: string; isAdmin: boolean }; error: null }
  | { user: null; error: NextResponse }
> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return { user: null, error: NextResponse.json({ error: 'Доступ запрещён' }, { status: 403 }) }
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, email: true, isAdmin: true },
  })

  if (!dbUser || !dbUser.isAdmin || !isSuperAdminEmail(dbUser.email)) {
    return {
      user: null,
      error: NextResponse.json({ error: 'Доступ запрещён: требуются права главного администратора' }, { status: 403 }),
    }
  }

  return { user: dbUser, error: null }
}
