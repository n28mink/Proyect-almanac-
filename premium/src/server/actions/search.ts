'use server';

import { headers } from 'next/headers';
import { z } from 'zod';
import { getCatalog } from '../repositories/catalog';
import { clientKey, rateLimit } from '../security/rate-limit';

export interface SearchHit {
  id: string;
  slug: string;
  name: string;
  category: string;
  price: number;
  image: string;
}

const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

/** Búsqueda ligera por nombre, categoría, etiquetas y color (sin acentos). */
export async function searchProductsAction(query: string, locale: string): Promise<SearchHit[]> {
  const h = await headers();
  if (!rateLimit(`search:${clientKey(h)}`, 90, 60_000).ok) return [];
  const q = norm(z.string().trim().max(60).parse(query));
  const lang = z.enum(['es', 'en']).catch('es').parse(locale);
  if (q.length < 2) return [];
  const terms = q.split(/\s+/).filter(Boolean);
  const catalog = await getCatalog();

  return catalog
    .map((p) => {
      const hay = norm([p.name[lang], p.name.es, p.name.en, p.category, ...p.tags, ...p.color.map((c) => c[lang]), p.material[lang]].join(' '));
      const score = terms.reduce((s, t) => s + (hay.includes(t) ? (norm(p.name[lang]).includes(t) ? 3 : 1) : -100), 0);
      return { p, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 8)
    .map(({ p }) => ({ id: p.id, slug: p.slug, name: p.name[lang], category: p.category, price: p.price, image: p.thumbnail }));
}
