'use server';

import { headers } from 'next/headers';
import type { Quote } from '@/domain/commerce';
import { clientKey, rateLimit } from '../security/rate-limit';
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

export async function placeOrderAction(payload: unknown): Promise<PlaceOrderResult | { ok: false; error: 'rate' }> {
  const h = await headers();
  if (!rateLimit(`order:${clientKey(h)}`, 8, 10 * 60_000).ok) return { ok: false, error: 'rate' };
  return placeOrder(payload);
}
