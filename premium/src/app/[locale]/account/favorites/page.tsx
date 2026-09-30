import { hasLocale } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { WishlistGrid } from '@/components/shop/WishlistGrid';
import { routing } from '@/i18n/routing';
import { requireUser } from '@/server/auth/guards';

export default async function FavoritesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  await requireUser(locale, '/account/favorites');
  const t = await getTranslations('account');
  return (
    <div>
      <h1 className="font-display text-display-m">{t('tabs.favorites')}</h1>
      <p className="mb-10 mt-4 max-w-lg text-fg-muted">{t('favoritesText')}</p>
      <WishlistGrid />
    </div>
  );
}
