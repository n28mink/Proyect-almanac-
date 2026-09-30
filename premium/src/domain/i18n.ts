import { z } from 'zod';
import type { Locale } from '@/i18n/routing';

/** Texto localizado: el contenido lleva ambos idiomas, los componentes eligen. */
export const localizedSchema = z.object({
  es: z.string().min(1),
  en: z.string().min(1),
});
export type Localized = z.infer<typeof localizedSchema>;

export function pick(value: Localized, locale: Locale): string {
  return value[locale] ?? value.es;
}

/** Atajo para construir un texto localizado en el código. */
export const L = (es: string, en: string): Localized => ({ es, en });
