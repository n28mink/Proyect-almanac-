import type { Metadata } from 'next';
import { hasLocale } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { ShopPage } from '@/components/shop/ShopPage';
import { routing } from '@/i18n/routing';
import { buildMetadata } from '@/lib/seo';
import { getCatalog } from '@/server/repositories/catalog';

export const revalidate = 300;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations({ locale, namespace: 'shop' });
  return buildMetadata({ locale, path: '/shop', title: t('allTitle'), description: t('allText') });
}

export default async function AllProducts({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations('shop');
  return <ShopPage locale={locale} products={await getCatalog()} title={t('allTitle')} blurb={t('allText')} />;
}
