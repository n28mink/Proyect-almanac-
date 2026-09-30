import type { Metadata } from 'next';
import { hasLocale } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { AuthForm } from '@/components/account/AuthForm';
import { PageShell } from '@/components/ui/PageShell';
import { redirect } from '@/i18n/navigation';
import { routing } from '@/i18n/routing';
import { buildMetadata } from '@/lib/seo';
import { getSessionUser } from '@/server/auth/session';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations({ locale, namespace: 'auth' });
  return buildMetadata({ locale, path: '/register', title: t('registerTitle'), description: t('registerText'), noindex: true });
}

export default async function RegisterPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  if (await getSessionUser()) redirect({ href: '/account', locale });
  const t = await getTranslations('auth');
  return (
    <PageShell eyebrow={t('eyebrow')} title={t('registerTitle')} text={t('registerText')} narrow>
      <div className="max-w-md"><AuthForm mode="register" /></div>
    </PageShell>
  );
}
