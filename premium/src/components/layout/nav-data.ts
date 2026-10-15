import { categories, collectionsNav } from '@/config/taxonomy';
import { collections } from '@/content/collections';
import type { Locale } from '@/i18n/routing';
import { pick } from '@/domain/i18n';
import { toCardData } from '@/lib/card-data';
import { baseCatalog } from '@/server/repositories/catalog';

export interface NavLink {
  href: string;
  label: string;
  /** Clave de categoría: elige el icono y el texto de apoyo en el menú Productos. */
  slug?: string;
  blurb?: string;
  /** Subniveles del desplegable de la categoría. */
  children?: NavLink[];
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
  const link = (slug: string): NavLink => ({ href: `/shop/${slug}`, label: pick(bySlug(slug).name, locale), slug, blurb: pick(bySlug(slug).blurb, locale) });
  const featuredProduct = baseCatalog().find((p) => p.id === 'co11')!;
  const featuredImage = featuredProduct.images[0]!;
  const collectionsLink: NavLink = { href: '/collections', label: pick(collectionsNav.name, locale), slug: 'collections', blurb: locale === 'es' ? 'Cápsulas con una historia propia.' : 'Capsules with a story of their own.' };

  const es = locale === 'es';
  const catalog = baseCatalog();
  const finishName: Record<string, string> = es
    ? { gold: 'Dorados', silver: 'Plateados', rose: 'Oro rosado', mixed: 'Dos tonos' }
    : { gold: 'Gold tone', silver: 'Silver tone', rose: 'Rose gold', mixed: 'Two-tone' };

  // Desplegables propios de cada categoría.
  const jewelry: NavLink = { ...link('jewelry'), children: ['necklaces', 'earrings', 'rings', 'bracelets'].filter(nonEmpty).map(link) };
  const finishes = [...new Set(catalog.filter((x) => x.category === 'watches').map((x) => x.finish).filter(Boolean))] as string[];
  const watches: NavLink = {
    ...link('watches'),
    children: [
      ...finishes.map((f) => ({ href: `/shop/watches?finish=${f}`, label: finishName[f] ?? f })),
      { href: '/shop/men', label: es ? 'Para él' : 'For him' },
    ],
  };
  const colors = new Map<string, string>();
  for (const x of catalog.filter((c) => c.category === 'shirts')) for (const g of toCardData(x, locale).garmentColors) colors.set(g.key, g.label);
  const shirts: NavLink = { ...link('shirts'), children: [...colors].map(([key, label]) => ({ href: `/shop/shirts?color=${key}`, label })) };
  const collectionsMenu: NavLink = { ...collectionsLink, children: collections.map((c) => ({ href: `/collections/${c.slug}`, label: pick(c.name, locale) })) };
  const gifts: NavLink = { ...link('gifts-for-her'), children: [{ href: '/shop/gifts', label: es ? 'Todos los regalos' : 'All gifts' }, { href: '/shop/new-arrivals', label: pick(bySlug('new-arrivals').name, locale) }] };

  return {
    primary: [jewelry, watches, shirts, collectionsMenu, gifts],
    menuMain: [link('new-arrivals'), link('jewelry'), link('watches'), link('shirts'), collectionsLink, link('gifts-for-her')],
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
