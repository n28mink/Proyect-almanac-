'use client';

import { useState, useTransition } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { CartLines } from '@/components/cart/CartLines';
import { TotalsTable } from '@/components/cart/CartSummary';
import { Button, ButtonLink } from '@/components/ui/Button';
import { Field } from '@/components/ui/PageShell';
import { DEFAULT_PAYMENT_METHOD, paymentMethodLabel, type PaymentMethod } from '@/domain/commerce';
import { pick } from '@/domain/i18n';
import type { Locale } from '@/i18n/routing';
import { useRouter } from '@/i18n/navigation';
import { useCartQuote } from '@/lib/use-cart-quote';
import { placeOrderAction } from '@/server/actions/shop';
import { useCart } from '@/stores/cart-store';
import { PaymentIcon, PaymentMethods } from './PaymentMethods';

type FieldName = 'fullName' | 'phone' | 'line1' | 'city';
const PHONE = /^[+\d][\d\s().-]{6,}$/;

/**
 * Pedido para Venezuela, sin pago en línea. El cliente elige la forma de pago (pago móvil, transferencia o efectivo);
 * el servidor recalcula precios y stock al registrar el pedido, y el pago se coordina por WhatsApp.
 */
export function CheckoutForm() {
  const t = useTranslations('checkout');
  const locale = useLocale() as Locale;
  const router = useRouter();
  const lines = useCart((s) => s.lines);
  const clear = useCart((s) => s.clear);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<FieldName, string>>>({});
  const [pending, start] = useTransition();
  const [payment, setPayment] = useState<PaymentMethod>(DEFAULT_PAYMENT_METHOD);
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

    // Validación en el cliente con el error junto al campo y el foco en el primero que falla.
    const value = (k: string) => String(fd.get(k) ?? '').trim();
    const found: Partial<Record<FieldName, string>> = {};
    if (value('fullName').length < 2) found.fullName = t('fieldErrors.fullName');
    if (!PHONE.test(value('phone'))) found.phone = t('fieldErrors.phone');
    if (value('line1').length < 3) found.line1 = t('fieldErrors.line1');
    if (value('city').length < 2) found.city = t('fieldErrors.city');
    setFieldErrors(found);
    const first = (['fullName', 'phone', 'line1', 'city'] as const).find((k) => found[k]);
    if (first) {
      document.getElementById(first)?.focus();
      return;
    }

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
      paymentMethod: payment,
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
    <form onSubmit={onSubmit} noValidate className="grid gap-14 lg:grid-cols-[1.3fr_1fr] xl:gap-24" lang={locale}>
      <div className="space-y-12">
        <section aria-labelledby="ck-contact">
          <h2 id="ck-contact" className="mb-6 font-display text-heading">{t('contact')}</h2>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label={t('fullName')} id="fullName" error={fieldErrors.fullName}><input id="fullName" name="fullName" maxLength={80} autoComplete="name" autoCapitalize="words" enterKeyHint="next" placeholder={t('ph.fullName')} aria-invalid={fieldErrors.fullName ? true : undefined} aria-describedby={fieldErrors.fullName ? 'fullName-error' : undefined} className="field" /></Field>
            <Field label={t('phone')} id="phone" error={fieldErrors.phone}><input id="phone" name="phone" type="tel" maxLength={30} inputMode="tel" autoComplete="tel" enterKeyHint="next" spellCheck={false} placeholder={t('ph.phone')} aria-invalid={fieldErrors.phone ? true : undefined} aria-describedby={fieldErrors.phone ? 'phone-error' : undefined} className="field" /></Field>
          </div>
        </section>

        <section aria-labelledby="ck-address">
          <h2 id="ck-address" className="mb-2 font-display text-heading">{t('address')}</h2>
          <p className="mb-6 text-caption text-fg-muted">{t('deliveryNote')}</p>
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="sm:col-span-2"><Field label={t('line1')} id="line1" error={fieldErrors.line1}><input id="line1" name="line1" maxLength={160} autoComplete="street-address" enterKeyHint="next" placeholder={t('ph.line1')} aria-invalid={fieldErrors.line1 ? true : undefined} aria-describedby={fieldErrors.line1 ? 'line1-error' : undefined} className="field" /></Field></div>
            <Field label={t('city')} id="city" error={fieldErrors.city}><input id="city" name="city" maxLength={80} autoComplete="address-level2" enterKeyHint="next" placeholder={t('ph.city')} aria-invalid={fieldErrors.city ? true : undefined} aria-describedby={fieldErrors.city ? 'city-error' : undefined} className="field" /></Field>
            <Field label={t('region')} id="region"><input id="region" name="region" maxLength={80} autoComplete="address-level1" enterKeyHint="next" placeholder={t('ph.region')} className="field" /></Field>
            <div className="sm:col-span-2"><Field label={t('notes')} id="notes"><textarea id="notes" name="notes" maxLength={300} rows={3} placeholder={t('ph.notes')} className="field" /></Field></div>
          </div>
        </section>

        <section>
          <PaymentMethods value={payment} onChange={setPayment} />
        </section>
      </div>

      <aside aria-label={t('summary')} className="lg:sticky lg:top-28 lg:self-start">
        <div className="border border-line bg-surface-raised p-6 md:p-8">
          <h2 className="mb-2 font-display text-heading">{t('summary')}</h2>
          {quote ? (
            <>
              <CartLines quote={quote} />
              <div className="mt-4">
                <TotalsTable quote={quote} payment={{ title: t('payment'), label: pick(paymentMethodLabel[payment], locale), icon: <PaymentIcon method={payment} width={18} height={18} /> }} />
              </div>
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
