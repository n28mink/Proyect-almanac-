import { env } from '@/server/env';
import { adjustStock } from '@/server/repositories/catalog';
import { getOrder, setOrderStatus } from '@/server/repositories/orders';
import { verifyStripeSignature } from '@/server/payments/provider';

export const dynamic = 'force-dynamic';

/**
 * Webhook de Stripe. Firma HMAC verificada sobre el cuerpo CRUDO (comparación en tiempo constante, tolerancia 5 min).
 * La confirmación del pago la decide únicamente este endpoint firmado — nunca la URL de retorno del navegador.
 */
export async function POST(request: Request) {
  const e = env();
  if (e.PAYMENT_PROVIDER !== 'stripe' || !e.STRIPE_WEBHOOK_SECRET) return new Response('Not enabled', { status: 404 });

  const raw = await request.text();
  if (!verifyStripeSignature(raw, request.headers.get('stripe-signature'), e.STRIPE_WEBHOOK_SECRET)) {
    return new Response('Invalid signature', { status: 400 });
  }

  const event = JSON.parse(raw) as { type: string; data: { object: { id: string; client_reference_id?: string; payment_status?: string } } };
  if (event.type === 'checkout.session.completed' && event.data.object.payment_status === 'paid') {
    const orderId = event.data.object.client_reference_id;
    const order = orderId ? await getOrder(orderId) : undefined;
    if (order && order.status === 'pending_payment') {
      await setOrderStatus(order.id, 'paid', { reference: event.data.object.id, paidAt: new Date().toISOString() });
      await adjustStock(order.lines.map((l) => ({ variantId: l.variantId, quantity: l.quantity })));
    }
  }
  return new Response('ok');
}
