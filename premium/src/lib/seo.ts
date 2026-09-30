import type { Metadata } from 'next';
import { localeFormats, site } from '@/config/site';
import { variantPrice, type Product } from '@/domain/catalog';
import { pick } from '@/domain/i18n';
import { locales, type Locale } from '@/i18n/routing';

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
export function buildMetadata({ locale, path, title, description, image = '/og-default.jpg', noindex, type = 'website' }: MetaInput): Metadata {
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
