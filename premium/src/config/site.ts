import type { Localized } from '@/domain/i18n';
import { L } from '@/domain/i18n';

const rawUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

export const site = {
  name: 'Clover',
  legalName: 'Clover — Accesorios & Prendas',
  url: rawUrl.replace(/\/$/, ''),
  tagline: L('Piezas elegidas para llevarse de verdad.', 'Pieces chosen to be truly worn.') satisfies Localized,
  email: 'hola@clover.example',
  whatsapp: '584121318133',
  address: {
    locality: 'Turmero',
    region: 'Aragua',
    country: 'VE',
    area: 'Valle Fresco',
  },
  social: {
    instagram: 'https://www.instagram.com/',
  },
  /** Umbral de envío gratis, en céntimos USD. */
  freeShippingThreshold: 8000,
  shipping: {
    standard: { price: 900, days: [3, 6] as const },
    express: { price: 1800, days: [1, 2] as const },
    pickup: { price: 0, days: [0, 1] as const },
  },
} as const;

export type ShippingMethod = keyof typeof site.shipping;

/** Monedas de visualización. La liquidación es siempre en USD (base). Sustituir tasas por un proveedor FX real. */
export const currencies = {
  USD: { rate: 1, symbol: '$' },
  EUR: { rate: 0.92, symbol: '€' },
  GBP: { rate: 0.79, symbol: '£' },
  MXN: { rate: 17.2, symbol: '$' },
} as const;

export const localeFormats = {
  es: { intl: 'es-VE', og: 'es_VE', label: 'Español' },
  en: { intl: 'en-US', og: 'en_US', label: 'English' },
} as const;

/** Impuestos por país (fracción). Valores de ejemplo: configurar según normativa real. */
export const taxRates: Record<string, number> = {
  VE: 0,
  US: 0,
  ES: 0,
};
