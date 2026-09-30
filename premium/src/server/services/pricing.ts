import { site, taxRates } from '@/config/site';
import { variantPrice, type Product } from '@/domain/catalog';
import type { CartInput, Promotion, Quote, QuotedLine } from '@/domain/commerce';

/**
 * Valoración del carrito — SIEMPRE en servidor. El cliente solo envía ids y cantidades;
 * precio, stock, descuento, envío e impuestos se recalculan aquí desde el catálogo vivo.
 */
export function computeQuote(catalog: Product[], promotions: Promotion[], input: CartInput, now = new Date()): Quote {
  const warnings: Quote['warnings'] = [];
  const lines: QuotedLine[] = [];

  for (const line of input.lines) {
    const product = catalog.find((p) => p.id === line.productId);
    const variant = product?.variants.find((v) => v.id === line.variantId);
    if (!product || !variant || variant.stock <= 0) {
      warnings.push('item_unavailable');
      continue;
    }
    const quantity = Math.min(line.quantity, variant.stock);
    const adjusted = quantity !== line.quantity;
    if (adjusted) warnings.push('stock_adjusted');
    const unitPrice = variantPrice(product, variant);
    lines.push({
      productId: product.id,
      variantId: variant.id,
      slug: product.slug,
      name: product.name,
      variantLabel: variant.options.color,
      image: product.images[variant.imageIndex ?? 0]?.src ?? product.thumbnail,
      unitPrice,
      quantity,
      lineTotal: unitPrice * quantity,
      available: variant.stock,
      adjusted,
    });
  }

  const subtotal = lines.reduce((s, l) => s + l.lineTotal, 0);

  let discount = 0;
  let freeShippingPromo = false;
  let promo: Quote['promo'];
  if (input.promoCode) {
    const found = promotions.find((p) => p.code.toLowerCase() === input.promoCode!.toLowerCase());
    const valid = found && found.active && (!found.expiresAt || new Date(found.expiresAt) > now);
    if (!valid) warnings.push('promo_invalid');
    else if (subtotal < found.minSubtotal) warnings.push('promo_min_subtotal');
    else {
      promo = { code: found.code, label: found.label };
      if (found.kind === 'percent') discount = Math.round((subtotal * Math.min(100, found.value)) / 100);
      if (found.kind === 'fixed') discount = Math.min(subtotal, Math.round(found.value));
      if (found.kind === 'free_shipping') freeShippingPromo = true;
    }
  }
  discount = Math.min(discount, subtotal);
  const net = subtotal - discount;

  let shipping = 0;
  if (lines.length > 0) {
    const method = site.shipping[input.shippingMethod];
    const qualifiesFree = input.shippingMethod === 'standard' && net >= site.freeShippingThreshold;
    shipping = qualifiesFree || freeShippingPromo ? 0 : method.price;
  }

  const tax = Math.round(net * (taxRates[input.country.toUpperCase()] ?? 0));
  const total = net + shipping + tax;

  return {
    lines,
    subtotal,
    discount,
    shipping,
    tax,
    total,
    currency: 'USD',
    freeShippingThreshold: site.freeShippingThreshold,
    freeShippingRemaining: Math.max(0, site.freeShippingThreshold - net),
    promo,
    warnings: [...new Set(warnings)],
  };
}
