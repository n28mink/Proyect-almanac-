import type { Metadata } from 'next';
import { hasLocale } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { CheckoutForm } from '@/components/checkout/CheckoutForm';
import { PageShell } from '@/components/ui/PageShell';
import { routing } from '@/i18n/routing';
import { buildMetadata } from '@/lib/seo';

/** Ruta con CSP de nonce: DEBE renderizarse por petición (una página prerenderizada no llevaría el nonce y el navegador bloquearía todo el JS). */
export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations({ locale, namespace: 'checkout' });
  return buildMetadata({ locale, path: '/checkout', title: t('title'), description: t('text'), noindex: true });
}

export default async function CheckoutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations('checkout');
  return (
    <PageShell title={t('title')} text={t('text')}>
      <CheckoutForm />
    </PageShell>
  );
}
