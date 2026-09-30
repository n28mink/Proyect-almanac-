'use server';

import { headers } from 'next/headers';
import { z } from 'zod';
import { site } from '@/config/site';
import type { Quote } from '@/domain/commerce';
import { env } from '../env';
import { getSessionUser } from '../auth/session';
import { clientKey, rateLimit } from '../security/rate-limit';
import { store } from '../store/json-store';
import { placeOrder, quoteFor, type PlaceOrderResult } from '../services/checkout';

export async function quoteCartAction(input: unknown): Promise<{ ok: true; quote: Quote } | { ok: false }> {
  const h = await headers();
  if (!rateLimit(`quote:${clientKey(h)}`, 60, 60_000).ok) return { ok: false };
  try {
    return { ok: true, quote: await quoteFor(input) };
  } catch {
    return { ok: false };
  }
}

export async function placeOrderAction(payload: unknown, locale: string): Promise<PlaceOrderResult | { ok: false; error: 'rate' }> {
  const h = await headers();
  if (!rateLimit(`order:${clientKey(h)}`, 8, 10 * 60_000).ok) return { ok: false, error: 'rate' };
  const user = await getSessionUser();
  // El origen de las URLs de retorno sale de configuración, nunca de cabeceras del cliente.
  const origin = env().PAYMENT_PROVIDER === 'stripe' ? site.url : '';
  return placeOrder(payload, user?.id ?? null, origin, z.enum(['es', 'en']).catch('es').parse(locale));
}

export type NewsletterState = { ok?: boolean; error?: 'invalid' | 'rate' } | undefined;

export async function subscribeNewsletterAction(_prev: NewsletterState, fd: FormData): Promise<NewsletterState> {
  const h = await headers();
  if (!rateLimit(`news:${clientKey(h)}`, 5, 10 * 60_000).ok) return { error: 'rate' };
  // Campo trampa anti-bots: si viene relleno, se ignora en silencio.
  if (String(fd.get('website') ?? '') !== '') return { ok: true };
  const parsed = z.email().max(120).safeParse(fd.get('email'));
  if (!parsed.success) return { error: 'invalid' };
  await store.update<string[]>('newsletter', [], (list) => (list.includes(parsed.data.toLowerCase()) ? list : [...list, parsed.data.toLowerCase()]));
  return { ok: true };
}
