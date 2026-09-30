import type { Metadata } from 'next';
import { hasLocale } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { ButtonLink } from '@/components/ui/Button';
import { routing } from '@/i18n/routing';
import { formatDate, formatMoney } from '@/lib/format';
import { buildMetadata } from '@/lib/seo';
import { requireUser } from '@/server/auth/guards';
import { ordersForUser } from '@/server/repositories/orders';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations({ locale, namespace: 'account' });
  return buildMetadata({ locale, path: '/account', title: t('title'), description: t('title'), noindex: true });
}

export default async function AccountHome({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const user = await requireUser(locale, '/account');
  const t = await getTranslations('account');
  const orders = (await ordersForUser(user.id)).slice(0, 3);

  return (
    <div>
      <h1 className="font-display text-display-m">{t('title')}</h1>
      <p className="mt-4 max-w-lg text-fg-muted">{t('intro')}</p>

      <h2 className="label-micro mb-4 mt-14 text-fg-subtle">{t('recentOrders')}</h2>
      {orders.length === 0 ? (
        <div className="space-y-5 border border-line p-8">
          <p className="text-fg-muted">{t('noOrders')}</p>
          <ButtonLink href="/shop" transition="curtain">{t('startShopping')}</ButtonLink>
        </div>
      ) : (
        <ul className="divide-y divide-line border-y border-line">
          {orders.map((o) => (
            <li key={o.id} className="flex flex-wrap items-center justify-between gap-4 py-5">
              <div><p className="font-display text-lead">{o.number}</p><p className="text-caption text-fg-muted">{formatDate(o.createdAt, locale)}</p></div>
              <span className="label-micro border border-line-strong px-3 py-1.5">{t(`status.${o.status}`)}</span>
              <span className="tabular">{formatMoney(o.total, locale)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
