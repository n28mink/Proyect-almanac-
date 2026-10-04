import { getCategory } from '@/config/taxonomy';
import { getVideo, type VideoAsset } from '@/content/media';
import { isInStock, isSized, type Product } from '@/domain/catalog';
import { pick } from '@/domain/i18n';
import type { Locale } from '@/i18n/routing';

export interface CardImage {
  src: string;
  width: number;
  height: number;
  blur?: string;
  alt: string;
  focal?: { x: number; y: number };
}

/** Subconjunto serializable de un producto para tarjetas, quick view y búsqueda. Ya localizado. */
export interface CardData {
  id: string;
  slug: string;
  name: string;
  categorySlug: string;
  categoryLabel: string;
  price: number;
  image: CardImage;
  hoverImage?: CardImage;
  hoverVideo?: VideoAsset;
  description: string;
  badge?: 'new' | 'bestseller' | 'soldOut' | 'lowStock';
  inStock: boolean;
  variants: Array<{ id: string; label: string; stock: number; imageSrc: string }>;
  /** La variante se elige por talla (camisas). */
  sized: boolean;
  defaultVariantId: string;
  finish: Product['finish'];
  color: string[];
  material: string;
  materialKey: 'steel' | 'metal' | 'textile';
  tags: string[];
  audience: string[];
  collection?: string;
  newArrival: boolean;
  featured: boolean;
  order: number;
}

/** Lo que se elige en la ficha: la talla en prendas, el acabado o la esfera en joyería. */
const optionOf = (p: Product, v: Product['variants'][number]) => (isSized(p) ? v.options.size : v.options.color);

const toImage = (img: Product['images'][number], locale: Locale): CardImage => ({
  src: img.src, width: img.width, height: img.height, blur: img.blur, alt: pick(img.alt, locale), focal: img.focal,
});

export function toCardData(p: Product, locale: Locale): CardData {
  const stock = p.variants.reduce((s, v) => s + v.stock, 0);
  const hover = p.hoverMedia;
  const hoverImage = hover?.type === 'image' ? p.images[hover.imageIndex] : undefined;
  const hoverVideo = hover?.type === 'video' ? (getVideo(hover.key) ?? undefined) : undefined;
  const badge: CardData['badge'] = stock === 0 ? 'soldOut' : stock <= 3 ? 'lowStock' : p.newArrival ? 'new' : p.bestseller ? 'bestseller' : undefined;
  return {
    id: p.id,
    slug: p.slug,
    name: pick(p.name, locale),
    categorySlug: p.category,
    categoryLabel: pick(getCategory(p.category)?.name ?? { es: p.category, en: p.category }, locale),
    price: p.price,
    image: toImage(p.images[0]!, locale),
    hoverImage: hoverImage ? toImage(hoverImage, locale) : p.images[1] ? toImage(p.images[1], locale) : undefined,
    hoverVideo,
    description: pick(p.description, locale),
    badge,
    inStock: isInStock(p),
    variants: p.variants.map((v) => ({ id: v.id, label: pick(optionOf(p, v), locale), stock: v.stock, imageSrc: p.images[v.imageIndex ?? 0]?.src ?? p.thumbnail })),
    sized: isSized(p),
    defaultVariantId: (p.variants.find((v) => v.stock > 0) ?? p.variants[0]!).id,
    finish: p.finish,
    color: p.color.map((c) => pick(c, locale)),
    material: pick(p.material, locale),
    materialKey: p.category === 'shirts' ? 'textile' : /steel/i.test(p.material.en) ? 'steel' : 'metal',
    tags: p.tags,
    audience: p.audience,
    collection: p.collection,
    newArrival: p.newArrival,
    featured: p.featured,
    order: 0,
  };
}

/** Datos de la ficha de producto (localizados y serializables). */
export interface ProductView {
  id: string;
  slug: string;
  name: string;
  categorySlug: string;
  categoryLabel: string;
  collection?: { slug: string; name: string };
  price: number;
  description: string;
  story: string;
  images: CardImage[];
  detailIndex: number;
  variants: Array<{ id: string; label: string; stock: number; imageIndex: number }>;
  sized: boolean;
  customizable: boolean;
  highlights: string[];
  specifications: Array<{ label: string; value: string }>;
  badge?: CardData['badge'];
  material: string;
  videoKey?: string;
  model3d?: { model: NonNullable<Product['model3d']>; dials: Array<{ variantId: string; label: string; color: string }> };
}

export function toProductView(p: Product, locale: Locale, collectionName?: string): ProductView {
  const card = toCardData(p, locale);
  const images = p.images.map((i) => toImage(i, locale));
  return {
    id: p.id,
    slug: p.slug,
    name: card.name,
    categorySlug: p.category,
    categoryLabel: card.categoryLabel,
    collection: p.collection && collectionName ? { slug: p.collection, name: collectionName } : undefined,
    price: p.price,
    description: pick(p.description, locale),
    story: pick(p.story, locale),
    images,
    detailIndex: Math.max(0, p.images.findIndex((i) => i.role === 'detail')),
    variants: p.variants.map((v) => ({ id: v.id, label: pick(optionOf(p, v), locale), stock: v.stock, imageIndex: v.imageIndex ?? 0 })),
    sized: card.sized,
    customizable: p.customizable ?? false,
    highlights: p.highlights.map((h) => pick(h, locale)),
    specifications: p.specifications.map((s) => ({ label: pick(s.label, locale), value: pick(s.value, locale) })),
    badge: card.badge,
    material: card.material,
    videoKey: p.videos[0],
    model3d: p.model3d
      ? { model: p.model3d, dials: p.model3d.dials.map((d) => ({ variantId: d.variantId, color: d.color, label: pick(p.variants.find((v) => v.id === d.variantId)!.options.color, locale) })) }
      : undefined,
  };
}
