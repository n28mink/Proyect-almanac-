import { sortOptions, type SortOption } from '@/config/taxonomy';
import type { CardData } from './card-data';

export interface ShopParams {
  q: string;
  sort: SortOption;
  /** USD enteros */
  min?: number;
  max?: number;
  finish: string[];
  material: string[];
  audience: string[];
  collection: string[];
  inStock: boolean;
  view: 'grid' | 'list';
}

const list = (v: string | null) => (v ? v.split(',').map((s) => s.trim()).filter(Boolean).slice(0, 12) : []);
const num = (v: string | null) => {
  const n = Number(v);
  return v !== null && v !== '' && Number.isFinite(n) && n >= 0 ? Math.floor(n) : undefined;
};

/** Estado de filtros ↔ URL. Siempre validado: lo que llega en la URL no es de fiar. */
export function parseParams(sp: URLSearchParams): ShopParams {
  const sort = sp.get('sort');
  return {
    q: (sp.get('q') ?? '').slice(0, 60),
    sort: (sortOptions as readonly string[]).includes(sort ?? '') ? (sort as SortOption) : 'featured',
    min: num(sp.get('min')),
    max: num(sp.get('max')),
    finish: list(sp.get('finish')),
    material: list(sp.get('material')),
    audience: list(sp.get('audience')),
    collection: list(sp.get('collection')),
    inStock: sp.get('stock') === '1',
    view: sp.get('view') === 'list' ? 'list' : 'grid',
  };
}

export function serializeParams(p: ShopParams): string {
  const sp = new URLSearchParams();
  if (p.q) sp.set('q', p.q);
  if (p.sort !== 'featured') sp.set('sort', p.sort);
  if (p.min !== undefined) sp.set('min', String(p.min));
  if (p.max !== undefined) sp.set('max', String(p.max));
  if (p.finish.length) sp.set('finish', p.finish.join(','));
  if (p.material.length) sp.set('material', p.material.join(','));
  if (p.audience.length) sp.set('audience', p.audience.join(','));
  if (p.collection.length) sp.set('collection', p.collection.join(','));
  if (p.inStock) sp.set('stock', '1');
  if (p.view === 'list') sp.set('view', 'list');
  return sp.toString();
}

const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

export function applyFilters(products: CardData[], p: ShopParams): CardData[] {
  const terms = norm(p.q).split(/\s+/).filter(Boolean);
  const out = products.filter((x) => {
    if (terms.length) {
      const hay = norm([x.name, x.categoryLabel, x.material, ...x.color, ...x.tags].join(' '));
      if (!terms.every((t) => hay.includes(t))) return false;
    }
    const dollars = x.price / 100;
    if (p.min !== undefined && dollars < p.min) return false;
    if (p.max !== undefined && dollars > p.max) return false;
    if (p.finish.length && !(x.finish && p.finish.includes(x.finish))) return false;
    if (p.material.length && !p.material.includes(x.materialKey)) return false;
    if (p.audience.length && !p.audience.some((a) => x.audience.includes(a))) return false;
    if (p.collection.length && !(x.collection && p.collection.includes(x.collection))) return false;
    if (p.inStock && !x.inStock) return false;
    return true;
  });

  const by = [...out];
  switch (p.sort) {
    case 'price-asc':
      return by.sort((a, b) => a.price - b.price || a.order - b.order);
    case 'price-desc':
      return by.sort((a, b) => b.price - a.price || a.order - b.order);
    case 'newest':
      return by.sort((a, b) => Number(b.newArrival) - Number(a.newArrival) || a.order - b.order);
    default:
      return by.sort((a, b) => Number(b.featured) - Number(a.featured) || a.order - b.order);
  }
}

export interface Facets {
  price: { min: number; max: number } | null;
  finish: Array<{ value: string; count: number }>;
  material: Array<{ value: string; count: number }>;
  audience: Array<{ value: string; count: number }>;
  collection: Array<{ value: string; count: number }>;
}

const tally = (values: string[]) => {
  const m = new Map<string, number>();
  values.forEach((v) => m.set(v, (m.get(v) ?? 0) + 1));
  return [...m.entries()].map(([value, count]) => ({ value, count }));
};

/** Facetas de la lista completa. Una faceta con menos de 2 opciones distintas no se muestra (no aporta). */
export function computeFacets(products: CardData[]): Facets {
  const prices = products.map((p) => p.price / 100);
  const min = Math.floor(Math.min(...prices));
  const max = Math.ceil(Math.max(...prices));
  const multi = <T extends { value: string; count: number }>(arr: T[]) => (arr.length >= 2 ? arr : []);
  return {
    price: new Set(prices).size > 1 ? { min, max } : null,
    finish: multi(tally(products.flatMap((p) => (p.finish ? [p.finish] : [])))),
    material: multi(tally(products.map((p) => p.materialKey))),
    audience: multi(tally(products.flatMap((p) => p.audience))),
    collection: multi(tally(products.flatMap((p) => (p.collection ? [p.collection] : [])))),
  };
}

export function activeCount(p: ShopParams): number {
  return (p.q ? 1 : 0) + (p.min !== undefined ? 1 : 0) + (p.max !== undefined ? 1 : 0) + p.finish.length + p.material.length + p.audience.length + p.collection.length + (p.inStock ? 1 : 0);
}
