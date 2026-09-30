import { z } from 'zod';
import { cents } from './catalog';

/** Línea que envía el cliente: SOLO identificadores y cantidad. Los precios jamás viajan desde el cliente. */
export const cartLineInputSchema = z.object({
  productId: z.string().min(1).max(64),
  variantId: z.string().min(1).max(96),
  quantity: z.number().int().min(1).max(10),
});
export type CartLineInput = z.infer<typeof cartLineInputSchema>;

export const cartInputSchema = z.object({
  lines: z.array(cartLineInputSchema).max(40),
});
export type CartInput = z.infer<typeof cartInputSchema>;

/** Línea ya valorada por el servidor. */
export interface QuotedLine {
  productId: string;
  variantId: string;
  slug: string;
  name: { es: string; en: string };
  variantLabel: { es: string; en: string };
  image: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
  /** Stock disponible (para avisos de "quedan pocas"). */
  available: number;
  /** El servidor ajustó la cantidad por falta de stock. */
  adjusted: boolean;
}

/** Valoración del servidor. El costo de envío no se suma: se acuerda por WhatsApp según la zona. */
export interface Quote {
  lines: QuotedLine[];
  subtotal: number;
  total: number;
  currency: 'USD';
  /** Códigos de aviso para la UI (i18n en cliente). */
  warnings: Array<'stock_adjusted' | 'item_unavailable'>;
}

/** pending_payment: pedido recibido, se coordina el pago por WhatsApp · paid: pago confirmado (descuenta inventario). */
export const orderStatusSchema = z.enum(['pending_payment', 'paid', 'delivered', 'cancelled']);
export type OrderStatus = z.infer<typeof orderStatusSchema>;

export const orderLineSchema = z.object({
  productId: z.string(),
  variantId: z.string(),
  name: z.object({ es: z.string(), en: z.string() }),
  variantLabel: z.object({ es: z.string(), en: z.string() }),
  image: z.string(),
  unitPrice: cents,
  quantity: z.number().int().positive(),
  lineTotal: cents,
});

export const orderSchema = z.object({
  id: z.string(),
  number: z.string(),
  contact: z.object({
    fullName: z.string().trim().min(2).max(80),
    phone: z.string().trim().min(7).max(30),
  }),
  status: orderStatusSchema,
  lines: z.array(orderLineSchema).min(1),
  subtotal: cents,
  total: cents,
  currency: z.literal('USD'),
  /** Entrega en Venezuela, coordinada por WhatsApp (el costo se acuerda según la zona). */
  shippingAddress: z.object({
    line1: z.string().trim().min(3).max(160),
    city: z.string().trim().min(2).max(80),
    region: z.string().trim().max(80).optional(),
  }),
  notes: z.string().trim().max(300).optional(),
  paidAt: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type Order = z.infer<typeof orderSchema>;

/** Los clientes NO tienen cuenta: piden por WhatsApp. Solo existe el rol de administración (precios e inventario). */
export const roleSchema = z.literal('admin');
export type Role = z.infer<typeof roleSchema>;

export const userSchema = z.object({
  id: z.string(),
  email: z.email(),
  name: z.string().min(1).max(80),
  role: roleSchema,
  passwordHash: z.string(),
  createdAt: z.string(),
});
export type User = z.infer<typeof userSchema>;

/** Usuario sin datos sensibles: lo único que llega a componentes cliente. */
export type PublicUser = Pick<User, 'id' | 'email' | 'name' | 'role'>;
