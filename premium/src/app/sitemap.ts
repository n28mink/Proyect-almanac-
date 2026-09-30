import type { MetadataRoute } from 'next';
import { categories } from '@/config/taxonomy';
import { site } from '@/config/site';
import { collections } from '@/content/collections';
import { journal } from '@/content/journal';
import { legalDocs } from '@/content/legal';
import { routing } from '@/i18n/routing';
import { baseCatalog } from '@/server/repositories/catalog';

export default function sitemap(): MetadataRoute.Sitemap {
  const paths = [
    '/', '/shop', '/collections', '/journal', '/lookbook', '/about',
    ...categories.map((c) => `/shop/${c.slug}`),
    ...collections.map((c) => `/collections/${c.slug}`),
    ...journal.map((j) => `/journal/${j.slug}`),
    ...legalDocs.map((d) => `/legal/${d.slug}`),
    ...baseCatalog().map((p) => `/product/${p.slug}`),
  ];
  const url = (l: string, p: string) => `${site.url}/${l}${p === '/' ? '' : p}`;
  return paths.flatMap((p) =>
    routing.locales.map((locale) => ({
      url: url(locale, p),
      lastModified: new Date(),
      changeFrequency: p.startsWith('/product') ? ('weekly' as const) : ('daily' as const),
      priority: p === '/' ? 1 : p.startsWith('/product') ? 0.7 : 0.8,
      alternates: { languages: Object.fromEntries(routing.locales.map((l) => [l, url(l, p)])) },
    })),
  );
}
