'use server';

import { headers } from 'next/headers';
import type { Quote } from '@/domain/commerce';
import { orderMessage, whatsappUrl } from '@/lib/whatsapp';
import { clientKey, rateLimit } from '../security/rate-limit';
import { getOrder } from '../repositories/orders';
import { placeOrder, quoteFor, type PlacedOrder, type PlaceOrderResult } from '../services/checkout';

export async function quoteCartAction(input: unknown): Promise<{ ok: true; quote: Quote } | { ok: false }> {
  const h = await headers();
  if (!rateLimit(`quote:${clientKey(h)}`, 60, 60_000).ok) return { ok: false };
  try {
    return { ok: true, quote: await quoteFor(input) };
  } catch {
    return { ok: false };
  }
}

/**
 * Registra el pedido y devuelve ya el enlace de WhatsApp con el mensaje armado a partir del pedido valorado en el
 * servidor: así el navegador puede abrirlo de inmediato, mientras el toque del cliente sigue activo.
 */
export async function placeOrderAction(payload: unknown): Promise<PlacedOrder | Exclude<PlaceOrderResult, { ok: true }> | { ok: false; error: 'rate' }> {
  const h = await headers();
  if (!rateLimit(`order:${clientKey(h)}`, 8, 10 * 60_000).ok) return { ok: false, error: 'rate' };
  const res = await placeOrder(payload);
  if (!res.ok) return res;
  const order = await getOrder(res.orderId);
  if (!order) return { ok: false, error: 'invalid' };
  const locale = (payload as { locale?: unknown } | null)?.locale === 'en' ? 'en' : 'es';
  return { ...res, number: order.number, whatsappUrl: whatsappUrl(orderMessage(order, locale)) };
}
