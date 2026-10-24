import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/admin/', '/dashboard', '/passport', '/profile', '/checkin/', '/verify/'],
      },
    ],
    sitemap: 'https://impactmap.vercel.app/sitemap.xml',
  }
}
