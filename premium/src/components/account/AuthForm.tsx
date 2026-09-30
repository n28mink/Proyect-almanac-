'use client';

import { useActionState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { TransitionLink } from '@/components/motion/TransitionLink';
import { Button } from '@/components/ui/Button';
import { Field } from '@/components/ui/PageShell';
import { loginAction, registerAction, type AuthState } from '@/server/actions/auth';

/** Login / registro con validación y rate limiting en servidor; los errores no revelan si un correo existe. */
export function AuthForm({ mode, next }: { mode: 'login' | 'register'; next?: string }) {
  const t = useTranslations('auth');
  const locale = useLocale();
  const [state, action, pending] = useActionState<AuthState, FormData>(mode === 'login' ? loginAction : registerAction, undefined);
  const err = state?.error;

  return (
    <form action={action} className="space-y-6" noValidate>
      <input type="hidden" name="locale" value={locale} />
      {next && <input type="hidden" name="next" value={next} />}
      {mode === 'register' && (
        <Field label={t('name')} id="name">
          <input id="name" name="name" required minLength={2} maxLength={80} autoComplete="name" className="field" />
        </Field>
      )}
      <Field label={t('email')} id="email">
        <input id="email" name="email" type="email" required autoComplete={mode === 'login' ? 'username' : 'email'} className="field" aria-invalid={err === 'invalid' || undefined} />
      </Field>
      <Field label={t('password')} id="password">
        <input id="password" name="password" type="password" required minLength={mode === 'register' ? 10 : 1} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} className="field" aria-describedby="pw-hint" />
        {mode === 'register' && <p id="pw-hint" className="text-caption text-fg-subtle">{t('passwordHint')}</p>}
      </Field>

      {err && <p role="alert" className="border border-danger/40 bg-danger/5 p-3 text-caption text-danger">{t(`errors.${err}`)}</p>}

      <Button type="submit" size="lg" className="w-full" disabled={pending}>{pending ? t('wait') : mode === 'login' ? t('signIn') : t('createAccount')}</Button>

      <p className="text-center text-caption text-fg-muted">
        {mode === 'login' ? t('noAccount') : t('haveAccount')}{' '}
        <TransitionLink href={mode === 'login' ? '/register' : '/login'} variant="ivory" className="link-underline text-fg">{mode === 'login' ? t('createAccount') : t('signIn')}</TransitionLink>
      </p>
    </form>
  );
}
