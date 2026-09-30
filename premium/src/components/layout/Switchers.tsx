'use client';

import { useLocale, useTranslations } from 'next-intl';
import { localeFormats } from '@/config/site';
import { currencies } from '@/config/site';
import type { CurrencyCode } from '@/domain/commerce';
import { usePathname, useRouter } from '@/i18n/navigation';
import { locales, type Locale } from '@/i18n/routing';
import { cn } from '@/lib/cn';
import { useUi } from '@/stores/ui-store';

/** Cambio de idioma: misma ruta, otro prefijo de locale. */
export function LocaleSwitcher({ className }: { className?: string }) {
  const t = useTranslations('common');
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();
  return (
    <div className={cn('flex items-center gap-4', className)} role="group" aria-label={t('language')}>
      {locales.map((l) => (
        <button
          key={l}
          type="button"
          lang={l}
          aria-pressed={l === locale}
          onClick={() => l !== locale && router.replace(pathname, { locale: l, scroll: false })}
          className={cn('label-micro nav-link py-2', l === locale ? 'text-fg' : 'text-fg-subtle hover:text-fg')}
          aria-current={l === locale ? 'true' : undefined}
        >
          {localeFormats[l].label}
        </button>
      ))}
    </div>
  );
}

/** Moneda de visualización (se cobra en USD). Formato según idioma con Intl. */
export function CurrencySwitcher({ className }: { className?: string }) {
  const t = useTranslations('common');
  const currency = useUi((s) => s.currency);
  const setCurrency = useUi((s) => s.setCurrency);
  return (
    <label className={cn('flex items-center gap-3', className)}>
      <span className="label-micro text-fg-subtle">{t('currency')}</span>
      <select value={currency} onChange={(e) => setCurrency(e.target.value as CurrencyCode)} className="field !min-h-10 !w-auto !py-1.5 text-caption">
        {(Object.keys(currencies) as CurrencyCode[]).map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>
    </label>
  );
}
