'use client';

import { useActionState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/Button';
import { Field } from '@/components/ui/PageShell';
import type { PublicUser } from '@/domain/commerce';
import { updateProfileAction, type FormState } from '@/server/actions/account';

export function ProfileForm({ user }: { user: PublicUser }) {
  const t = useTranslations('account');
  const [state, action, pending] = useActionState<FormState, FormData>(updateProfileAction, undefined);
  return (
    <form action={action} className="max-w-md space-y-6">
      <Field label={t('profile.name')} id="p-name"><input id="p-name" name="name" required minLength={2} maxLength={80} defaultValue={user.name} autoComplete="name" className="field" /></Field>
      <Field label={t('profile.email')} id="p-email"><input id="p-email" value={user.email} readOnly className="field opacity-70" aria-readonly="true" /></Field>
      <Field label={t('profile.language')} id="p-lang">
        <select id="p-lang" name="locale" defaultValue={user.locale} className="field"><option value="es">Español</option><option value="en">English</option></select>
      </Field>
      <div className="flex items-center gap-4">
        <Button type="submit" disabled={pending}>{pending ? t('saving') : t('profile.save')}</Button>
        {state?.ok && <p role="status" className="text-caption text-success">{t('saved')}</p>}
        {state?.error && <p role="alert" className="text-caption text-danger">{t('saveError')}</p>}
      </div>
    </form>
  );
}
