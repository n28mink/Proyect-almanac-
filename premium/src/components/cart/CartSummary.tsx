'use client';

import { useLocale, useTranslations } from 'next-intl';
import { Price } from '@/components/ui/Price';
import type { Quote } from '@/domain/commerce';
import { pick } from '@/domain/i18n';
import type { Locale } from '@/i18n/routing';

/** Barra de progreso hacia el envío gratis (valores del servidor). */
export function ShippingProgress({ quote }: { quote: Quote }) {
  const t = useTranslations('cart');
  const pct = Math.min(100, Math.round(((quote.subtotal - quote.discount) / quote.freeShippingThreshold) * 100));
  const done = quote.freeShippingRemaining === 0;
  return (
    <div>
      <p className="text-caption text-fg-muted" role="status">
        {done ? t('freeShippingDone') : t('freeShippingLeft', { amount: '' })}
        {!done && <Price cents={quote.freeShippingRemaining} className="font-semibold text-fg" />}
      </p>
      <div className="mt-2 h-px bg-line-strong" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} aria-label={t('freeShippingProgress')}>
        <div className="h-full origin-left bg-accent-decor transition-transform duration-700 ease-[var(--ease-expo)]" style={{ transform: `scaleX(${pct / 100})`, height: 2, marginTop: -0.5 }} />
      </div>
    </div>
  );
}

export function TotalsTable({ quote }: { quote: Quote }) {
  const t = useTranslations('cart');
  const locale = useLocale() as Locale;
  const row = 'flex items-baseline justify-between gap-4 text-caption';
  return (
    <dl className="space-y-2">
      <div className={row}>
        <dt className="text-fg-muted">{t('subtotal')}</dt>
        <dd><Price cents={quote.subtotal} /></dd>
      </div>
      {quote.discount > 0 && (
        <div className={row}>
          <dt className="text-fg-muted">{quote.promo ? `${pick(quote.promo.label, locale)} (${quote.promo.code})` : t('discount')}</dt>
          <dd className="text-success">−<Price cents={quote.discount} /></dd>
        </div>
      )}
      <div className={row}>
        <dt className="text-fg-muted">{t('shipping')}</dt>
        <dd>{quote.shipping === 0 ? t('free') : <Price cents={quote.shipping} />}</dd>
      </div>
      {quote.tax > 0 && (
        <div className={row}>
          <dt className="text-fg-muted">{t('tax')}</dt>
          <dd><Price cents={quote.tax} /></dd>
        </div>
      )}
      <div className="flex items-baseline justify-between gap-4 border-t border-line pt-3">
        <dt className="label-micro">{t('total')}</dt>
        <dd className="font-display text-heading"><Price cents={quote.total} /></dd>
      </div>
    </dl>
  );
}
