import type { Metadata } from 'next';
import { hasLocale } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { AdminLoginForm } from '@/components/account/AdminLoginForm';
import { PageShell } from '@/components/ui/PageShell';
import { ADMIN_PATH } from '@/config/admin';
import { redirect } from '@/i18n/navigation';
import { routing } from '@/i18n/routing';
import { getSessionUser } from '@/server/auth/session';

export const metadata: Metadata = { title: 'Clover', robots: { index: false, follow: false } };

/** Acceso al panel. Solo administradores: los clientes no tienen cuenta (piden por WhatsApp). No está enlazado en el sitio. */
export default async function AdminLoginPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  if ((await getSessionUser())?.role === 'admin') redirect({ href: `/${ADMIN_PATH}`, locale });
  const t = await getTranslations('auth');
  return (
    <PageShell title={t('loginTitle')} text={t('loginText')} narrow>
      <AdminLoginForm />
    </PageShell>
  );
}
