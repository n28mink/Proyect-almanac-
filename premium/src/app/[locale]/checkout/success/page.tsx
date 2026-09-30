import type { Metadata } from 'next';
import Image from 'next/image';
import { hasLocale } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { ClearCartOnMount } from '@/components/checkout/ClearCartOnMount';
import { ButtonLink } from '@/components/ui/Button';
import { PageShell } from '@/components/ui/PageShell';
import { pick } from '@/domain/i18n';
import { routing } from '@/i18n/routing';
import { formatMoney } from '@/lib/format';
import { buildMetadata } from '@/lib/seo';
import { getSessionUser } from '@/server/auth/session';
import { getOrder } from '@/server/repositories/orders';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations({ locale, namespace: 'checkout' });
  return buildMetadata({ locale, path: '/checkout/success', title: t('successTitle'), description: t('successText'), noindex: true });
}

export default async function SuccessPage({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<{ order?: string }> }) {
  const { locale } = await params;
  const { order: orderId } = await searchParams;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations('checkout');
  const order = orderId ? await getOrder(orderId) : undefined;
  if (!order) notFound();

  // Un pedido de cuenta solo lo ve su dueño (o un admin). Los pedidos de invitado se protegen con su id no adivinable.
  const user = await getSessionUser();
  if (order.userId && user?.id !== order.userId && user?.role !== 'admin') notFound();

  return (
    <PageShell eyebrow={t('successEyebrow', { number: order.number })} title={t('successTitle')} text={t('successText', { email: order.email })} narrow>
      {order.status === 'paid' && <ClearCartOnMount />}
      <ul className="divide-y divide-line border-y border-line">
        {order.lines.map((l) => (
          <li key={l.variantId} className="flex items-center gap-4 py-4">
            <span className="relative h-20 w-16 shrink-0 overflow-hidden bg-surface-sunken"><Image src={l.image} alt="" fill sizes="64px" className="object-cover" /></span>
            <span className="flex-1"><span className="block font-display text-lead">{pick(l.name, locale)}</span><span className="text-caption text-fg-muted">{l.quantity} × {formatMoney(l.unitPrice, locale)}</span></span>
            <span className="tabular">{formatMoney(l.lineTotal, locale)}</span>
          </li>
        ))}
      </ul>
      <dl className="mt-6 space-y-2 text-caption">
        <div className="flex justify-between"><dt className="text-fg-muted">{t('status')}</dt><dd>{t(`orderStatus.${order.status}`)}</dd></div>
        <div className="flex justify-between border-t border-line pt-3"><dt className="label-micro">{t('total')}</dt><dd className="font-display text-heading">{formatMoney(order.total, locale)}</dd></div>
      </dl>
      <div className="mt-10 flex flex-wrap gap-4">
        <ButtonLink href="/shop" transition="curtain">{t('continueShopping')}</ButtonLink>
        {user && <ButtonLink href="/account/orders" variant="outline">{t('viewOrders')}</ButtonLink>}
      </div>
    </PageShell>
  );
}
