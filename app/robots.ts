import { MetadataRoute } from 'next'

const BASE_URL = process.env.NEXTAUTH_URL || 'https://studyassist.ru'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin/', '/dashboard/', '/api/', '/auth/'],
    },
    sitemap: `${BASE_URL}/sitemap.xml`,
  }
}
