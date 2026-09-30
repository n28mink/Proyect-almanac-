import type { MetadataRoute } from 'next';
import { site } from '@/config/site';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: '*', allow: '/', // El panel de administración no se lista aquí a propósito (sería revelar su ruta); se protege con login y `noindex`.
    disallow: ['/api/', '/*/checkout', '/*/wishlist'] }],
    sitemap: `${site.url}/sitemap.xml`,
    host: site.url,
  };
}
