import { hasLocale } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';
import { TransitionLink } from '@/components/motion/TransitionLink';
import { Eyebrow } from '@/components/ui/Section';
import { routing } from '@/i18n/routing';
import { requireAdmin } from '@/server/auth/guards';

const links = ['', '/products', '/orders', '/customers', '/campaigns', '/media'] as const;

/** Toda la zona /admin exige rol admin en servidor (además de la comprobación de cada acción). No indexable. */
export default async function AdminLayout({ children, params }: { children: ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  await requireAdmin(locale);
  const t = await getTranslations('admin');

  return (
    <div className="pt-[calc(var(--header-h)+var(--announcement-h))]" data-header-tone="dark">
      <div className="container-ultra pb-24 pt-12">
        <Eyebrow className="mb-3">{t('eyebrow')}</Eyebrow>
        <nav aria-label={t('nav')} className="mb-10 flex flex-wrap gap-x-8 gap-y-2 border-b border-line pb-4">
          {links.map((l) => (
            <TransitionLink key={l} href={`/admin${l}`} className="nav-link label-micro">{t(`tabs.${l || 'dashboard'}` as 'tabs.dashboard')}</TransitionLink>
          ))}
        </nav>
        {children}
      </div>
    </div>
  );
}
