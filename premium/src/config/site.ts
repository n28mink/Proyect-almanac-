import type { Localized } from '@/domain/i18n';
import { L } from '@/domain/i18n';

/**
 * Dirección pública (vista previa al compartir, sitemap, hreflang). Primero la que se configure a mano; si no, la de
 * producción que Vercel entrega sola (`VERCEL_PROJECT_PRODUCTION_URL`, sin protocolo); en local, localhost.
 */
const vercelHost = process.env.VERCEL_PROJECT_PRODUCTION_URL;
const rawUrl = process.env.NEXT_PUBLIC_SITE_URL || (vercelHost ? `https://${vercelHost}` : 'http://localhost:3000');

export const site = {
  name: 'Clover',
  legalName: 'Clover — Accesorios y Prendas',
  url: rawUrl.replace(/\/$/, ''),
  tagline: L('Piezas elegidas para llevarse de verdad.', 'Pieces chosen to be truly worn.') satisfies Localized,
  whatsapp: '584121318133',
  address: {
    locality: 'Turmero',
    region: 'Aragua',
    country: 'VE',
    area: 'Valle Fresco',
  },
  /** Formas de pago que se coordinan por WhatsApp al confirmar el pedido. */
  paymentMethods: L('Pago móvil, transferencia bancaria o efectivo', 'Pago móvil, bank transfer or cash') satisfies Localized,
} as const;

export const localeFormats = {
  es: { intl: 'es-VE', og: 'es_VE', label: 'Español' },
  en: { intl: 'en-US', og: 'en_US', label: 'English' },
} as const;
