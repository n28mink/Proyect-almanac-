'use client';

import { useState, useTransition } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { CartLines } from '@/components/cart/CartLines';
import { ShippingProgress, TotalsTable } from '@/components/cart/CartSummary';
import { ButtonLink, Button } from '@/components/ui/Button';
import { Field } from '@/components/ui/PageShell';
import { Price } from '@/components/ui/Price';
import { site } from '@/config/site';
import type { Address, PublicUser } from '@/domain/commerce';
import { useRouter } from '@/i18n/navigation';
import { cn } from '@/lib/cn';
import { useCartQuote } from '@/lib/use-cart-quote';
import { placeOrderAction } from '@/server/actions/shop';
import { useCart } from '@/stores/cart-store';

const COUNTRIES = ['VE', 'CO', 'US', 'ES', 'MX', 'PA', 'CL', 'PE', 'AR', 'EC', 'DO'];
type Method = 'standard' | 'express' | 'pickup';

interface Props {
  user: PublicUser | null;
  addresses: Address[];
  providerLabel: 'mock' | 'stripe';
}

/**
 * Checkout limpio y confiable. El servidor recalcula todo (precios, envío, impuestos, promo) al crear el pedido;
 * lo que se ve aquí es una valoración del servidor, nunca un cálculo del cliente. Sin claves en el frontend.
 */
export function CheckoutForm({ user, addresses, providerLabel }: Props) {
  const t = useTranslations('checkout');
  const locale = useLocale();
  const router = useRouter();
  const lines = useCart((s) => s.lines);
  const promoCode = useCart((s) => s.promoCode);
  const shippingMethod = useCart((s) => s.shippingMethod);
  const setShipping = useCart((s) => s.setShipping);
  const clear = useCart((s) => s.clear);
  const def = addresses.find((a) => a.isDefault) ?? addresses[0];
  const [country, setCountry] = useState(def?.country ?? 'VE');
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const { quote, loading, refresh } = useCartQuote(true, country);
  const regionNames = new Intl.DisplayNames([locale], { type: 'region' });

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
    const pickup = shippingMethod === 'pickup';
    const payload = {
      cart: { lines, promoCode: promoCode || undefined, shippingMethod, country },
      email: String(fd.get('email') ?? ''),
      address: pickup
        ? undefined
        : {
            fullName: String(fd.get('fullName') ?? ''),
            line1: String(fd.get('line1') ?? ''),
            line2: String(fd.get('line2') ?? '') || undefined,
            city: String(fd.get('city') ?? ''),
            region: String(fd.get('region') ?? '') || undefined,
            postalCode: String(fd.get('postalCode') ?? '') || undefined,
            country,
            phone: String(fd.get('phone') ?? '') || undefined,
          },
    };
    start(async () => {
      const res = await placeOrderAction(payload, locale);
      if (!res.ok) {
        setError(res.error);
        if (res.error === 'cart_changed') refresh();
        return;
      }
      clear();
      if (/^https?:\/\//.test(res.redirectUrl)) window.location.assign(res.redirectUrl);
      else router.replace(res.redirectUrl.replace(new RegExp(`^/${locale}`), ''));
    });
  };

  const methods: Array<{ id: Method; price: number; days: string }> = [
    { id: 'standard', price: site.shipping.standard.price, days: t('days', { from: site.shipping.standard.days[0], to: site.shipping.standard.days[1] }) },
    { id: 'express', price: site.shipping.express.price, days: t('days', { from: site.shipping.express.days[0], to: site.shipping.express.days[1] }) },
    { id: 'pickup', price: 0, days: t('pickupWhen') },
  ];

  return (
    <form onSubmit={onSubmit} className="grid gap-14 lg:grid-cols-[1.3fr_1fr] xl:gap-24" noValidate={false}>
      <div className="space-y-12">
        <section aria-labelledby="ck-contact">
          <h2 id="ck-contact" className="mb-6 font-display text-heading">{t('contact')}</h2>
          <Field label={t('email')} id="email">
            <input id="email" name="email" type="email" required autoComplete="email" defaultValue={user?.email} className="field" />
          </Field>
          {!user && <p className="mt-3 text-caption text-fg-subtle">{t('guestNote')}</p>}
        </section>

        <fieldset>
          <legend className="mb-6 font-display text-heading">{t('delivery')}</legend>
          <div className="space-y-3">
            {methods.map((m) => (
              <label key={m.id} className={cn('flex cursor-pointer items-center gap-4 border p-4 transition-colors has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2', shippingMethod === m.id ? 'border-fg bg-fg/[0.03]' : 'border-line-strong hover:border-fg')}>
                <input type="radio" name="shippingMethod" value={m.id} checked={shippingMethod === m.id} onChange={() => setShipping(m.id)} className="h-4 w-4 accent-[var(--color-bronze)]" />
                <span className="flex-1"><span className="block">{t(`method.${m.id}`)}</span><span className="text-caption text-fg-muted">{m.days}</span></span>
                <span>{m.price === 0 ? t('free') : <Price cents={m.price} />}</span>
              </label>
            ))}
          </div>
        </fieldset>

        {shippingMethod !== 'pickup' && (
          <section aria-labelledby="ck-address">
            <h2 id="ck-address" className="mb-6 font-display text-heading">{t('address')}</h2>
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="sm:col-span-2"><Field label={t('fullName')} id="fullName"><input id="fullName" name="fullName" required autoComplete="name" defaultValue={def?.fullName ?? user?.name} className="field" /></Field></div>
              <div className="sm:col-span-2"><Field label={t('line1')} id="line1"><input id="line1" name="line1" required autoComplete="address-line1" defaultValue={def?.line1} className="field" /></Field></div>
              <div className="sm:col-span-2"><Field label={t('line2')} id="line2"><input id="line2" name="line2" autoComplete="address-line2" defaultValue={def?.line2} className="field" /></Field></div>
              <Field label={t('city')} id="city"><input id="city" name="city" required autoComplete="address-level2" defaultValue={def?.city} className="field" /></Field>
              <Field label={t('region')} id="region"><input id="region" name="region" autoComplete="address-level1" defaultValue={def?.region} className="field" /></Field>
              <Field label={t('postalCode')} id="postalCode"><input id="postalCode" name="postalCode" autoComplete="postal-code" defaultValue={def?.postalCode} className="field" /></Field>
              <Field label={t('country')} id="country">
                <select id="country" value={country} onChange={(e) => setCountry(e.target.value)} className="field" autoComplete="country">
                  {COUNTRIES.map((c) => <option key={c} value={c}>{regionNames.of(c)}</option>)}
                </select>
              </Field>
              <div className="sm:col-span-2"><Field label={t('phone')} id="phone"><input id="phone" name="phone" type="tel" autoComplete="tel" defaultValue={def?.phone} className="field" /></Field></div>
            </div>
          </section>
        )}

        <section aria-labelledby="ck-pay">
          <h2 id="ck-pay" className="mb-4 font-display text-heading">{t('payment')}</h2>
          <p className="border border-line-strong p-4 text-fg-muted">{providerLabel === 'stripe' ? t('payStripe') : t('payMock')}</p>
        </section>
      </div>

      <aside aria-label={t('summary')} className="lg:sticky lg:top-28 lg:self-start">
        <div className="border border-line bg-surface-raised p-6 md:p-8">
          <h2 className="mb-2 font-display text-heading">{t('summary')}</h2>
          {quote ? (
            <>
              <CartLines quote={quote} compact />
              <div className="my-4"><ShippingProgress quote={quote} /></div>
              <TotalsTable quote={quote} />
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
