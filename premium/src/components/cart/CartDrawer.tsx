'use client';

import { useTranslations } from 'next-intl';
import { Dialog } from '@/components/ui/Dialog';
import { CloseIcon } from '@/components/ui/Icon';
import { ButtonLink, Button } from '@/components/ui/Button';
import { useCartQuote } from '@/lib/use-cart-quote';
import { useCart } from '@/stores/cart-store';
import { useUi } from '@/stores/ui-store';
import { CartLines } from './CartLines';
import { TotalsTable } from './CartSummary';

/** Drawer del carrito: líneas y total, valorados en servidor. */
export function CartDrawer() {
  const t = useTranslations('cart');
  const panel = useUi((s) => s.panel);
  const close = useUi((s) => s.closePanel);
  const open = panel === 'cart';
  const lines = useCart((s) => s.lines);
  const { quote, loading, error, refresh } = useCartQuote(open);
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
                <CartLines quote={quote} compact />
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
              {quote && <TotalsTable quote={quote} />}
              <ButtonLink href="/checkout" size="lg" className="w-full" transition="curtain" aria-label={t('checkout')}>
                {loading ? t('updating') : t('checkout')}
              </ButtonLink>
              <p className="text-center text-caption text-fg-subtle">{t('whatsappNote')}</p>
            </div>
          </>
        )}
      </div>
    </Dialog>
  );
}
