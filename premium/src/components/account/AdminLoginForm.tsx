'use client';

import { useActionState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Button } from '@/components/ui/Button';
import { Field } from '@/components/ui/PageShell';
import { loginAction, type AuthState } from '@/server/actions/auth';

/** Acceso del administrador (precios, inventario y pedidos). Validación y límite de intentos en servidor; los errores no revelan si un correo existe. */
export function AdminLoginForm() {
  const t = useTranslations('auth');
  const locale = useLocale();
  const [state, action, pending] = useActionState<AuthState, FormData>(loginAction, undefined);
  const err = state?.error;

  return (
    <form action={action} className="space-y-6" noValidate>
      <input type="hidden" name="locale" value={locale} />
      <Field label={t('email')} id="email">
        <input id="email" name="email" type="email" required autoComplete="username" className="field" aria-invalid={err === 'invalid' || undefined} />
      </Field>
      <Field label={t('password')} id="password">
        <input id="password" name="password" type="password" required autoComplete="current-password" className="field" />
      </Field>
      {err && <p role="alert" className="border border-danger/40 bg-danger/5 p-3 text-caption text-danger">{t(`errors.${err}`)}</p>}
      <Button type="submit" size="lg" className="w-full" disabled={pending}>{pending ? t('wait') : t('signIn')}</Button>
    </form>
  );
}
