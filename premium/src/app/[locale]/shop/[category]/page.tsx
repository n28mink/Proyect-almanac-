import type { Metadata } from 'next';
import { hasLocale } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { JsonLd } from '@/components/seo/JsonLd';
import { ShopPage } from '@/components/shop/ShopPage';
import { categories, getCategory } from '@/config/taxonomy';
import { pick } from '@/domain/i18n';
import { routing } from '@/i18n/routing';
import { breadcrumbJsonLd, buildMetadata } from '@/lib/seo';
import { getCatalog } from '@/server/repositories/catalog';

export const revalidate = 300;

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

  const products = (await getCatalog()).filter((p) => p.categories.includes(cat.slug));
  return (
    <>
      <JsonLd data={breadcrumbJsonLd(locale, [{ name: t('breadcrumbShop'), path: '/shop' }, { name: pick(cat.name, locale), path: `/shop/${cat.slug}` }])} />
      <ShopPage locale={locale} products={products} title={pick(cat.name, locale)} blurb={pick(cat.blurb, locale)} />
    </>
  );
}
