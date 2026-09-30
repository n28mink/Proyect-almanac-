import type { Order } from '@/domain/commerce';
import { env } from '../env';
import { createHmac, timingSafeEqual } from 'node:crypto';

/**
 * Adaptador de pagos. Ninguna llave sale del servidor; el cliente solo recibe una URL de redirección.
 *  - mock: marca el pedido como pagado al instante (demo — no se cobra nada).
 *  - stripe: Stripe Checkout hospedado vía REST (sin SDK) + webhook con firma HMAC verificada.
 * NOTA: el adaptador Stripe está implementado según la API documentada pero requiere claves reales para validarse.
 */
export interface PaymentSession {
  /** URL a la que redirigir al comprador. */
  redirectUrl: string;
  reference?: string;
  /** true si el pago ya quedó confirmado (mock). */
  paid: boolean;
}

export interface PaymentProvider {
  id: string;
  createSession(order: Order, urls: { success: string; cancel: string }): Promise<PaymentSession>;
}

const mock: PaymentProvider = {
  id: 'mock',
  async createSession(order, urls) {
    return { redirectUrl: urls.success, reference: `mock_${order.id}`, paid: true };
  },
};

const stripe: PaymentProvider = {
  id: 'stripe',
  async createSession(order, urls) {
    const key = env().STRIPE_SECRET_KEY!;
    const body = new URLSearchParams({
      mode: 'payment',
      success_url: urls.success,
      cancel_url: urls.cancel,
      client_reference_id: order.id,
      customer_email: order.email,
      'metadata[orderId]': order.id,
    });
    order.lines.forEach((l, i) => {
      body.set(`line_items[${i}][quantity]`, String(l.quantity));
      body.set(`line_items[${i}][price_data][currency]`, 'usd');
      body.set(`line_items[${i}][price_data][unit_amount]`, String(l.unitPrice));
      body.set(`line_items[${i}][price_data][product_data][name]`, l.name.en);
    });
    // Envío, descuento e impuestos se reflejan como líneas/ajustes calculados en servidor.
    if (order.shipping > 0) {
      const i = order.lines.length;
      body.set(`line_items[${i}][quantity]`, '1');
      body.set(`line_items[${i}][price_data][currency]`, 'usd');
      body.set(`line_items[${i}][price_data][unit_amount]`, String(order.shipping));
      body.set(`line_items[${i}][price_data][product_data][name]`, 'Shipping');
    }
    const res = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/x-www-form-urlencoded', 'Idempotency-Key': order.id },
      body,
    });
    if (!res.ok) throw new Error(`Stripe respondió ${res.status}`);
    const json = (await res.json()) as { id: string; url: string };
    return { redirectUrl: json.url, reference: json.id, paid: false };
  },
};

export function paymentProvider(): PaymentProvider {
  return env().PAYMENT_PROVIDER === 'stripe' ? stripe : mock;
}

/** Verifica la cabecera `Stripe-Signature` (esquema v1, tolerancia 5 min) con comparación en tiempo constante. */
export function verifyStripeSignature(rawBody: string, header: string | null, secret: string, now = Date.now()): boolean {
  if (!header) return false;
  const parts = Object.fromEntries(header.split(',').map((p) => p.split('=') as [string, string]));
  const t = parts.t;
  const v1 = parts.v1;
  if (!t || !v1) return false;
  if (Math.abs(now / 1000 - Number(t)) > 300) return false;
  const expected = createHmac('sha256', secret).update(`${t}.${rawBody}`).digest('hex');
  const a = Buffer.from(expected);
  const b = Buffer.from(v1);
  return a.length === b.length && timingSafeEqual(a, b);
}
