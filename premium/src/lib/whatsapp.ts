import { site } from '@/config/site';
import type { Order } from '@/domain/commerce';
import { pick } from '@/domain/i18n';
import type { Locale } from '@/i18n/routing';
import { formatMoney } from './format';

export function whatsappUrl(text?: string): string {
  return `https://wa.me/${site.whatsapp}${text ? `?text=${encodeURIComponent(text)}` : ''}`;
}

/** Número legible: +58 412 131 8133. */
export const whatsappDisplay = `+${site.whatsapp.slice(0, 2)} ${site.whatsapp.slice(2, 5)} ${site.whatsapp.slice(5, 8)} ${site.whatsapp.slice(8)}`;

export const greeting = (locale: Locale) => (locale === 'es' ? 'Hola, Clover🍀. Tengo una consulta.' : 'Hello, Clover🍀. I have a question.');

/** Mensaje de pedido para WhatsApp. Lo arma el servidor a partir del pedido ya valorado, nunca del cliente. */
export function orderMessage(order: Order, locale: Locale): string {
  const es = locale === 'es';
  const items = order.lines
    .map((l) => `• ${l.quantity} × ${pick(l.name, locale)} (${pick(l.variantLabel, locale)}) — ${formatMoney(l.lineTotal, locale)}`)
    .join('\n');
  const where = `${es ? 'Entrega en' : 'Delivery to'}: ${[order.shippingAddress.line1, order.shippingAddress.city, order.shippingAddress.region].filter(Boolean).join(', ')}`;
  return [
    es ? `Hola, Clover🍀. Quiero confirmar mi pedido ${order.number}:` : `Hello, Clover🍀. I'd like to confirm my order ${order.number}:`,
    '',
    items,
    '',
    `${es ? 'Total' : 'Total'}: ${formatMoney(order.total, locale)} USD`,
    where,
    `${es ? 'Nombre' : 'Name'}: ${order.contact.fullName}`,
    `${es ? 'Teléfono' : 'Phone'}: ${order.contact.phone}`,
    ...(order.notes ? [`${es ? 'Nota' : 'Note'}: ${order.notes}`] : []),
    '',
    es ? '¿Me confirman disponibilidad, costo de entrega y cómo pagar?' : 'Could you confirm availability, delivery cost and how to pay?',
  ].join('\n');
}
