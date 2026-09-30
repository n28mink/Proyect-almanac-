import type { Order, OrderStatus } from '@/domain/commerce';
import { adjustStock } from './catalog';
import { store } from '../store/json-store';

const KEY = 'orders';

export async function listOrders(): Promise<Order[]> {
  const orders = await store.read<Order[]>(KEY, []);
  return orders.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getOrder(id: string): Promise<Order | undefined> {
  return (await listOrders()).find((o) => o.id === id);
}

export async function saveOrder(order: Order): Promise<void> {
  await store.update<Order[]>(KEY, [], (orders) => [...orders.filter((o) => o.id !== order.id), order]);
}

/**
 * Cambia el estado de un pedido. El inventario se descuenta UNA sola vez, al confirmar el pago (paid);
 * si un pedido pagado se cancela, se repone.
 */
export async function setOrderStatus(id: string, status: OrderStatus): Promise<Order | undefined> {
  const current = await getOrder(id);
  if (!current || current.status === status) return current;
  const wasReserved = current.status === 'paid' || current.status === 'delivered';
  const willReserve = status === 'paid' || status === 'delivered';
  const now = new Date().toISOString();
  const updated: Order = { ...current, status, updatedAt: now, paidAt: willReserve ? (current.paidAt ?? now) : undefined };
  await saveOrder(updated);
  const lines = current.lines.map((l) => ({ variantId: l.variantId, quantity: l.quantity }));
  if (!wasReserved && willReserve) await adjustStock(lines);
  if (wasReserved && !willReserve) await adjustStock(lines.map((l) => ({ ...l, quantity: -l.quantity })));
  return updated;
}

export async function nextOrderNumber(): Promise<string> {
  const seq = await store.update<{ n: number }>('order-seq', { n: 1000 }, (s) => ({ n: s.n + 1 }));
  const d = new Date();
  const ymd = `${String(d.getFullYear()).slice(2)}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  return `CLV-${ymd}-${seq.n}`;
}
