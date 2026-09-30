import { z } from 'zod';
import { cents } from './catalog';

export const currencyCodes = ['USD', 'EUR', 'GBP', 'MXN'] as const;
export const currencySchema = z.enum(currencyCodes);
export type CurrencyCode = z.infer<typeof currencySchema>;

/** Línea que envía el cliente: SOLO identificadores y cantidad. Los precios jamás viajan desde el cliente. */
export const cartLineInputSchema = z.object({
  productId: z.string().min(1).max(64),
  variantId: z.string().min(1).max(96),
  quantity: z.number().int().min(1).max(10),
});
export type CartLineInput = z.infer<typeof cartLineInputSchema>;

export const cartInputSchema = z.object({
  lines: z.array(cartLineInputSchema).max(40),
  promoCode: z.string().trim().max(32).optional(),
  shippingMethod: z.enum(['standard', 'express', 'pickup']).default('standard'),
  country: z.string().length(2).default('VE'),
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

export interface Quote {
  lines: QuotedLine[];
  subtotal: number;
  discount: number;
  shipping: number;
  tax: number;
  total: number;
  currency: 'USD';
  freeShippingThreshold: number;
  /** Cuánto falta para envío gratis (0 si ya aplica). */
  freeShippingRemaining: number;
  promo?: { code: string; label: { es: string; en: string } };
  /** Códigos de aviso para la UI (i18n en cliente). */
  warnings: Array<'promo_invalid' | 'promo_min_subtotal' | 'stock_adjusted' | 'item_unavailable'>;
}

export const addressSchema = z.object({
  id: z.string(),
  label: z.string().trim().max(40).optional(),
  fullName: z.string().trim().min(2).max(80),
  line1: z.string().trim().min(3).max(120),
  line2: z.string().trim().max(120).optional(),
  city: z.string().trim().min(2).max(80),
  region: z.string().trim().max(80).optional(),
  postalCode: z.string().trim().max(20).optional(),
  country: z.string().length(2),
  phone: z.string().trim().max(30).optional(),
  isDefault: z.boolean().default(false),
});
export type Address = z.infer<typeof addressSchema>;

/** Entrada de formulario de dirección (sin id). */
export const addressInputSchema = addressSchema.omit({ id: true, isDefault: true }).extend({
  isDefault: z.coerce.boolean().optional(),
});

export const orderStatusSchema = z.enum(['pending_payment', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded']);
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
  userId: z.string().nullable(),
  email: z.email(),
  status: orderStatusSchema,
  lines: z.array(orderLineSchema).min(1),
  subtotal: cents,
  discount: cents,
  shipping: cents,
  tax: cents,
  total: cents,
  currency: z.literal('USD'),
  promoCode: z.string().optional(),
  shippingMethod: z.enum(['standard', 'express', 'pickup']),
  shippingAddress: addressSchema.omit({ id: true, isDefault: true, label: true }).nullable(),
  payment: z.object({
    provider: z.string(),
    reference: z.string().optional(),
    paidAt: z.string().optional(),
  }),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type Order = z.infer<typeof orderSchema>;

export const roleSchema = z.enum(['customer', 'admin']);
export type Role = z.infer<typeof roleSchema>;

export const userSchema = z.object({
  id: z.string(),
  email: z.email(),
  name: z.string().min(1).max(80),
  role: roleSchema,
  passwordHash: z.string(),
  locale: z.enum(['es', 'en']).default('es'),
  createdAt: z.string(),
  addresses: z.array(addressSchema).default([]),
  wishlist: z.array(z.string()).default([]),
});
export type User = z.infer<typeof userSchema>;

/** Usuario sin datos sensibles: lo único que llega a componentes cliente. */
export type PublicUser = Pick<User, 'id' | 'email' | 'name' | 'role' | 'locale'>;

export const promotionSchema = z.object({
  code: z.string(),
  kind: z.enum(['percent', 'fixed', 'free_shipping']),
  /** percent: 1–100 · fixed: céntimos · free_shipping: ignorado. */
  value: z.number().nonnegative(),
  minSubtotal: cents.default(0),
  label: z.object({ es: z.string(), en: z.string() }),
  expiresAt: z.string().optional(),
  active: z.boolean().default(true),
});
export type Promotion = z.infer<typeof promotionSchema>;
