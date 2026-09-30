'use client';

import { useLocale, useTranslations } from 'next-intl';
import { TransitionLink } from '@/components/motion/TransitionLink';
import { Button } from '@/components/ui/Button';
import { usePathname } from '@/i18n/navigation';
import { cn } from '@/lib/cn';
import { logoutAction } from '@/server/actions/auth';

const items = ['', '/orders', '/addresses', '/favorites', '/profile'] as const;

export function AccountNav() {
  const t = useTranslations('account');
  const locale = useLocale();
  const pathname = usePathname();
  return (
    <nav aria-label={t('nav')} className="flex flex-row gap-1 overflow-x-auto scrollbar-none lg:flex-col lg:gap-0">
      {items.map((i) => {
        const href = `/account${i}`;
        const active = pathname === href;
        return (
          <TransitionLink key={i} href={href} variant="direction" aria-current={active ? 'page' : undefined} className={cn('label-micro whitespace-nowrap border-b border-transparent px-1 py-3 transition-colors lg:border-line lg:py-4', active ? 'border-fg text-fg lg:border-line' : 'text-fg-subtle hover:text-fg')}>
            {t(`tabs.${i.slice(1) || 'overview'}` as 'tabs.overview')}
          </TransitionLink>
        );
      })}
      <form action={logoutAction} className="lg:mt-6">
        <input type="hidden" name="locale" value={locale} />
        <Button type="submit" variant="ghost" size="sm" className="!px-1">{t('logout')}</Button>
      </form>
    </nav>
  );
}
