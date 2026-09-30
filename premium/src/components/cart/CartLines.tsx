'use client';

import Image from 'next/image';
import { useLocale, useTranslations } from 'next-intl';
import { TransitionLink } from '@/components/motion/TransitionLink';
import { MinusIcon, PlusIcon } from '@/components/ui/Icon';
import { Price } from '@/components/ui/Price';
import type { Quote } from '@/domain/commerce';
import { pick } from '@/domain/i18n';
import type { Locale } from '@/i18n/routing';
import { MAX_PER_LINE, useCart } from '@/stores/cart-store';

/** Líneas valoradas por el servidor con control de cantidad. Reutilizado por el drawer y el checkout. */
export function CartLines({ quote, compact = false }: { quote: Quote; compact?: boolean }) {
  const t = useTranslations('cart');
  const locale = useLocale() as Locale;
  const setQuantity = useCart((s) => s.setQuantity);
  const remove = useCart((s) => s.remove);

  return (
    <ul className="divide-y divide-line">
      {quote.lines.map((l) => (
        <li key={l.variantId} className="flex gap-4 py-5">
          <TransitionLink href={`/product/${l.slug}`} className="relative block h-28 w-[5.5rem] shrink-0 overflow-hidden bg-surface-sunken" aria-label={pick(l.name, locale)}>
            <Image src={l.image} alt="" fill sizes="96px" className="object-cover" />
          </TransitionLink>
          <div className="flex min-w-0 flex-1 flex-col">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <TransitionLink href={`/product/${l.slug}`} className="block font-display text-lead leading-tight hover:text-accent">
                  {pick(l.name, locale)}
                </TransitionLink>
                {!compact && <p className="mt-1 text-caption text-fg-muted">{pick(l.variantLabel, locale)}</p>}
              </div>
              <Price cents={l.lineTotal} className="text-caption" />
            </div>
            {l.adjusted && <p className="mt-1 text-caption text-danger" role="status">{t('stockAdjusted', { count: l.available })}</p>}
            <div className="mt-auto flex items-center justify-between pt-3">
              <div className="flex items-center border border-line-strong" role="group" aria-label={t('quantity')}>
                <button type="button" onClick={() => setQuantity(l.variantId, l.quantity - 1)} aria-label={t('decrease')} className="grid h-11 w-11 place-items-center transition-colors hover:bg-fg/5 active:bg-fg/10">
                  <MinusIcon width={16} height={16} />
                </button>
                <span className="tabular min-w-8 text-center text-caption" aria-live="polite">{l.quantity}</span>
                <button type="button" onClick={() => setQuantity(l.variantId, l.quantity + 1)} disabled={l.quantity >= Math.min(MAX_PER_LINE, l.available)} aria-label={t('increase')} className="grid h-11 w-11 place-items-center transition-colors hover:bg-fg/5 active:bg-fg/10 disabled:opacity-30">
                  <PlusIcon width={16} height={16} />
                </button>
              </div>
              <button type="button" onClick={() => remove(l.variantId)} className="label-micro -mr-2 inline-flex min-h-11 items-center px-2 text-fg-subtle underline-offset-4 transition-colors hover:text-fg hover:underline">
                {t('remove')}
              </button>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
