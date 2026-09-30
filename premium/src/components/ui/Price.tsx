import { useLocale } from 'next-intl';
import type { Locale } from '@/i18n/routing';
import { cn } from '@/lib/cn';
import { formatMoney } from '@/lib/format';

/** Precio en dólares (USD), formateado según el idioma. */
export function Price({ cents, compareAt, className }: { cents: number; compareAt?: number; className?: string }) {
  const locale = useLocale() as Locale;
  return (
    <span className={cn('tabular', className)}>
      {compareAt && compareAt > cents && <span className="mr-2 text-fg-subtle line-through">{formatMoney(compareAt, locale)}</span>}
      <span>{formatMoney(cents, locale)}</span>
    </span>
  );
}
