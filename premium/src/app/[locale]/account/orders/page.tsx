import Image from 'next/image';
import { hasLocale } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { ButtonLink } from '@/components/ui/Button';
import { pick } from '@/domain/i18n';
import { routing } from '@/i18n/routing';
import { formatDate, formatMoney } from '@/lib/format';
import { requireUser } from '@/server/auth/guards';
import { ordersForUser } from '@/server/repositories/orders';

export default async function OrdersPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const user = await requireUser(locale, '/account/orders');
  const t = await getTranslations('account');
  const orders = await ordersForUser(user.id);

  return (
    <div>
      <h1 className="font-display text-display-m">{t('tabs.orders')}</h1>
      {orders.length === 0 ? (
        <div className="mt-10 space-y-5 border border-line p-8"><p className="text-fg-muted">{t('noOrders')}</p><ButtonLink href="/shop" transition="curtain">{t('startShopping')}</ButtonLink></div>
      ) : (
        <ul className="mt-10 space-y-8">
          {orders.map((o) => (
            <li key={o.id} className="border border-line p-6">
              <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-line pb-4">
                <div><p className="font-display text-heading">{o.number}</p><p className="text-caption text-fg-muted">{formatDate(o.createdAt, locale)}</p></div>
                <span className="label-micro border border-line-strong px-3 py-1.5">{t(`status.${o.status}`)}</span>
              </div>
              <ul className="divide-y divide-line">
                {o.lines.map((l) => (
                  <li key={l.variantId} className="flex items-center gap-4 py-3">
                    <span className="relative h-16 w-14 shrink-0 overflow-hidden bg-surface-sunken"><Image src={l.image} alt="" fill sizes="56px" className="object-cover" /></span>
                    <span className="flex-1 text-caption">{pick(l.name, locale)} <span className="text-fg-muted">× {l.quantity}</span></span>
                    <span className="tabular text-caption">{formatMoney(l.lineTotal, locale)}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-right font-display text-heading">{formatMoney(o.total, locale)}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
