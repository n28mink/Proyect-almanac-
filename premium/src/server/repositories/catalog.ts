import { cache } from 'react';
import raw from '@/content/catalog.generated.json';
import { catalogSchema, isInStock, type Product } from '@/domain/catalog';
import { store } from '../store/json-store';

export interface ProductOverride {
  price?: number;
  featured?: boolean;
  newArrival?: boolean;
  bestseller?: boolean;
  hidden?: boolean;
  variantStock?: Record<string, number>;
}
export type OverrideMap = Record<string, ProductOverride>;

let base: Product[] | undefined;

/** Catálogo base validado con zod (una vez por proceso). */
export function baseCatalog(): Product[] {
  base ??= catalogSchema.parse(raw);
  return base;
}

/** `cache` de React: una sola lectura del almacén por render/petición aunque layout, página y componentes la pidan. */
export const getOverrides = cache(async (): Promise<OverrideMap> => store.read<OverrideMap>('overrides', {}));

export function applyOverride(product: Product, o: ProductOverride | undefined): Product | null {
  if (!o) return product;
  if (o.hidden) return null;
  const variants = product.variants.map((v) => ({ ...v, stock: o.variantStock?.[v.id] ?? v.stock }));
  return {
    ...product,
    price: o.price ?? product.price,
    featured: o.featured ?? product.featured,
    newArrival: o.newArrival ?? product.newArrival,
    bestseller: o.bestseller ?? product.bestseller,
    variants,
    stock: variants.reduce((s, v) => s + v.stock, 0),
  };
}

/** Catálogo vivo: base + overrides del admin. */
export const getCatalog = cache(async (): Promise<Product[]> => {
  const overrides = await getOverrides();
  return baseCatalog()
    .map((p) => applyOverride(p, overrides[p.id]))
    .filter((p): p is Product => p !== null);
});

export async function getProductBySlug(slug: string): Promise<Product | undefined> {
  return (await getCatalog()).find((p) => p.slug === slug);
}

export async function getProductById(id: string): Promise<Product | undefined> {
  return (await getCatalog()).find((p) => p.id === id);
}

export async function setOverride(id: string, patch: ProductOverride): Promise<void> {
  await store.update<OverrideMap>('overrides', {}, (cur) => ({ ...cur, [id]: { ...cur[id], ...patch } }));
}

export async function adjustStock(lines: Array<{ variantId: string; quantity: number }>): Promise<void> {
  const catalog = baseCatalog();
  await store.update<OverrideMap>('overrides', {}, (cur) => {
    const next = { ...cur };
    for (const line of lines) {
      const product = catalog.find((p) => p.variants.some((v) => v.id === line.variantId));
      const variant = product?.variants.find((v) => v.id === line.variantId);
      if (!product || !variant) continue;
      const current = next[product.id]?.variantStock?.[variant.id] ?? variant.stock;
      next[product.id] = {
        ...next[product.id],
        variantStock: { ...next[product.id]?.variantStock, [variant.id]: Math.max(0, current - line.quantity) },
      };
    }
    return next;
  });
}

export { isInStock };
