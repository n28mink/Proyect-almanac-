import { site } from '@/config/site';
import type { Localized } from '@/domain/i18n';
import { L } from '@/domain/i18n';

export interface LegalDoc {
  slug: 'privacy' | 'terms' | 'shipping-returns';
  title: Localized;
  updated: string;
  sections: Array<{ heading: Localized; text: Localized }>;
}

/**
 * Textos legales base. Son una plantilla razonable, NO asesoría legal: revisar con un profesional antes de publicar
 * y ajustar plazos/condiciones a la operación real de Clover.
 */
export const RETURN_WINDOW_DAYS = 7;

export const legalDocs: LegalDoc[] = [
  {
    slug: 'privacy',
    title: L('Política de privacidad', 'Privacy policy'),
    updated: '2026-09-30',
    sections: [
      { heading: L('Qué datos usamos', 'What data we use'), text: L('Solo los necesarios para atender tu pedido: nombre, correo, dirección de entrega y teléfono. Si creas una cuenta, guardamos además tu contraseña de forma cifrada (nunca en texto plano).', 'Only what is needed to fulfil your order: name, email, delivery address and phone. If you create an account we also store your password in hashed form (never in plain text).') },
      { heading: L('Cookies y almacenamiento', 'Cookies and storage'), text: L('Usamos una cookie de sesión esencial y almacenamiento local para recordar tu carrito, favoritos, idioma y moneda. No usamos cookies publicitarias ni rastreadores de terceros.', 'We use an essential session cookie and local storage to remember your cart, favorites, language and currency. We do not use advertising cookies or third-party trackers.') },
      { heading: L('Pagos', 'Payments'), text: L('Los datos de tarjeta nunca pasan por nuestros servidores: los procesa el proveedor de pagos.', 'Card details never pass through our servers: they are processed by the payment provider.') },
      { heading: L('Tus derechos', 'Your rights'), text: L(`Puedes pedir acceso, corrección o eliminación de tus datos escribiendo a ${site.email} o por WhatsApp.`, `You can request access, correction or deletion of your data by writing to ${site.email} or via WhatsApp.`) },
    ],
  },
  {
    slug: 'terms',
    title: L('Términos y condiciones', 'Terms and conditions'),
    updated: '2026-09-30',
    sections: [
      { heading: L('Precios y disponibilidad', 'Prices and availability'), text: L('Los precios se muestran en USD; la moneda de visualización elegida es solo referencial. La disponibilidad se confirma al hacer el pedido.', 'Prices are shown in USD; the display currency you choose is for reference only. Availability is confirmed when you place the order.') },
      { heading: L('Descripción de las piezas', 'Product descriptions'), text: L('Describimos cada pieza según la información de su ficha. Los tonos (dorado, plateado, oro rosa) son acabados; no implican metales preciosos salvo que se indique.', 'We describe each piece according to its listing. Tones (gold, silver, rose gold) are finishes; they do not imply precious metals unless stated.') },
      { heading: L('Pedidos', 'Orders'), text: L('Un pedido queda confirmado cuando el pago se acredita. Podemos cancelar y reembolsar un pedido si una pieza deja de estar disponible.', 'An order is confirmed when payment is received. We may cancel and refund an order if a piece is no longer available.') },
    ],
  },
  {
    slug: 'shipping-returns',
    title: L('Envíos y devoluciones', 'Shipping and returns'),
    updated: '2026-09-30',
    sections: [
      { heading: L('Envíos', 'Shipping'), text: L(`Envío estándar de ${site.shipping.standard.days[0]} a ${site.shipping.standard.days[1]} días hábiles y exprés de ${site.shipping.express.days[0]} a ${site.shipping.express.days[1]}. Envío estándar gratis desde $${site.freeShippingThreshold / 100}. También puedes retirar en tienda.`, `Standard shipping in ${site.shipping.standard.days[0]}–${site.shipping.standard.days[1]} business days and express in ${site.shipping.express.days[0]}–${site.shipping.express.days[1]}. Free standard shipping from $${site.freeShippingThreshold / 100}. In-store pickup is also available.`) },
      { heading: L('Devoluciones', 'Returns'), text: L(`Aceptamos devoluciones dentro de ${RETURN_WINDOW_DAYS} días desde la entrega si la pieza está sin usar y en su empaque original. Escríbenos por WhatsApp para coordinarla.`, `We accept returns within ${RETURN_WINDOW_DAYS} days of delivery if the piece is unworn and in its original packaging. Message us on WhatsApp to arrange it.`) },
      { heading: L('Cuidado', 'Care'), text: L('Limpia con un paño suave y seco y guarda cada pieza por separado.', 'Clean with a soft, dry cloth and store each piece separately.') },
    ],
  },
];

export function getLegal(slug: string) {
  return legalDocs.find((d) => d.slug === slug);
}
