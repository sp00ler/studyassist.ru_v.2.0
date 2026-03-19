import { DefaultSession } from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      isAdmin: boolean
      phone?: string | null
    } & DefaultSession['user']
  }

  interface User {
    id: string
    isAdmin: boolean
    phone?: string | null
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    isAdmin: boolean
    phone?: string | null
  }
}
