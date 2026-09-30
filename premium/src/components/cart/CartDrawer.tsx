'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Dialog } from '@/components/ui/Dialog';
import { CloseIcon } from '@/components/ui/Icon';
import { ButtonLink, Button } from '@/components/ui/Button';
import { useCartQuote } from '@/lib/use-cart-quote';
import { useCart } from '@/stores/cart-store';
import { useUi } from '@/stores/ui-store';
import { CartLines } from './CartLines';
import { ShippingProgress, TotalsTable } from './CartSummary';

/** Drawer del carrito: líneas, progreso de envío gratis, código promocional y total — todo valorado en servidor. */
export function CartDrawer() {
  const t = useTranslations('cart');
  const panel = useUi((s) => s.panel);
  const close = useUi((s) => s.closePanel);
  const open = panel === 'cart';
  const lines = useCart((s) => s.lines);
  const promoCode = useCart((s) => s.promoCode);
  const setPromo = useCart((s) => s.setPromo);
  const { quote, loading, error, refresh } = useCartQuote(open);
  const [promoInput, setPromoInput] = useState('');
  const empty = lines.length === 0;

  return (
    <Dialog open={open} onClose={close} side="right" label={t('title')} lazyContent>
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between border-b border-line px-6 py-5">
          <h2 className="font-display text-heading">{t('title')}</h2>
          <button type="button" onClick={close} aria-label={t('close')} className="-mr-2 grid h-11 w-11 place-items-center transition-opacity hover:opacity-70">
            <CloseIcon />
          </button>
        </div>

        {empty ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-6 px-8 text-center">
            <p className="font-display text-display-m">{t('emptyTitle')}</p>
            <p className="max-w-xs text-fg-muted">{t('emptyText')}</p>
            <ButtonLink href="/shop" size="md" transition="curtain">{t('continue')}</ButtonLink>
          </div>
        ) : error ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8 text-center" role="alert">
            <p className="text-fg-muted">{t('error')}</p>
            <Button variant="outline" onClick={refresh}>{t('retry')}</Button>
          </div>
        ) : (
          <>
            <div data-lenis-prevent="" className="flex-1 overflow-y-auto px-6">
              {quote ? (
                <>
                  <div className="pt-5"><ShippingProgress quote={quote} /></div>
                  <CartLines quote={quote} compact />
                </>
              ) : (
                <ul className="space-y-6 py-6" aria-busy="true" aria-label={t('loading')}>
                  {lines.map((l) => (
                    <li key={l.variantId} className="flex gap-4">
                      <div className="skeleton h-28 w-[5.5rem]" />
                      <div className="flex-1 space-y-3"><div className="skeleton h-5 w-3/4" /><div className="skeleton h-4 w-1/3" /></div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="space-y-4 border-t border-line bg-surface-raised px-6 py-5">
              <form
                className="flex gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  setPromo(promoInput.trim());
                }}
              >
                <label className="sr-only" htmlFor="promo">{t('promoLabel')}</label>
                <input id="promo" value={promoInput || promoCode} onChange={(e) => setPromoInput(e.target.value)} placeholder={t('promoPlaceholder')} maxLength={32} autoComplete="off" className="field !min-h-11 flex-1 uppercase" aria-invalid={quote?.warnings.includes('promo_invalid') || undefined} />
                <Button type="submit" variant="outline" size="sm">{t('apply')}</Button>
              </form>
              {quote?.warnings.includes('promo_invalid') && <p role="alert" className="text-caption text-danger">{t('promoInvalid')}</p>}
              {quote?.warnings.includes('promo_min_subtotal') && <p role="alert" className="text-caption text-danger">{t('promoMin')}</p>}
              {quote && <TotalsTable quote={quote} />}
              <ButtonLink href="/checkout" size="lg" className="w-full" transition="curtain" aria-label={t('checkout')}>
                {loading ? t('updating') : t('checkout')}
              </ButtonLink>
              <p className="text-center text-caption text-fg-subtle">{t('secureNote')}</p>
            </div>
          </>
        )}
      </div>
    </Dialog>
  );
}
