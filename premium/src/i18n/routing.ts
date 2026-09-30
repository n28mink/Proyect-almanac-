import { defineRouting } from 'next-intl/routing';

export const locales = ['es', 'en'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'es';

export const routing = defineRouting({
  locales,
  defaultLocale,
  // Prefijo siempre visible: URLs canónicas por idioma (/es, /en) para hreflang y SEO.
  localePrefix: 'always',
  localeDetection: true,
});

export function isLocale(value: string | undefined | null): value is Locale {
  return !!value && (locales as readonly string[]).includes(value);
}
