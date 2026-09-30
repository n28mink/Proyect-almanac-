import { hasLocale } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';
import { TransitionLink } from '@/components/motion/TransitionLink';
import { routing } from '@/i18n/routing';
import { ADMIN_PATH } from '@/config/admin';
import { logoutAction } from '@/server/actions/auth';
import { Button } from '@/components/ui/Button';
import { requireAdmin } from '@/server/auth/guards';

const links = ['', '/products', '/orders', '/campaigns', '/media'] as const;

/** Toda la zona del panel exige rol admin en servidor (además de la comprobación de cada acción). No indexable. */
export default async function AdminLayout({ children, params }: { children: ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  await requireAdmin(locale);
  const t = await getTranslations('admin');

  return (
    <div className="pt-[calc(var(--header-h)+var(--announcement-h))]" data-header-tone="dark">
      <div className="container-ultra pb-24 pt-12">
        <nav aria-label={t('nav')} className="mb-10 flex flex-wrap items-center gap-x-8 gap-y-2 border-b border-line pb-4">
          {links.map((l) => (
            <TransitionLink key={l} href={`/${ADMIN_PATH}${l}`} className="nav-link label-micro">{t(`tabs.${l || 'dashboard'}` as 'tabs.dashboard')}</TransitionLink>
          ))}
          <form action={logoutAction} className="ml-auto">
            <input type="hidden" name="locale" value={locale} />
            <Button type="submit" variant="ghost" size="sm">{t('logout')}</Button>
          </form>
        </nav>
        {children}
      </div>
    </div>
  );
}
