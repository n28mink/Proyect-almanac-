import type { MetadataRoute } from 'next';
import { site } from '@/config/site';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/api/', '/*/admin', '/*/account', '/*/checkout', '/*/login', '/*/register', '/*/wishlist'] }],
    sitemap: `${site.url}/sitemap.xml`,
    host: site.url,
  };
}
