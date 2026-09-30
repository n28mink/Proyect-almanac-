import { addressInputSchema, cartInputSchema, orderSchema, type Order, type Quote } from '@/domain/commerce';
import { promotions } from '@/content/promotions';
import { adjustStock, getCatalog } from '../repositories/catalog';
import { nextOrderNumber, saveOrder } from '../repositories/orders';
import { paymentProvider } from '../payments/provider';
import { computeQuote } from './pricing';
import { z } from 'zod';

export async function quoteFor(input: unknown): Promise<Quote> {
  const cart = cartInputSchema.parse(input);
  return computeQuote(await getCatalog(), promotions, cart);
}

const checkoutSchema = z.object({
  cart: cartInputSchema,
  email: z.email().max(120),
  address: addressInputSchema.optional(),
});

export type PlaceOrderError = 'invalid' | 'empty' | 'cart_changed' | 'address_required' | 'payment_failed';

export type PlaceOrderResult = { ok: true; orderId: string; redirectUrl: string } | { ok: false; error: PlaceOrderError };

/**
 * Crea el pedido. Todo importe sale de `computeQuote` sobre el catálogo vivo; el cliente no aporta precios.
 * Si la valoración difiere de lo que el usuario vio (stock/promo), se devuelve `cart_changed` para que revise.
 */
export async function placeOrder(payload: unknown, userId: string | null, origin: string, locale: string): Promise<PlaceOrderResult> {
  const parsed = checkoutSchema.safeParse(payload);
  if (!parsed.success) return { ok: false, error: 'invalid' };
  const { cart, email, address } = parsed.data;

  const quote = computeQuote(await getCatalog(), promotions, cart);
  if (quote.lines.length === 0) return { ok: false, error: 'empty' };
  if (quote.warnings.some((w) => w === 'stock_adjusted' || w === 'item_unavailable')) return { ok: false, error: 'cart_changed' };
  if (cart.shippingMethod !== 'pickup' && !address) return { ok: false, error: 'address_required' };

  const now = new Date().toISOString();
  const order: Order = orderSchema.parse({
    id: crypto.randomUUID(),
    number: await nextOrderNumber(),
    userId,
    email,
    status: 'pending_payment',
    lines: quote.lines.map((l) => ({
      productId: l.productId, variantId: l.variantId, name: l.name, variantLabel: l.variantLabel, image: l.image,
      unitPrice: l.unitPrice, quantity: l.quantity, lineTotal: l.lineTotal,
    })),
    subtotal: quote.subtotal,
    discount: quote.discount,
    shipping: quote.shipping,
    tax: quote.tax,
    total: quote.total,
    currency: 'USD',
    promoCode: quote.promo?.code,
    shippingMethod: cart.shippingMethod,
    shippingAddress: address
      ? {
          fullName: address.fullName, line1: address.line1, line2: address.line2, city: address.city, region: address.region,
          postalCode: address.postalCode, country: address.country, phone: address.phone,
        }
      : null,
    payment: { provider: paymentProvider().id },
    createdAt: now,
    updatedAt: now,
  });

  await saveOrder(order);

  try {
    const base = `${origin}/${locale}/checkout`;
    const session = await paymentProvider().createSession(order, { success: `${base}/success?order=${order.id}`, cancel: `${base}?cancelled=1` });
    if (session.paid) {
      await saveOrder({ ...order, status: 'paid', updatedAt: new Date().toISOString(), payment: { ...order.payment, reference: session.reference, paidAt: new Date().toISOString() } });
      await adjustStock(order.lines.map((l) => ({ variantId: l.variantId, quantity: l.quantity })));
    } else {
      await saveOrder({ ...order, payment: { ...order.payment, reference: session.reference } });
    }
    return { ok: true, orderId: order.id, redirectUrl: session.redirectUrl };
  } catch {
    return { ok: false, error: 'payment_failed' };
  }
}

