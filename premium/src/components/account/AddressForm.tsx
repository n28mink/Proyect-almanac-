'use client';

import { useActionState, useRef, useEffect } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Button } from '@/components/ui/Button';
import { Field } from '@/components/ui/PageShell';
import { addAddressAction, type FormState } from '@/server/actions/account';

const COUNTRIES = ['VE', 'CO', 'US', 'ES', 'MX', 'PA', 'CL', 'PE', 'AR', 'EC', 'DO'];

export function AddressForm() {
  const t = useTranslations('account');
  const locale = useLocale();
  const ref = useRef<HTMLFormElement>(null);
  const [state, action, pending] = useActionState<FormState, FormData>(addAddressAction, undefined);
  const names = new Intl.DisplayNames([locale], { type: 'region' });
  useEffect(() => {
    if (state?.ok) ref.current?.reset();
  }, [state]);

  return (
    <form ref={ref} action={action} className="grid gap-5 sm:grid-cols-2">
      <div className="sm:col-span-2"><Field label={t('addr.label')} id="a-label"><input id="a-label" name="label" maxLength={40} className="field" /></Field></div>
      <div className="sm:col-span-2"><Field label={t('addr.fullName')} id="a-name"><input id="a-name" name="fullName" required autoComplete="name" className="field" /></Field></div>
      <div className="sm:col-span-2"><Field label={t('addr.line1')} id="a-l1"><input id="a-l1" name="line1" required autoComplete="address-line1" className="field" /></Field></div>
      <div className="sm:col-span-2"><Field label={t('addr.line2')} id="a-l2"><input id="a-l2" name="line2" autoComplete="address-line2" className="field" /></Field></div>
      <Field label={t('addr.city')} id="a-city"><input id="a-city" name="city" required autoComplete="address-level2" className="field" /></Field>
      <Field label={t('addr.region')} id="a-region"><input id="a-region" name="region" autoComplete="address-level1" className="field" /></Field>
      <Field label={t('addr.postalCode')} id="a-zip"><input id="a-zip" name="postalCode" autoComplete="postal-code" className="field" /></Field>
      <Field label={t('addr.country')} id="a-country">
        <select id="a-country" name="country" defaultValue="VE" className="field">{COUNTRIES.map((c) => <option key={c} value={c}>{names.of(c)}</option>)}</select>
      </Field>
      <div className="sm:col-span-2"><Field label={t('addr.phone')} id="a-phone"><input id="a-phone" name="phone" type="tel" autoComplete="tel" className="field" /></Field></div>
      <label className="flex items-center gap-3 sm:col-span-2"><input type="checkbox" name="isDefault" className="checkbox" />{t('addr.makeDefault')}</label>
      <div className="sm:col-span-2 flex items-center gap-4">
        <Button type="submit" disabled={pending}>{pending ? t('saving') : t('addr.add')}</Button>
        {state?.ok && <p role="status" className="text-caption text-success">{t('saved')}</p>}
        {state?.error && <p role="alert" className="text-caption text-danger">{t('saveError')}</p>}
      </div>
    </form>
  );
}
