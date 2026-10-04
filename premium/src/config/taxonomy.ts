import type { Localized } from '@/domain/i18n';
import { L } from '@/domain/i18n';

export type CategoryKind = 'type' | 'group' | 'audience' | 'merch';

export interface CategoryDef {
  slug: string;
  kind: CategoryKind;
  name: Localized;
  blurb: Localized;
  /** Producto cuya foto ilustra la categoría. */
  coverProductId: string;
  /** Se muestra en la navegación principal aunque tenga pocas piezas. */
  primaryNav?: boolean;
}

/** Las categorías del negocio. Cada slug es una página dinámica real: /shop/<slug>. */
export const categories: CategoryDef[] = [
  { slug: 'jewelry', kind: 'group', name: L('Joyería', 'Jewelry'), blurb: L('Collares, aretes, anillos y pulseras.', 'Necklaces, earrings, rings and bracelets.'), coverProductId: 'an07', primaryNav: true },
  { slug: 'watches', kind: 'type', name: L('Relojes', 'Watches'), blurb: L('Tiempo con carácter.', 'Time with character.'), coverProductId: 'rw04', primaryNav: true },
  { slug: 'necklaces', kind: 'type', name: L('Collares', 'Necklaces'), blurb: L('Cerca del corazón.', 'Close to the heart.'), coverProductId: 'co11' },
  { slug: 'earrings', kind: 'type', name: L('Aretes', 'Earrings'), blurb: L('El detalle que ilumina.', 'The detail that lights up.'), coverProductId: 'ar06' },
  { slug: 'rings', kind: 'type', name: L('Anillos', 'Rings'), blurb: L('Símbolos que perduran.', 'Symbols that last.'), coverProductId: 'an04' },
  { slug: 'bracelets', kind: 'type', name: L('Pulseras', 'Bracelets'), blurb: L('Movimiento delicado.', 'Delicate movement.'), coverProductId: 'pu06' },
  { slug: 'shirts', kind: 'type', name: L('Camisas', 'T-shirts'), blurb: L('Poli-algodón, personalizables a pedido.', 'Poly-cotton, customizable on request.'), coverProductId: 'cm02', primaryNav: true },
  { slug: 'accessories', kind: 'type', name: L('Accesorios', 'Accessories'), blurb: L('Sets y piezas para completar el look.', 'Sets and pieces to complete the look.'), coverProductId: 'st01' },
  { slug: 'women', kind: 'audience', name: L('Mujer', 'Women'), blurb: L('Selección para ella.', 'A selection for her.'), coverProductId: 'ar11' },
  { slug: 'men', kind: 'audience', name: L('Hombre', 'Men'), blurb: L('Relojes de carácter.', 'Watches with character.'), coverProductId: 'rw06' },
  { slug: 'new-arrivals', kind: 'merch', name: L('Novedades', 'New Arrivals'), blurb: L('Lo último en llegar.', 'The latest to arrive.'), coverProductId: 'an12', primaryNav: true },
  { slug: 'gifts', kind: 'merch', name: L('Regalos', 'Gifts'), blurb: L('Piezas pensadas para regalar.', 'Pieces made for giving.'), coverProductId: 'co19', primaryNav: true },
];

/** `collections` no es un filtro: es un índice propio (/collections). */
export const collectionsNav = { slug: 'collections', name: L('Colecciones', 'Collections') };

export function getCategory(slug: string): CategoryDef | undefined {
  return categories.find((c) => c.slug === slug);
}

export const sortOptions = ['featured', 'newest', 'price-asc', 'price-desc'] as const;
export type SortOption = (typeof sortOptions)[number];
