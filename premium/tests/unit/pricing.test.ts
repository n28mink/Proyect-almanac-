import { describe, expect, it } from 'vitest';
import { promotions } from '@/content/promotions';
import { cartInputSchema } from '@/domain/commerce';
import { baseCatalog } from '@/server/repositories/catalog';
import { computeQuote } from '@/server/services/pricing';

const catalog = baseCatalog();
const ring = catalog.find((p) => p.id === 'an02')!;
const watch = catalog.find((p) => p.id === 'rw04')!;
const line = (p: (typeof catalog)[number], quantity = 1) => ({ productId: p.id, variantId: p.variants[0]!.id, quantity });
const input = (over: Record<string, unknown>) => cartInputSchema.parse({ lines: [], ...over });

describe('computeQuote (el servidor es la única autoridad de precios)', () => {
  it('suma subtotales desde el catálogo, no desde el cliente', () => {
    const q = computeQuote(catalog, promotions, input({ lines: [line(ring, 2), line(watch)] }));
    expect(q.subtotal).toBe(ring.price * 2 + watch.price);
  });

  it('descarta variantes o productos inexistentes', () => {
    const q = computeQuote(catalog, promotions, input({ lines: [{ productId: 'nope', variantId: 'nope', quantity: 1 }, line(ring)] }));
    expect(q.lines).toHaveLength(1);
    expect(q.warnings).toContain('item_unavailable');
  });

  it('ajusta la cantidad al stock disponible', () => {
    const limited = catalog.map((p) => (p.id === ring.id ? { ...p, variants: p.variants.map((v) => ({ ...v, stock: 2 })) } : p));
    const q = computeQuote(limited, promotions, input({ lines: [line(ring, 9)] }));
    expect(q.lines[0]!.quantity).toBe(2);
    expect(q.lines[0]!.adjusted).toBe(true);
    expect(q.warnings).toContain('stock_adjusted');
  });

  it('aplica códigos válidos y rechaza los inválidos o bajo el mínimo', () => {
    const ok = computeQuote(catalog, promotions, input({ lines: [line(watch)], promoCode: 'bienvenida10' }));
    expect(ok.discount).toBe(Math.round(watch.price * 0.1));
    const bad = computeQuote(catalog, promotions, input({ lines: [line(watch)], promoCode: 'FAKE' }));
    expect(bad.discount).toBe(0);
    expect(bad.warnings).toContain('promo_invalid');
    const low = computeQuote(catalog, promotions, input({ lines: [line(ring)], promoCode: 'ENVIOGRATIS' }));
    expect(low.warnings).toContain('promo_min_subtotal');
  });

  it('envío gratis desde el umbral (solo estándar) y retiro siempre gratis', () => {
    const big = computeQuote(catalog, promotions, input({ lines: [line(watch, 2)] }));
    expect(big.subtotal).toBeGreaterThanOrEqual(big.freeShippingThreshold);
    expect(big.shipping).toBe(0);
    const express = computeQuote(catalog, promotions, input({ lines: [line(watch, 2)], shippingMethod: 'express' }));
    expect(express.shipping).toBeGreaterThan(0);
    const small = computeQuote(catalog, promotions, input({ lines: [line(ring)], shippingMethod: 'pickup' }));
    expect(small.shipping).toBe(0);
  });

  it('el total = subtotal − descuento + envío + impuestos y nunca es negativo', () => {
    const q = computeQuote(catalog, promotions, input({ lines: [line(ring)] }));
    expect(q.total).toBe(q.subtotal - q.discount + q.shipping + q.tax);
    expect(q.total).toBeGreaterThanOrEqual(0);
  });

  it('un carrito vacío no cobra envío', () => {
    expect(computeQuote(catalog, promotions, input({ lines: [] })).total).toBe(0);
  });

  it('el esquema rechaza cantidades absurdas y campos de precio del cliente se ignoran', () => {
    expect(() => cartInputSchema.parse({ lines: [{ productId: 'a', variantId: 'b', quantity: 999 }] })).toThrow();
    const parsed = cartInputSchema.parse({ lines: [{ productId: 'a', variantId: 'b', quantity: 1, price: 1 }] });
    expect(parsed.lines[0]).not.toHaveProperty('price');
  });
});
