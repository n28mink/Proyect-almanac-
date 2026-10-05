import { z } from 'zod';
import { cartInputSchema, orderSchema, paymentMethodSchema, type Order, type Quote } from '@/domain/commerce';
import { getCatalog } from '../repositories/catalog';
import { nextOrderNumber, saveOrder } from '../repositories/orders';
import { computeQuote } from './pricing';

export async function quoteFor(input: unknown): Promise<Quote> {
  return computeQuote(await getCatalog(), cartInputSchema.parse(input));
}

/** Teléfono venezolano o internacional razonable: dígitos, espacios, +, guiones y paréntesis. */
const phone = z.string().trim().min(7).max(30).regex(/^[+\d][\d\s().-]{6,}$/);

const checkoutSchema = z.object({
  cart: cartInputSchema,
  fullName: z.string().trim().min(2).max(80),
  phone,
  address: z.object({
    line1: z.string().trim().min(3).max(160),
    city: z.string().trim().min(2).max(80),
    region: z.string().trim().max(80).optional(),
  }),
  notes: z.string().trim().max(300).optional(),
  paymentMethod: paymentMethodSchema,
});

export type PlaceOrderError = 'invalid' | 'empty' | 'cart_changed';

export type PlaceOrderResult = { ok: true; orderId: string } | { ok: false; error: PlaceOrderError };
export type PlacedOrder = { ok: true; orderId: string; number: string; whatsappUrl: string };

/**
 * Registra el pedido (estado «pendiente de pago») con la forma de pago elegida. No se cobra en línea: el pago
 * (pago móvil, transferencia o efectivo) se coordina por WhatsApp. Todo importe sale de `computeQuote` sobre el catálogo vivo y el inventario
 * se descuenta cuando el administrador confirma el pago. Si lo que el cliente vio ya no coincide → `cart_changed`.
 */
export async function placeOrder(payload: unknown): Promise<PlaceOrderResult> {
  const parsed = checkoutSchema.safeParse(payload);
  if (!parsed.success) return { ok: false, error: 'invalid' };
  const { cart, fullName, phone: tel, address, notes, paymentMethod } = parsed.data;

  const quote = computeQuote(await getCatalog(), cart);
  if (quote.warnings.length > 0) return { ok: false, error: 'cart_changed' };
  if (quote.lines.length === 0) return { ok: false, error: 'empty' };

  const now = new Date().toISOString();
  const order: Order = orderSchema.parse({
    id: crypto.randomUUID(),
    number: await nextOrderNumber(),
    contact: { fullName, phone: tel },
    status: 'pending_payment',
    lines: quote.lines.map((l) => ({
      productId: l.productId, variantId: l.variantId, name: l.name, variantLabel: l.variantLabel, image: l.image,
      unitPrice: l.unitPrice, quantity: l.quantity, lineTotal: l.lineTotal,
    })),
    subtotal: quote.subtotal,
    total: quote.total,
    currency: 'USD',
    shippingAddress: address,
    notes: notes || undefined,
    paymentMethod,
    createdAt: now,
    updatedAt: now,
  });
  await saveOrder(order);
  return { ok: true, orderId: order.id };
}
