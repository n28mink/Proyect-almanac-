import type { Metadata } from 'next';
import { localeFormats, site } from '@/config/site';
import { variantPrice, type Product } from '@/domain/catalog';
import { pick } from '@/domain/i18n';
import { locales, type Locale } from '@/i18n/routing';

const DESC_MIN = 120;
const DESC_MAX = 160;
const DESC_TAILS: Record<Locale, string[]> = {
  es: ['Pedidos por WhatsApp en Venezuela.', 'Clover, accesorios y prendas elegidos uno a uno.', 'Atención personal y entrega en Venezuela.'],
  en: ['Orders via WhatsApp in Venezuela.', 'Clover, accessories and apparel chosen one by one.', 'Personal service and delivery in Venezuela.'],
};

/** Deja la metadescripción entre 120 y 160 caracteres: recorta en una palabra o completa con datos de la tienda. */
export function fitDescription(text: string, locale: Locale): string {
  let d = text.replace(/\s+/g, ' ').trim();
  if (d.length > DESC_MAX) {
    d = d.slice(0, DESC_MAX - 1).replace(/\s+\S*$/, '').replace(/[\s,;:.\-–—]+$/, '') + '…';
    return d;
  }
  if (d.length >= DESC_MIN) return d;
  if (!/[.!?…]$/.test(d)) d += '.';
  const tails = DESC_TAILS[locale];
  const combos = [[0], [1], [2], [0, 1], [0, 2], [1, 2], [0, 1, 2]]
    .map((c) => `${d} ${c.map((i) => tails[i]).join(' ')}`)
    .sort((a, b) => a.length - b.length);
  return combos.find((c) => c.length >= DESC_MIN && c.length <= DESC_MAX) ?? combos[combos.length - 1] ?? d;
}

const url = (locale: Locale, path: string) => `${site.url}/${locale}${path === '/' ? '' : path}`;

interface MetaInput {
  locale: Locale;
  /** Ruta sin prefijo de idioma, p. ej. "/shop/rings". */
  path: string;
  title: string;
  description: string;
  image?: string;
  noindex?: boolean;
  type?: 'website' | 'article';
}

/** Metadata dinámica: canonical, hreflang (+x-default), Open Graph y Twitter por idioma. */
export function buildMetadata({ locale, path, title, description: rawDescription, image = '/og-default.jpg', noindex, type = 'website' }: MetaInput): Metadata {
  const description = fitDescription(rawDescription, locale);
  const languages = Object.fromEntries(locales.map((l) => [l, url(l, path)]));
  const og = image.startsWith('http') ? image : `${site.url}${image}`;
  return {
    title,
    description,
    metadataBase: new URL(site.url),
    alternates: { canonical: url(locale, path), languages: { ...languages, 'x-default': url('en', path) } },
    robots: noindex ? { index: false, follow: false } : { index: true, follow: true },
    openGraph: {
      type,
      title,
      description,
      url: url(locale, path),
      siteName: site.name,
      locale: localeFormats[locale].og,
      alternateLocale: locales.filter((l) => l !== locale).map((l) => localeFormats[l].og),
      images: [{ url: og, width: 1200, height: 630, alt: title }],
    },
    twitter: { card: 'summary_large_image', title, description, images: [og] },
  };
}

export function organizationJsonLd(locale: Locale) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Store',
    name: site.legalName,
    url: url(locale, '/'),
    logo: `${site.url}/icon.svg`,
    description: pick(site.tagline, locale),
    telephone: `+${site.whatsapp}`,
    address: { '@type': 'PostalAddress', addressLocality: site.address.locality, addressRegion: site.address.region, addressCountry: site.address.country },
    priceRange: '$$',
  };
}

export function websiteJsonLd(locale: Locale) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: site.name,
    url: url(locale, '/'),
    inLanguage: locale,
    potentialAction: { '@type': 'SearchAction', target: `${url(locale, '/shop')}?q={search_term_string}`, 'query-input': 'required name=search_term_string' },
  };
}

export function breadcrumbJsonLd(locale: Locale, items: Array<{ name: string; path: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({ '@type': 'ListItem', position: i + 1, name: it.name, item: url(locale, it.path) })),
  };
}

export function productJsonLd(locale: Locale, p: Product) {
  const prices = p.variants.map((v) => variantPrice(p, v) / 100);
  const inStock = p.variants.some((v) => v.stock > 0);
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: pick(p.name, locale),
    description: pick(p.description, locale),
    sku: p.variants[0]?.sku,
    image: p.images.map((i) => `${site.url}${i.src}`),
    brand: { '@type': 'Brand', name: site.name },
    material: pick(p.material, locale),
    category: p.category,
    offers: {
      '@type': 'AggregateOffer',
      url: url(locale, `/product/${p.slug}`),
      priceCurrency: p.currency,
      lowPrice: Math.min(...prices).toFixed(2),
      highPrice: Math.max(...prices).toFixed(2),
      offerCount: p.variants.length,
      availability: inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
    },
  };
}

export function itemListJsonLd(locale: Locale, products: Product[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: products.slice(0, 30).map((p, i) => ({ '@type': 'ListItem', position: i + 1, url: url(locale, `/product/${p.slug}`), name: pick(p.name, locale) })),
  };
}
