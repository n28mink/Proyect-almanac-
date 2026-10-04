import { site } from '@/config/site';
import { paymentMethodLabel, type Order } from '@/domain/commerce';
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
    ...(order.paymentMethod ? [`${es ? 'Forma de pago' : 'Payment method'}: ${pick(paymentMethodLabel[order.paymentMethod], locale)}`] : []),
    ...(order.notes ? [`${es ? 'Nota' : 'Note'}: ${order.notes}`] : []),
    '',
    closing(order, es),
  ].join('\n');
}

function closing(order: Order, es: boolean): string {
  if (order.paymentMethod === 'efectivo') return es ? '¿Me confirman disponibilidad, costo de entrega y cuándo pago?' : 'Could you confirm availability, delivery cost and when to pay?';
  if (order.paymentMethod) return es ? '¿Me confirman disponibilidad, costo de entrega y los datos para el pago?' : 'Could you confirm availability, delivery cost and the payment details?';
  return es ? '¿Me confirman disponibilidad, costo de entrega y cómo pagar?' : 'Could you confirm availability, delivery cost and how to pay?';
}

/** Consulta para personalizar una camisa: la personalización se cotiza por WhatsApp y no pasa por el carrito. */
export function customizeMessage(name: string, size: string | undefined, locale: Locale): string {
  return locale === 'es'
    ? `Hola, Clover🍀. Quiero personalizar la ${name}${size ? ` en talla ${size}` : ''}. Mi idea es: `
    : `Hello, Clover🍀. I'd like to customize the ${name}${size ? ` in size ${size}` : ''}. My idea is: `;
}
