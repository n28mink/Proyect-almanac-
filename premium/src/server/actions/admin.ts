'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { orderStatusSchema } from '@/domain/commerce';
import { assertAdmin } from '../auth/guards';
import { baseCatalog, setOverride } from '../repositories/catalog';
import { saveCampaignOverride } from '../repositories/campaigns';
import { setOrderStatus } from '../repositories/orders';
import { listVideoKeys } from '@/content/media';

const bool = z.union([z.literal('on'), z.literal('true'), z.literal('1')]).optional().transform((v) => !!v);

const productSchema = z.object({
  id: z.string().min(1),
  price: z.coerce.number().min(0).max(100000),
  featured: bool,
  newArrival: bool,
  bestseller: bool,
  hidden: bool,
});

/** Precio y visibilidad de un producto. El stock por variante llega como `stock:<variantId>`. */
export async function updateProductAction(fd: FormData): Promise<void> {
  await assertAdmin();
  const parsed = productSchema.parse(Object.fromEntries(fd));
  const product = baseCatalog().find((p) => p.id === parsed.id);
  if (!product) throw new Error('Producto inexistente');
  const variantStock: Record<string, number> = {};
  for (const v of product.variants) {
    const raw = fd.get(`stock:${v.id}`);
    if (raw !== null) variantStock[v.id] = z.coerce.number().int().min(0).max(100000).parse(raw);
  }
  await setOverride(parsed.id, {
    price: Math.round(parsed.price * 100),
    featured: parsed.featured,
    newArrival: parsed.newArrival,
    bestseller: parsed.bestseller,
    hidden: parsed.hidden,
    variantStock,
  });
  revalidatePath('/[locale]', 'layout');
}

export async function updateOrderStatusAction(fd: FormData): Promise<void> {
  await assertAdmin();
  const { id, status } = z.object({ id: z.string().uuid(), status: orderStatusSchema }).parse(Object.fromEntries(fd));
  await setOrderStatus(id, status);
  revalidatePath('/[locale]/admin/orders', 'page');
}

const blockSchema = z.object({
  block: z.enum(['hero', 'jewelry', 'watches', 'fashion', 'story']),
  videoKey: z.string().min(1).max(80),
  titleEs: z.string().trim().min(1).max(120),
  titleEn: z.string().trim().min(1).max(120),
  textEs: z.string().trim().min(1).max(280),
  textEn: z.string().trim().min(1).max(280),
});

/** Cambia vídeo y textos de un bloque de campaña de la home sin tocar código. */
export async function saveCampaignAction(fd: FormData): Promise<void> {
  await assertAdmin();
  const p = blockSchema.parse(Object.fromEntries(fd));
  if (!listVideoKeys().includes(p.videoKey)) throw new Error('Vídeo inexistente en el registry');
  await saveCampaignOverride(p.block, {
    videoKey: p.videoKey,
    title: { es: p.titleEs, en: p.titleEn },
    text: { es: p.textEs, en: p.textEn },
  });
  revalidatePath('/[locale]', 'layout');
}
