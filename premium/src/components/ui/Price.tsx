'use client';

import { useLocale } from 'next-intl';
import type { Locale } from '@/i18n/routing';
import { formatMoney } from '@/lib/format';
import { cn } from '@/lib/cn';
import { useUi } from '@/stores/ui-store';

/** Precio en la moneda elegida. SSR y primer render: USD (sin desajuste de hidratación). */
export function Price({ cents, compareAt, className }: { cents: number; compareAt?: number; className?: string }) {
  const locale = useLocale() as Locale;
  const currency = useUi((s) => s.currency);
  return (
    <span className={cn('tabular', className)}>
      {compareAt && compareAt > cents && (
        <span className="mr-2 text-fg-subtle line-through">{formatMoney(compareAt, locale, currency)}</span>
      )}
      <span suppressHydrationWarning>{formatMoney(cents, locale, currency)}</span>
    </span>
  );
}
