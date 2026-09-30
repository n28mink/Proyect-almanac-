import type { Metadata } from 'next';
import { hasLocale } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { ShopPage } from '@/components/shop/ShopPage';
import { collections, getCollection } from '@/content/collections';
import { pick } from '@/domain/i18n';
import { routing } from '@/i18n/routing';
import { buildMetadata } from '@/lib/seo';
import { getCatalog } from '@/server/repositories/catalog';

export const revalidate = 300;

export function generateStaticParams() {
  return routing.locales.flatMap((locale) => collections.map((c) => ({ locale, slug: c.slug })));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }): Promise<Metadata> {
  const { locale, slug } = await params;
  const c = getCollection(slug);
  if (!hasLocale(routing.locales, locale) || !c) return {};
  return buildMetadata({ locale, path: `/collections/${slug}`, title: pick(c.name, locale), description: pick(c.description, locale) });
}

export default async function CollectionPage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  const c = getCollection(slug);
  if (!c) notFound();
  setRequestLocale(locale);
  const t = await getTranslations('collections');
  const products = (await getCatalog()).filter((p) => p.collection === slug);
  return <ShopPage locale={locale} products={products} title={pick(c.name, locale)} blurb={pick(c.description, locale)} eyebrow={`${t('eyebrowOne')} · ${pick(c.tagline, locale)}`} />;
}
