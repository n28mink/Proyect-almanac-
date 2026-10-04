import { describe, expect, it } from 'vitest';
import { cartInputSchema } from '@/domain/commerce';
import { baseCatalog } from '@/server/repositories/catalog';
import { computeQuote } from '@/server/services/pricing';

const catalog = baseCatalog();
const ring = catalog.find((p) => p.id === 'an02')!;
const watch = catalog.find((p) => p.id === 'rw04')!;
const line = (p: (typeof catalog)[number], quantity = 1) => ({ productId: p.id, variantId: p.variants[0]!.id, quantity });
const input = (lines: unknown[]) => cartInputSchema.parse({ lines });

describe('computeQuote (el servidor es la única autoridad de precios)', () => {
  it('suma subtotales desde el catálogo, no desde el cliente', () => {
    const q = computeQuote(catalog, input([line(ring, 2), line(watch)]));
    expect(q.subtotal).toBe(ring.price * 2 + watch.price);
    expect(q.total).toBe(q.subtotal);
    expect(q.currency).toBe('USD');
  });

  it('descarta variantes o productos inexistentes', () => {
    const q = computeQuote(catalog, input([{ productId: 'nope', variantId: 'nope', quantity: 1 }, line(ring)]));
    expect(q.lines).toHaveLength(1);
    expect(q.warnings).toContain('item_unavailable');
  });

  it('descarta variantes agotadas', () => {
    const soldOut = catalog.map((p) => (p.id === ring.id ? { ...p, variants: p.variants.map((v) => ({ ...v, stock: 0 })) } : p));
    const q = computeQuote(soldOut, input([line(ring)]));
    expect(q.lines).toHaveLength(0);
    expect(q.warnings).toContain('item_unavailable');
  });

  it('ajusta la cantidad al stock disponible', () => {
    const limited = catalog.map((p) => (p.id === ring.id ? { ...p, variants: p.variants.map((v) => ({ ...v, stock: 2 })) } : p));
    const q = computeQuote(limited, input([line(ring, 9)]));
    expect(q.lines[0]!.quantity).toBe(2);
    expect(q.lines[0]!.adjusted).toBe(true);
    expect(q.warnings).toContain('stock_adjusted');
  });

  it('un carrito vacío vale cero', () => {
    expect(computeQuote(catalog, input([])).total).toBe(0);
  });

  it('el esquema rechaza cantidades absurdas y descarta campos de precio o de descuento enviados por el cliente', () => {
    expect(() => cartInputSchema.parse({ lines: [{ productId: 'a', variantId: 'b', quantity: 999 }] })).toThrow();
    const parsed = cartInputSchema.parse({ lines: [{ productId: 'a', variantId: 'b', quantity: 1, price: 1 }], promoCode: 'X', discount: 99 });
    expect(parsed.lines[0]).not.toHaveProperty('price');
    expect(parsed).not.toHaveProperty('promoCode');
    expect(parsed).not.toHaveProperty('discount');
  });
});

describe('mensaje de pedido para WhatsApp', () => {
  it('incluye número, líneas, total, dirección y contacto, todo del pedido ya valorado', async () => {
    const { orderMessage, whatsappUrl } = await import('@/lib/whatsapp');
    const order = {
      id: 'x', number: 'CLV-260930-1001', contact: { fullName: 'Ana Pérez', phone: '0412 000 0000' }, status: 'pending_payment' as const,
      lines: [{ productId: ring.id, variantId: 'v', name: ring.name, variantLabel: { es: 'Dorado', en: 'Gold' }, image: '/x.jpg', unitPrice: 1650, quantity: 2, lineTotal: 3300 }],
      subtotal: 3300, total: 3300, currency: 'USD' as const, shippingAddress: { line1: 'Av. Principal, casa 3', city: 'Turmero', region: 'Aragua' }, createdAt: '', updatedAt: '',
    };
    const es = orderMessage(order, 'es');
    for (const part of ['CLV-260930-1001', '2 ×', 'Turmero', 'Ana Pérez', '0412 000 0000', 'Total']) expect(es).toContain(part);
    expect(orderMessage(order, 'en')).toContain('Delivery to');
    expect(whatsappUrl('hola mundo')).toBe('https://wa.me/584121318133?text=hola%20mundo');
  });

  it('incluye la forma de pago elegida y ajusta la pregunta final', async () => {
    const { orderMessage } = await import('@/lib/whatsapp');
    const order = {
      id: 'x', number: 'CLV-1', contact: { fullName: 'Ana Pérez', phone: '0412 000 0000' }, status: 'pending_payment' as const,
      lines: [{ productId: 'cm01', variantId: 'cm01-m', name: { es: 'Camisa', en: 'T-shirt' }, variantLabel: { es: 'Talla M', en: 'Size M' }, image: '/x.jpg', unitPrice: 1200, quantity: 1, lineTotal: 1200 }],
      subtotal: 1200, total: 1200, currency: 'USD' as const, shippingAddress: { line1: 'Calle 1', city: 'Maracay' }, createdAt: '', updatedAt: '',
    };
    const movil = orderMessage({ ...order, paymentMethod: 'pago-movil' }, 'es');
    expect(movil).toContain('Forma de pago: Pago móvil');
    expect(movil).toContain('(Talla M)');
    expect(movil).toContain('los datos para el pago');
    expect(orderMessage({ ...order, paymentMethod: 'efectivo' }, 'es')).toContain('Forma de pago: Efectivo');
    expect(orderMessage({ ...order, paymentMethod: 'transferencia' }, 'en')).toContain('Payment method: Bank transfer');
    expect(orderMessage(order, 'es')).not.toContain('Forma de pago');
  });

  it('la consulta de personalización lleva la camisa y la talla', async () => {
    const { customizeMessage } = await import('@/lib/whatsapp');
    expect(customizeMessage('Camisa Margaritas', 'L', 'es')).toContain('Camisa Margaritas en talla L');
    expect(customizeMessage('Daisies T-shirt', undefined, 'en')).not.toContain('size');
  });
});
