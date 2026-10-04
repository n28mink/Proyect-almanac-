import { categories, collectionsNav } from '@/config/taxonomy';
import { collections } from '@/content/collections';
import type { Locale } from '@/i18n/routing';
import { pick } from '@/domain/i18n';
import { baseCatalog } from '@/server/repositories/catalog';

export interface NavLink {
  href: string;
  label: string;
}

export interface NavData {
  /** Enlaces visibles en la cabecera (escritorio). */
  primary: NavLink[];
  /** Secciones grandes del menú a pantalla completa. */
  menuMain: NavLink[];
  menuTypes: NavLink[];
  menuAudience: NavLink[];
  featured: { href: string; label: string; image: string; blur?: string };
}

const bySlug = (slug: string) => categories.find((c) => c.slug === slug)!;

/** Categorías con al menos una pieza (las vacías no ensucian la navegación). */
function nonEmpty(slug: string): boolean {
  const cat = bySlug(slug);
  if (cat.slug === 'collections') return true;
  return baseCatalog().some((p) => p.categories.includes(slug));
}

export function getNavData(locale: Locale): NavData {
  const link = (slug: string): NavLink => ({ href: `/shop/${slug}`, label: pick(bySlug(slug).name, locale) });
  const featuredProduct = baseCatalog().find((p) => p.id === 'co11')!;
  const featuredImage = featuredProduct.images[0]!;
  const collectionsLink: NavLink = { href: '/collections', label: pick(collectionsNav.name, locale) };

  return {
    primary: [link('jewelry'), link('watches'), link('shirts'), collectionsLink, link('gifts')],
    menuMain: [link('new-arrivals'), link('jewelry'), link('watches'), link('shirts'), collectionsLink, link('gifts')],
    menuTypes: ['necklaces', 'earrings', 'rings', 'bracelets', 'accessories'].filter(nonEmpty).map(link),
    menuAudience: ['women', 'men'].filter(nonEmpty).map(link),
    featured: {
      href: `/collections/${collections[0]!.slug}`,
      label: pick(collections[0]!.name, locale),
      image: featuredImage.src,
      blur: featuredImage.blur,
    },
  };
}
