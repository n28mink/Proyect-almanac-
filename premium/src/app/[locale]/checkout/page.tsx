import type { Metadata } from 'next';
import { hasLocale } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { CheckoutForm } from '@/components/checkout/CheckoutForm';
import { PageShell } from '@/components/ui/PageShell';
import { routing } from '@/i18n/routing';
import { buildMetadata } from '@/lib/seo';
import { getSessionUser } from '@/server/auth/session';
import { env } from '@/server/env';
import { findById } from '@/server/repositories/users';

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
  const user = await getSessionUser();
  const full = user ? await findById(user.id) : undefined;

  return (
    <PageShell eyebrow={t('eyebrow')} title={t('title')} text={t('text')}>
      <CheckoutForm user={user} addresses={full?.addresses ?? []} providerLabel={env().PAYMENT_PROVIDER} />
    </PageShell>
  );
}
