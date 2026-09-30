import type { Localized } from '@/domain/i18n';
import { L } from '@/domain/i18n';
import { whatsappDisplay } from '@/lib/whatsapp';

export interface LegalDoc {
  slug: 'privacy' | 'terms' | 'shipping' | 'cookies';
  title: Localized;
  updated: string;
  sections: Array<{ heading: Localized; text: Localized }>;
}

const WA = whatsappDisplay;

/**
 * Textos legales de Clover, tomados de los del catálogo original (Venezuela, pedidos por WhatsApp) y adaptados a la
 * tienda nueva: el pedido se registra en nuestro sistema antes de confirmarse por WhatsApp. Sigue siendo una base:
 * revísalos con un profesional antes de publicar.
 */
export const legalDocs: LegalDoc[] = [
  {
    slug: 'privacy',
    title: L('Política de privacidad', 'Privacy policy'),
    updated: '2026-09-30',
    sections: [
      { heading: L('1. Responsable', '1. Controller'), text: L(`Clover · Accesorios y Prendas, ubicada en Valle Fresco, Turmero, Maracay, Venezuela. Para cualquier asunto de privacidad escríbenos por WhatsApp al ${WA}.`, `Clover · Accessories & Apparel, based in Valle Fresco, Turmero, Maracay, Venezuela. For any privacy matter, message us on WhatsApp at ${WA}.`) },
      { heading: L('2. Qué datos recogemos', '2. What data we collect'), text: L('Datos de pedido: al hacer un pedido nos compartes tu nombre, teléfono y dirección de entrega; el pedido queda registrado en nuestro sistema y lo confirmamos por WhatsApp. Carrito y favoritos: se guardan únicamente en tu propio dispositivo (almacenamiento local del navegador) y puedes borrarlos cuando quieras.', 'Order data: when you place an order you share your name, phone and delivery address; the order is recorded in our system and we confirm it on WhatsApp. Cart and favorites: stored only on your own device (browser local storage) and you can delete them at any time.') },
      { heading: L('3. Para qué los usamos', '3. What we use it for'), text: L('Gestionar pedidos y entregas, coordinar pagos y responder tus consultas. No usamos tus datos para publicidad de terceros.', 'To manage orders and deliveries, arrange payment and answer your questions. We do not use your data for third-party advertising.') },
      { heading: L('4. Con quién los compartimos', '4. Who we share it with'), text: L('No vendemos ni alquilamos tus datos. Al escribirnos por WhatsApp, tus mensajes se rigen también por la política de privacidad de WhatsApp (Meta).', 'We do not sell or rent your data. When you message us on WhatsApp, your messages are also governed by WhatsApp’s (Meta) privacy policy.') },
      { heading: L('5. Tus derechos', '5. Your rights'), text: L('Puedes pedirnos acceso, corrección o eliminación de tus datos escribiéndonos por WhatsApp. Respondemos en un plazo razonable.', 'You can ask us for access, correction or deletion of your data by messaging us on WhatsApp. We reply within a reasonable time.') },
      { heading: L('6. Conservación', '6. Retention'), text: L('Guardamos los datos de pedidos solo el tiempo necesario para completar la compra y cumplir obligaciones legales.', 'We keep order data only as long as needed to complete the purchase and meet legal obligations.') },
      { heading: L('7. Menores de edad', '7. Minors'), text: L('Este catálogo no está dirigido a menores de 18 años sin la supervisión de un adulto.', 'This catalog is not aimed at people under 18 without adult supervision.') },
    ],
  },
  {
    slug: 'terms',
    title: L('Términos y condiciones', 'Terms and conditions'),
    updated: '2026-09-30',
    sections: [
      { heading: L('1. Objeto', '1. Purpose'), text: L('Este sitio es el catálogo en línea de Clover · Accesorios y Prendas. La compra se concreta conversando por WhatsApp: ver un producto o enviar un pedido desde aquí no constituye una oferta vinculante hasta que confirmemos tu pedido por ese canal.', 'This site is the online catalog of Clover · Accessories & Apparel. Purchases are completed by chatting on WhatsApp: viewing a product or sending an order from here is not a binding offer until we confirm your order on that channel.') },
      { heading: L('2. Precios', '2. Prices'), text: L('Los precios se muestran en dólares estadounidenses (USD). Pueden cambiar sin previo aviso; el precio válido es el confirmado al momento de tomar tu pedido.', 'Prices are shown in US dollars (USD). They may change without notice; the valid price is the one confirmed when we take your order.') },
      { heading: L('3. Formas de pago', '3. Payment methods'), text: L('Aceptamos pago móvil, transferencia bancaria y efectivo, coordinados por WhatsApp al confirmar tu pedido. En esta página no se cobra nada.', 'We accept pago móvil, bank transfer and cash, arranged on WhatsApp when we confirm your order. Nothing is charged on this website.') },
      { heading: L('4. Pedidos y disponibilidad', '4. Orders and availability'), text: L('El stock publicado es referencial y está sujeto a disponibilidad. Tu pedido queda firme cuando confirmamos disponibilidad y pago. Si una pieza se agotó, te ofrecemos una alternativa o la devolución de lo abonado.', 'Published stock is indicative and subject to availability. Your order is firm once we confirm availability and payment. If a piece is sold out, we offer an alternative or a refund of what you paid.') },
      { heading: L('5. Uso del sitio', '5. Use of the site'), text: L('El contenido (textos, fotos y diseño) es propiedad de Clover y está protegido. No está permitido copiarlo para uso comercial sin autorización.', 'The content (text, photos and design) belongs to Clover and is protected. Copying it for commercial use without permission is not allowed.') },
      { heading: L('6. Legislación aplicable', '6. Governing law'), text: L(`Estos términos se rigen por las leyes de la República Bolivariana de Venezuela. Para dudas o reclamos, escríbenos por WhatsApp al ${WA}.`, `These terms are governed by the laws of the Bolivarian Republic of Venezuela. For questions or claims, message us on WhatsApp at ${WA}.`) },
    ],
  },
  {
    slug: 'shipping',
    title: L('Envíos, pagos y devoluciones', 'Shipping, payment and returns'),
    updated: '2026-09-30',
    sections: [
      { heading: L('Entregas', 'Deliveries'), text: L('Solo atendemos pedidos dentro de Venezuela. Coordinamos las entregas por WhatsApp (Turmero y Maracay); los tiempos y el costo de envío se acuerdan según la zona antes de cerrar el pedido.', 'We only serve orders within Venezuela. Deliveries are arranged on WhatsApp (Turmero and Maracay); timing and delivery cost are agreed according to your area before the order is closed.') },
      { heading: L('Pago', 'Payment'), text: L('Pago móvil, transferencia bancaria o efectivo, coordinados por WhatsApp al confirmar tu pedido.', 'Pago móvil, bank transfer or cash, arranged on WhatsApp when your order is confirmed.') },
      { heading: L('Defectos de fabricación', 'Manufacturing defects'), text: L('7 días desde la entrega para cambio o reembolso, con la pieza sin uso.', '7 days from delivery for an exchange or refund, with the piece unused.') },
      { heading: L('Joyería', 'Jewelry'), text: L('Por higiene, no admite devolución salvo defecto de fabricación.', 'For hygiene reasons, it cannot be returned except for a manufacturing defect.') },
      { heading: L('Prendas', 'Apparel'), text: L('Se aceptan cambios de talla dentro de 7 días, con etiquetas puestas y sin uso.', 'Size exchanges are accepted within 7 days, with tags attached and unused.') },
    ],
  },
  {
    slug: 'cookies',
    title: L('Política de cookies', 'Cookie policy'),
    updated: '2026-09-30',
    sections: [
      { heading: L('Qué usamos', 'What we use'), text: L('Este sitio no utiliza cookies de rastreo ni de publicidad. Tu carrito y tus favoritos se guardan en el almacenamiento local de tu navegador, que no sale de tu dispositivo y puedes borrar cuando quieras desde sus ajustes.', 'This site does not use tracking or advertising cookies. Your cart and favorites are saved in your browser’s local storage, which never leaves your device and which you can clear at any time from its settings.') },
      { heading: L('Contenido externo', 'External content'), text: L('Los enlaces a WhatsApp te llevan a servicios de terceros con sus propias políticas de cookies.', 'Links to WhatsApp take you to third-party services with their own cookie policies.') },
    ],
  },
];

export function getLegal(slug: string) {
  return legalDocs.find((d) => d.slug === slug);
}
