'use server';

import { z } from 'zod';
import { toCardData, type CardData } from '@/lib/card-data';
import { getCatalog } from '../repositories/catalog';

/** Tarjetas para una lista de ids (favoritos). Ids desconocidos se descartan. */
export async function getCardsAction(ids: string[], locale: string): Promise<CardData[]> {
  const list = z.array(z.string().max(64)).max(200).parse(ids);
  const lang = z.enum(['es', 'en']).catch('es').parse(locale);
  const catalog = await getCatalog();
  return list.map((id) => catalog.find((p) => p.id === id)).filter((p): p is NonNullable<typeof p> => !!p).map((p) => toCardData(p, lang));
}
