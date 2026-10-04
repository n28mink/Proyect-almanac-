import type { Metadata } from 'next';
import Image from 'next/image';
import { hasLocale } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { ClearCartOnMount } from '@/components/checkout/ClearCartOnMount';
import { ButtonLink, ExternalButtonLink } from '@/components/ui/Button';
import { PageShell } from '@/components/ui/PageShell';
import { PaymentIcon } from '@/components/checkout/PaymentMethods';
import { paymentMethodLabel } from '@/domain/commerce';
import { pick } from '@/domain/i18n';
import { routing } from '@/i18n/routing';
import { formatMoney } from '@/lib/format';
import { buildMetadata } from '@/lib/seo';
import { WhatsAppLink } from '@/components/ui/WhatsAppLink';
import { orderMessage, whatsappUrl } from '@/lib/whatsapp';
import type { Locale } from '@/i18n/routing';
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

  // El pedido solo se muestra a quien conoce su id (UUID no adivinable); no hay cuentas de cliente.
  const wa = whatsappUrl(orderMessage(order, locale as Locale));

  return (
    <PageShell eyebrow={t('successEyebrow', { number: order.number })} title={t('successTitle')} text={t('successText')} narrow>
      <ClearCartOnMount />
      <ul className="divide-y divide-line border-y border-line">
        {order.lines.map((l) => (
          <li key={l.variantId} className="flex items-center gap-4 py-4">
            <span className="relative h-20 w-16 shrink-0 overflow-hidden bg-surface-sunken"><Image src={l.image} alt="" fill sizes="64px" className="object-cover" /></span>
            <span className="flex-1"><span className="block font-display text-lead">{pick(l.name, locale)}</span><span className="text-caption text-fg-muted">{pick(l.variantLabel, locale)} · {l.quantity} × {formatMoney(l.unitPrice, locale)}</span></span>
            <span className="tabular">{formatMoney(l.lineTotal, locale)}</span>
          </li>
        ))}
      </ul>
      <dl className="mt-6 space-y-2 text-caption">
        <div className="flex justify-between"><dt className="text-fg-muted">{t('status')}</dt><dd>{t(`orderStatus.${order.status}`)}</dd></div>
        {order.paymentMethod && (
          <div className="flex justify-between gap-4">
            <dt className="text-fg-muted">{t('payment')}</dt>
            <dd className="flex items-center gap-2"><PaymentIcon method={order.paymentMethod} width={18} height={18} className="text-accent" />{pick(paymentMethodLabel[order.paymentMethod], locale)}</dd>
          </div>
        )}
        <div className="flex justify-between border-t border-line pt-3"><dt className="label-micro">{t('total')}</dt><dd className="font-display text-heading">{formatMoney(order.total, locale)}</dd></div>
      </dl>
      <div className="mt-10 flex flex-wrap items-center gap-4">
        <ExternalButtonLink href={wa} size="lg">{t('sendWhatsapp')}</ExternalButtonLink>
        <ButtonLink href="/shop" variant="outline" size="lg" transition="curtain">{t('continueShopping')}</ButtonLink>
      </div>
      <p className="mt-6 text-caption text-fg-muted">{t.rich('whatsappHint', { order: order.number, wa: (chunks) => <WhatsAppLink href={wa} label={chunks as string} className="text-fg underline underline-offset-4" /> })}</p>
    </PageShell>
  );
}
