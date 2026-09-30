import type { Order, OrderStatus } from '@/domain/commerce';
import { store } from '../store/json-store';

const KEY = 'orders';

export async function listOrders(): Promise<Order[]> {
  const orders = await store.read<Order[]>(KEY, []);
  return orders.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getOrder(id: string): Promise<Order | undefined> {
  return (await listOrders()).find((o) => o.id === id);
}

export async function ordersForUser(userId: string): Promise<Order[]> {
  return (await listOrders()).filter((o) => o.userId === userId);
}

export async function saveOrder(order: Order): Promise<void> {
  await store.update<Order[]>(KEY, [], (orders) => [...orders.filter((o) => o.id !== order.id), order]);
}

export async function setOrderStatus(id: string, status: OrderStatus, extra?: Partial<Order['payment']>): Promise<Order | undefined> {
  let updated: Order | undefined;
  await store.update<Order[]>(KEY, [], (orders) =>
    orders.map((o) => {
      if (o.id !== id) return o;
      updated = { ...o, status, updatedAt: new Date().toISOString(), payment: { ...o.payment, ...extra } };
      return updated;
    }),
  );
  return updated;
}

export async function nextOrderNumber(): Promise<string> {
  const seq = await store.update<{ n: number }>('order-seq', { n: 1000 }, (s) => ({ n: s.n + 1 }));
  const d = new Date();
  const ymd = `${String(d.getFullYear()).slice(2)}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  return `CLV-${ymd}-${seq.n}`;
}
