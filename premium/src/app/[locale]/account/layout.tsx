import { hasLocale } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';
import { AccountNav } from '@/components/account/AccountNav';
import { Eyebrow } from '@/components/ui/Section';
import { routing } from '@/i18n/routing';
import { requireUser } from '@/server/auth/guards';

export default async function AccountLayout({ children, params }: { children: ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const user = await requireUser(locale, '/account');
  const t = await getTranslations('account');

  return (
    <div className="pt-[calc(var(--header-h)+var(--announcement-h))]" data-header-tone="dark">
      <div className="container-x grid gap-10 pb-24 pt-14 md:pt-20 lg:grid-cols-[14rem_1fr] lg:gap-20">
        <aside>
          <Eyebrow className="mb-2">{t('hello')}</Eyebrow>
          <p className="mb-8 font-display text-heading">{user.name}</p>
          <AccountNav />
        </aside>
        <div>{children}</div>
      </div>
    </div>
  );
}
