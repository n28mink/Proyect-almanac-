import type { Promotion } from '@/domain/commerce';

/** Promociones activas. Sustituir por una tabla en base de datos cuando exista el admin de promociones. */
export const promotions: Promotion[] = [
  { code: 'BIENVENIDA10', kind: 'percent', value: 10, minSubtotal: 3000, label: { es: '10 % de descuento de bienvenida', en: '10% welcome discount' }, active: true },
  { code: 'ENVIOGRATIS', kind: 'free_shipping', value: 0, minSubtotal: 4000, label: { es: 'Envío gratis', en: 'Free shipping' }, active: true },
];
