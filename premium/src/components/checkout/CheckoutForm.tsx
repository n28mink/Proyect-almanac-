'use client';

import { useState, useTransition } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { CartLines } from '@/components/cart/CartLines';
import { TotalsTable } from '@/components/cart/CartSummary';
import { Button, ButtonLink } from '@/components/ui/Button';
import { Field } from '@/components/ui/PageShell';
import { useRouter } from '@/i18n/navigation';
import { useCartQuote } from '@/lib/use-cart-quote';
import { placeOrderAction } from '@/server/actions/shop';
import { useCart } from '@/stores/cart-store';

/**
 * Pedido para Venezuela, sin pago en línea. El servidor recalcula precios y stock al registrar el pedido; luego el
 * cliente lo envía por WhatsApp y el pago (pago móvil, transferencia o efectivo) se coordina ahí.
 */
export function CheckoutForm() {
  const t = useTranslations('checkout');
  const locale = useLocale();
  const router = useRouter();
  const lines = useCart((s) => s.lines);
  const clear = useCart((s) => s.clear);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const { quote, loading, refresh } = useCartQuote(true);

  if (lines.length === 0) {
    return (
      <div className="grid place-items-start gap-6 py-6">
        <p className="font-display text-display-m">{t('emptyTitle')}</p>
        <p className="max-w-md text-fg-muted">{t('emptyText')}</p>
        <ButtonLink href="/shop" transition="curtain">{t('continueShopping')}</ButtonLink>
      </div>
    );
  }

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    const payload = {
      cart: { lines },
      fullName: String(fd.get('fullName') ?? ''),
      phone: String(fd.get('phone') ?? ''),
      address: {
        line1: String(fd.get('line1') ?? ''),
        city: String(fd.get('city') ?? ''),
        region: String(fd.get('region') ?? '') || undefined,
      },
      notes: String(fd.get('notes') ?? '') || undefined,
    };
    start(async () => {
      const res = await placeOrderAction(payload);
      if (!res.ok) {
        setError(res.error);
        if (res.error === 'cart_changed') refresh();
        return;
      }
      clear();
      router.replace(`/checkout/success?order=${res.orderId}`);
    });
  };

  return (
    <form onSubmit={onSubmit} className="grid gap-14 lg:grid-cols-[1.3fr_1fr] xl:gap-24" lang={locale}>
      <div className="space-y-12">
        <section aria-labelledby="ck-contact">
          <h2 id="ck-contact" className="mb-6 font-display text-heading">{t('contact')}</h2>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label={t('fullName')} id="fullName"><input id="fullName" name="fullName" required minLength={2} maxLength={80} autoComplete="name" className="field" /></Field>
            <Field label={t('phone')} id="phone"><input id="phone" name="phone" type="tel" required minLength={7} maxLength={30} inputMode="tel" autoComplete="tel" placeholder="0412 000 0000" className="field" /></Field>
          </div>
        </section>

        <section aria-labelledby="ck-address">
          <h2 id="ck-address" className="mb-2 font-display text-heading">{t('address')}</h2>
          <p className="mb-6 text-caption text-fg-muted">{t('deliveryNote')}</p>
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="sm:col-span-2"><Field label={t('line1')} id="line1"><input id="line1" name="line1" required minLength={3} maxLength={160} autoComplete="street-address" className="field" /></Field></div>
            <Field label={t('city')} id="city"><input id="city" name="city" required minLength={2} maxLength={80} autoComplete="address-level2" className="field" /></Field>
            <Field label={t('region')} id="region"><input id="region" name="region" maxLength={80} autoComplete="address-level1" className="field" /></Field>
            <div className="sm:col-span-2"><Field label={t('notes')} id="notes"><textarea id="notes" name="notes" maxLength={300} rows={3} className="field" /></Field></div>
          </div>
        </section>

        <section aria-labelledby="ck-pay">
          <h2 id="ck-pay" className="mb-4 font-display text-heading">{t('payment')}</h2>
          <p className="border border-line-strong p-4 text-fg-muted">{t('payNote')}</p>
        </section>
      </div>

      <aside aria-label={t('summary')} className="lg:sticky lg:top-28 lg:self-start">
        <div className="border border-line bg-surface-raised p-6 md:p-8">
          <h2 className="mb-2 font-display text-heading">{t('summary')}</h2>
          {quote ? (
            <>
              <CartLines quote={quote} compact />
              <div className="mt-4"><TotalsTable quote={quote} /></div>
            </>
          ) : (
            <div className="space-y-4 py-4" aria-busy="true">{lines.map((l) => <div key={l.variantId} className="skeleton h-20" />)}</div>
          )}
          {error && (
            <p role="alert" className="mt-5 border border-danger/40 bg-danger/5 p-3 text-caption text-danger">{t(`errors.${error}` as 'errors.invalid')}</p>
          )}
          <Button type="submit" size="lg" className="mt-6 w-full" disabled={pending || loading || !quote}>
            {pending ? t('placing') : t('placeOrder')}
          </Button>
          <p className="mt-4 text-center text-caption text-fg-subtle">{t('terms')}</p>
        </div>
      </aside>
    </form>
  );
}
