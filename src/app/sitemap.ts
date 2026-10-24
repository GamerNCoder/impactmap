import type { MetadataRoute } from 'next'

const base = 'https://impactmap.vercel.app'
const paths = ['', '/opportunities', '/impact', '/trust', '/about', '/privacy', '/safety', '/accessibility', '/security', '/attributions', '/pilot', '/demo']

export default function sitemap(): MetadataRoute.Sitemap {
  return paths.map((path) => ({
    url: `${base}${path}`,
    lastModified: new Date(),
    changeFrequency: path === '/opportunities' ? 'daily' : 'weekly',
    priority: path === '' ? 1 : 0.6,
  }))
}
