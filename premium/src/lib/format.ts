import { currencies, localeFormats } from '@/config/site';
import type { CurrencyCode } from '@/domain/commerce';
import type { Locale } from '@/i18n/routing';

/** Céntimos USD → texto localizado en la moneda de visualización. Solo visualización: se cobra en USD. */
export function formatMoney(cents: number, locale: Locale, currency: CurrencyCode = 'USD'): string {
  const { rate } = currencies[currency];
  return new Intl.NumberFormat(localeFormats[locale].intl, {
    style: 'currency',
    currency,
    currencyDisplay: 'narrowSymbol',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format((cents / 100) * rate);
}

export function formatDate(iso: string, locale: Locale): string {
  return new Intl.DateTimeFormat(localeFormats[locale].intl, { dateStyle: 'medium' }).format(new Date(iso));
}

export function absoluteUrl(path: string, base: string): string {
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
}
