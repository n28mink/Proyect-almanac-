import { variantLabel, variantPrice, type Product } from '@/domain/catalog';
import type { CartInput, Quote, QuotedLine } from '@/domain/commerce';

/**
 * Valoración del carrito — SIEMPRE en servidor. El cliente solo envía ids y cantidades;
 * precio y stock se recalculan aquí desde el catálogo vivo. El envío no suma: se acuerda por WhatsApp según la zona.
 */
export function computeQuote(catalog: Product[], input: CartInput): Quote {
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
      variantLabel: variantLabel(variant),
      image: product.images[variant.imageIndex ?? 0]?.src ?? product.thumbnail,
      unitPrice,
      quantity,
      lineTotal: unitPrice * quantity,
      available: variant.stock,
      adjusted,
    });
  }

  const subtotal = lines.reduce((s, l) => s + l.lineTotal, 0);
  return { lines, subtotal, total: subtotal, currency: 'USD', warnings: [...new Set(warnings)] };
}
