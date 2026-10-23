import type { Metadata } from 'next';
import { hasLocale } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { JsonLd } from '@/components/seo/JsonLd';
import { ShopPage } from '@/components/shop/ShopPage';
import { categories, getCategory } from '@/config/taxonomy';
import type { Product } from '@/domain/catalog';
import { pick } from '@/domain/i18n';
import { routing } from '@/i18n/routing';
import { breadcrumbJsonLd, buildMetadata } from '@/lib/seo';
import { getCatalog } from '@/server/repositories/catalog';

export const revalidate = 300;

const GIFTS_FOR_HER = 'gifts-for-her';
const GIFTS_FOR_HIM = 'gifts-for-him';
/** Dentro de «Regalos» se elige para quién: la página base enlaza a las dos ramas y cada rama enlaza a la otra. */
const GIFT_BRANCHES = ['gifts', GIFTS_FOR_HER, GIFTS_FOR_HIM];

/** Categorías con portada de foto con modelo: pieza cuya foto se usa y encuadre (position = object-position; flip voltea la foto). */
const HEROES: Record<string, { id: string; position: string; flip?: boolean }> = {
  necklaces: { id: 'co09', position: '50% 70%' },
  earrings: { id: 'ar13', position: '50% 38%', flip: true },
  bracelets: { id: 'pu06', position: '50% 78%' },
  rings: { id: 'an03', position: '50% 55%' },
  sunglasses: { id: 'le01', position: '50% 30%' },
};

/** "Regalos para ella" no es una etiqueta de producto: reúne la joyería de mujer de mayor precio del catálogo vivo. */
function topJewelry(catalog: Product[]): Product[] {
  const pool = catalog.filter((p) => p.categories.includes('jewelry') && p.categories.includes('women'));
  const top = Math.max(0, ...pool.map((p) => p.price));
  return pool.filter((p) => p.price === top);
}

/** «Regalos para él»: las piezas de hombre del catálogo vivo. */
function giftsForHim(catalog: Product[]): Product[] {
  return catalog.filter((p) => p.categories.includes('men'));
}

/** Cada categoría es una página real y estática por idioma (incluidas las vacías, que muestran su estado vacío). */
export const dynamicParams = false;

export function generateStaticParams() {
  return routing.locales.flatMap((locale) => categories.map((c) => ({ locale, category: c.slug })));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string; category: string }> }): Promise<Metadata> {
  const { locale, category } = await params;
  const cat = getCategory(category);
  if (!hasLocale(routing.locales, locale) || !cat) return {};
  return buildMetadata({ locale, path: `/shop/${category}`, title: pick(cat.name, locale), description: pick(cat.blurb, locale) });
}

export default async function CategoryPage({ params }: { params: Promise<{ locale: string; category: string }> }) {
  const { locale, category } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  const cat = getCategory(category);
  if (!cat) notFound();
  setRequestLocale(locale);
  const t = await getTranslations('shop');

  const catalog = await getCatalog();
  const products = cat.slug === GIFTS_FOR_HER ? topJewelry(catalog) : cat.slug === GIFTS_FOR_HIM ? giftsForHim(catalog) : cat.slug === 'gifts' ? [...catalog.filter((p) => p.categories.includes('gifts')), ...giftsForHim(catalog).filter((p) => !p.categories.includes('gifts'))] : catalog.filter((p) => p.categories.includes(cat.slug));
  const parent = cat.slug === GIFTS_FOR_HER || cat.slug === GIFTS_FOR_HIM ? { label: pick(getCategory('gifts')!.name, locale), href: '/shop/gifts' } : undefined;
  const branches = GIFT_BRANCHES.includes(cat.slug)
    ? GIFT_BRANCHES.map((slug) => getCategory(slug)!).map((c) => ({ label: c.slug === 'gifts' ? t('allGifts') : t(c.slug === GIFTS_FOR_HER ? 'forHer' : 'forHim'), href: `/shop/${c.slug}`, current: c.slug === cat.slug }))
    : undefined;
  // Portada con foto de modelo: la categoría usa la foto con modelo de una de sus piezas.
  const heroSpec = HEROES[cat.slug];
  const heroProduct = heroSpec ? products.find((p) => p.id === heroSpec.id) : undefined;
  const heroImage = heroProduct?.images.find((i) => i.role === 'lifestyle');
  const hero = heroSpec && heroProduct && heroImage ? { src: heroImage.src, blur: heroImage.blur, alt: pick(heroImage.alt, locale), position: heroSpec.position, flip: heroSpec.flip } : undefined;
  return (
    <>
      <JsonLd data={breadcrumbJsonLd(locale, [{ name: t('breadcrumbShop'), path: '/shop' }, { name: pick(cat.name, locale), path: `/shop/${cat.slug}` }])} />
      <ShopPage locale={locale} products={products} title={pick(cat.name, locale)} blurb={pick(cat.blurb, locale)} category={cat.slug} parent={parent} branches={branches} hero={hero} />
    </>
  );
}
