'use client';

import { useTranslations } from 'next-intl';
import { Price } from '@/components/ui/Price';
import type { Quote } from '@/domain/commerce';

/** Totales valorados por el servidor. El envío no se suma: se acuerda por WhatsApp según la zona. */
export function TotalsTable({ quote }: { quote: Quote }) {
  const t = useTranslations('cart');
  const row = 'flex items-baseline justify-between gap-4 text-caption';
  return (
    <dl className="space-y-2">
      <div className={row}>
        <dt className="text-fg-muted">{t('subtotal')}</dt>
        <dd><Price cents={quote.subtotal} /></dd>
      </div>
      <div className={row}>
        <dt className="text-fg-muted">{t('shipping')}</dt>
        <dd className="text-right text-fg-muted">{t('shippingByWhatsapp')}</dd>
      </div>
      <div className="flex items-baseline justify-between gap-4 border-t border-line pt-3">
        <dt className="label-micro">{t('total')}</dt>
        <dd className="font-display text-heading"><Price cents={quote.total} /></dd>
      </div>
    </dl>
  );
}
