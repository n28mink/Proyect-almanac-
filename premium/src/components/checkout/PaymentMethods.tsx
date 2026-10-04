'use client';

import type { SVGProps } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { BankIcon, CashIcon, CheckIcon, MobilePayIcon } from '@/components/ui/Icon';
import { paymentMethodLabel, paymentMethods, type PaymentMethod } from '@/domain/commerce';
import { pick } from '@/domain/i18n';
import type { Locale } from '@/i18n/routing';

const ICON: Record<PaymentMethod, (p: SVGProps<SVGSVGElement>) => React.ReactElement> = {
  'pago-movil': MobilePayIcon,
  transferencia: BankIcon,
  efectivo: CashIcon,
};

export function PaymentIcon({ method, ...p }: { method: PaymentMethod } & SVGProps<SVGSVGElement>) {
  const Icon = ICON[method];
  return <Icon {...p} />;
}

/**
 * Forma de pago: tres opciones con icono, una preseleccionada. Debajo, en texto, lo que pasa con la elegida;
 * el resumen del pedido repite la elección. No se cobra en línea: el pago se coordina por WhatsApp.
 */
export function PaymentMethods({ value, onChange }: { value: PaymentMethod; onChange: (m: PaymentMethod) => void }) {
  const t = useTranslations('checkout');
  const locale = useLocale() as Locale;
  return (
    <fieldset aria-describedby="pay-chosen">
      <legend className="mb-2 font-display text-heading">{t('payment')}</legend>
      <p className="mb-6 text-caption text-fg-muted">{t('payIntro')}</p>
      <div className="grid gap-3 sm:grid-cols-3">
        {paymentMethods.map((m) => (
          <label key={m} className="pay-option">
            <input type="radio" name="paymentMethod" value={m} checked={m === value} onChange={() => onChange(m)} className="sr-only" />
            <span className="pay-icon"><PaymentIcon method={m} width={22} height={22} /></span>
            <span className="font-medium leading-snug">{pick(paymentMethodLabel[m], locale)}</span>
            <span className="pay-check" aria-hidden="true"><CheckIcon width={14} height={14} strokeWidth={2} /></span>
          </label>
        ))}
      </div>
      <p id="pay-chosen" aria-live="polite" className="mt-4 min-h-[2.75rem] text-caption text-fg-muted">
        <span key={value} className="morph-label block">{t(`payChosen.${value}`)}</span>
      </p>
    </fieldset>
  );
}
