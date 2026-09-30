import { localeFormats } from '@/config/site';
import type { Locale } from '@/i18n/routing';

/** Céntimos USD → texto localizado. Todos los precios de Clover son en dólares. */
export function formatMoney(cents: number, locale: Locale): string {
  return new Intl.NumberFormat(localeFormats[locale].intl, {
    style: 'currency',
    currency: 'USD',
    currencyDisplay: 'narrowSymbol',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

export function formatDate(iso: string, locale: Locale): string {
  return new Intl.DateTimeFormat(localeFormats[locale].intl, { dateStyle: 'medium' }).format(new Date(iso));
}

export function absoluteUrl(path: string, base: string): string {
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
}
