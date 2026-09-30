import type { Metadata } from 'next';
import { hasLocale } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { WishlistGrid } from '@/components/shop/WishlistGrid';
import { PageShell } from '@/components/ui/PageShell';
import { routing } from '@/i18n/routing';
import { buildMetadata } from '@/lib/seo';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations({ locale, namespace: 'wishlist' });
  return buildMetadata({ locale, path: '/wishlist', title: t('title'), description: t('text'), noindex: true });
}

export default async function WishlistPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations('wishlist');
  return (
    <PageShell eyebrow={t('eyebrow')} title={t('title')} text={t('text')}>
      <WishlistGrid />
    </PageShell>
  );
}
