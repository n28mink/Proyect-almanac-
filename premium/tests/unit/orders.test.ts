import fs from 'node:fs';
import path from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type * as Checkout from '@/server/services/checkout';
import type * as Catalog from '@/server/repositories/catalog';
import type * as Orders from '@/server/repositories/orders';

const dir = `.data-test-${process.pid}`;
let placeOrder: typeof Checkout.placeOrder;
let setOrderStatus: typeof Orders.setOrderStatus;
let getOrder: typeof Orders.getOrder;
let getCatalog: typeof Catalog.getCatalog;

beforeAll(async () => {
  process.env.DATA_DIR = dir;
  ({ placeOrder } = await import('@/server/services/checkout'));
  ({ setOrderStatus, getOrder } = await import('@/server/repositories/orders'));
  ({ getCatalog } = await import('@/server/repositories/catalog'));
});
afterAll(() => fs.rmSync(path.join(process.cwd(), dir), { recursive: true, force: true }));

const base = { fullName: 'Ana Pérez', phone: '0412 555 1234', address: { line1: 'Av. Principal, casa 3', city: 'Turmero', region: 'Aragua' }, paymentMethod: 'transferencia' };

describe('pedido por WhatsApp (sin pago en línea)', () => {
  it('registra el pedido pendiente con importes del servidor y NO toca el inventario', async () => {
    const before = (await getCatalog()).find((p) => p.id === 'an02')!;
    const v = before.variants[0]!;
    const res = await placeOrder({ ...base, cart: { lines: [{ productId: 'an02', variantId: v.id, quantity: 2 }] }, price: 1 });
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    const order = (await getOrder(res.orderId))!;
    expect(order.status).toBe('pending_payment');
    expect(order.paymentMethod).toBe('transferencia');
    expect(order.total).toBe(before.price * 2);
    expect(order.number).toMatch(/^CLV-\d{6}-\d+$/);
    const after = (await getCatalog()).find((p) => p.id === 'an02')!;
    expect(after.variants[0]!.stock).toBe(v.stock);

    // Confirmar el pago descuenta una sola vez; cancelar lo repone.
    await setOrderStatus(order.id, 'paid');
    await setOrderStatus(order.id, 'paid');
    expect((await getCatalog()).find((p) => p.id === 'an02')!.variants[0]!.stock).toBe(v.stock - 2);
    await setOrderStatus(order.id, 'delivered');
    expect((await getCatalog()).find((p) => p.id === 'an02')!.variants[0]!.stock).toBe(v.stock - 2);
    await setOrderStatus(order.id, 'cancelled');
    expect((await getCatalog()).find((p) => p.id === 'an02')!.variants[0]!.stock).toBe(v.stock);
  });

  it('rechaza datos inválidos, carrito vacío y carrito cambiado', async () => {
    const line = { productId: 'an02', variantId: (await getCatalog()).find((p) => p.id === 'an02')!.variants[0]!.id, quantity: 1 };
    expect(await placeOrder({ ...base, phone: 'abc', cart: { lines: [line] } })).toEqual({ ok: false, error: 'invalid' });
    expect(await placeOrder({ ...base, address: undefined, cart: { lines: [line] } })).toEqual({ ok: false, error: 'invalid' });
    expect(await placeOrder({ ...base, cart: { lines: [] } })).toEqual({ ok: false, error: 'empty' });
    expect(await placeOrder({ ...base, cart: { lines: [{ ...line, variantId: 'fantasma' }] } })).toEqual({ ok: false, error: 'cart_changed' });
    expect(await placeOrder({ ...base, cart: { lines: [{ ...line, quantity: 999 }] } })).toEqual({ ok: false, error: 'invalid' });
  });

  it('exige una forma de pago conocida', async () => {
    const line = { productId: 'an02', variantId: (await getCatalog()).find((p) => p.id === 'an02')!.variants[0]!.id, quantity: 1 };
    expect(await placeOrder({ ...base, paymentMethod: undefined, cart: { lines: [line] } })).toEqual({ ok: false, error: 'invalid' });
    expect(await placeOrder({ ...base, paymentMethod: 'tarjeta', cart: { lines: [line] } })).toEqual({ ok: false, error: 'invalid' });
    const ok = await placeOrder({ ...base, paymentMethod: 'efectivo', cart: { lines: [line] } });
    expect(ok.ok && (await getOrder(ok.orderId))!.paymentMethod).toBe('efectivo');
  });

  it('una camisa entra al pedido por talla, a 12 USD', async () => {
    const shirt = (await getCatalog()).find((p) => p.id === 'cm04')!;
    const m = shirt.variants.find((v) => v.options.size.es === 'M')!;
    const res = await placeOrder({ ...base, cart: { lines: [{ productId: shirt.id, variantId: m.id, quantity: 2 }] } });
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    const order = (await getOrder(res.orderId))!;
    expect(order.lines[0]!.variantLabel).toEqual({ es: 'Talla M', en: 'Size M' });
    expect(order.total).toBe(2400);
  });
});
