import { z } from 'zod';
import { localizedSchema } from './i18n';

/** Importes en céntimos enteros (moneda base USD). Nunca floats. */
export const cents = z.number().int().nonnegative();

export const categorySlugs = ['earrings', 'necklaces', 'rings', 'bracelets', 'watches', 'accessories'] as const;
export const categorySlugSchema = z.enum(categorySlugs);
export type CategorySlug = z.infer<typeof categorySlugSchema>;

export const audienceSchema = z.enum(['women', 'men']);
export type Audience = z.infer<typeof audienceSchema>;

export const collectionSlugSchema = z.enum(['lumiere', 'aurea', 'jardin', 'corazon', 'tiempo']);
export type CollectionSlug = z.infer<typeof collectionSlugSchema>;

export const imageAssetSchema = z.object({
  src: z.string().startsWith('/media/'),
  alt: localizedSchema,
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  /** Placeholder borroso en base64 (data URL). */
  blur: z.string().optional(),
  /** Color dominante para fondos de carga. */
  tone: z.string().optional(),
  /** Punto focal 0–1 para recortes con object-position. */
  focal: z.object({ x: z.number().min(0).max(1), y: z.number().min(0).max(1) }).optional(),
  /** `detail` = recorte macro derivado de la foto principal. */
  role: z.enum(['main', 'detail', 'lifestyle']).default('main'),
});
export type ImageAsset = z.infer<typeof imageAssetSchema>;

export const specificationSchema = z.object({
  label: localizedSchema,
  value: localizedSchema,
});
export type Specification = z.infer<typeof specificationSchema>;

export const variantSchema = z.object({
  id: z.string(),
  sku: z.string(),
  options: z.object({
    color: localizedSchema,
    size: localizedSchema,
  }),
  /** Sobrescribe el precio del producto si la variante cuesta distinto. */
  price: cents.optional(),
  /** Foto de la galería que corresponde a esta variante. */
  imageIndex: z.number().int().nonnegative().optional(),
  stock: z.number().int().nonnegative(),
});
export type Variant = z.infer<typeof variantSchema>;

export const hoverMediaSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('image'), imageIndex: z.number().int().nonnegative() }),
  z.object({ type: z.literal('video'), key: z.string() }),
]);
export type HoverMedia = z.infer<typeof hoverMediaSchema>;

export const finishKeySchema = z.enum(['yellow-gold', 'rose-gold', 'silver']);
export type FinishKey = z.infer<typeof finishKeySchema>;

/** Visor 3D procedural. Hoy solo relojes; `ring` queda reservado para modelos GLB reales. */
export const model3dSchema = z.object({
  kind: z.enum(['ring', 'watch']),
  caseShape: z.enum(['round', 'square', 'rect']).default('round'),
  strap: z.enum(['mesh', 'link', 'sport']).default('link'),
  finishes: z.array(finishKeySchema).min(1),
  defaultFinish: finishKeySchema,
  /** Color de esfera por variante (hex). */
  dials: z.array(z.object({ variantId: z.string(), color: z.string() })).default([]),
});
export type Model3d = z.infer<typeof model3dSchema>;

export const productSchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: localizedSchema,
  description: localizedSchema,
  /** Relato editorial (sección "Story" de la ficha). */
  story: localizedSchema,
  /** Categoría principal (tipo de pieza). */
  category: categorySlugSchema,
  /** Todas las categorías navegables: tipo, "jewelry", público, "gifts", "new-arrivals"... */
  categories: z.array(z.string()),
  collection: collectionSlugSchema.optional(),
  audience: z.array(audienceSchema).min(1),
  tags: z.array(z.string()),
  price: cents,
  compareAtPrice: cents.optional(),
  currency: z.literal('USD'),
  material: localizedSchema,
  color: z.array(localizedSchema),
  /** Familia cromática para filtros: gold | silver | rose | multi. */
  finish: z.enum(['gold', 'silver', 'rose', 'mixed']),
  sizes: z.array(localizedSchema),
  variants: z.array(variantSchema).min(1),
  images: z.array(imageAssetSchema).min(1),
  /** Claves del media registry (vídeos de la pieza). */
  videos: z.array(z.string()),
  thumbnail: z.string(),
  hoverMedia: hoverMediaSchema.optional(),
  /** Puntos destacados (viñetas de la ficha original). */
  highlights: z.array(localizedSchema),
  specifications: z.array(specificationSchema),
  /** Total denormalizado: suma del stock de las variantes. */
  stock: z.number().int().nonnegative(),
  featured: z.boolean(),
  newArrival: z.boolean(),
  bestseller: z.boolean(),
  model3d: model3dSchema.optional(),
  seo: z.object({ title: localizedSchema, description: localizedSchema }),
});
export type Product = z.infer<typeof productSchema>;

export const catalogSchema = z.array(productSchema);

export const collectionSchema = z.object({
  slug: collectionSlugSchema,
  name: localizedSchema,
  tagline: localizedSchema,
  description: localizedSchema,
  /** Clave del media registry para la portada de la colección. */
  cover: z.string(),
  /** Clave de vídeo de campaña (opcional). */
  video: z.string().optional(),
  tone: z.enum(['light', 'ink', 'evergreen']).default('light'),
});
export type Collection = z.infer<typeof collectionSchema>;

export function variantPrice(product: Product, variant: Variant): number {
  return variant.price ?? product.price;
}

export function isInStock(product: Product): boolean {
  return product.variants.some((v) => v.stock > 0);
}
