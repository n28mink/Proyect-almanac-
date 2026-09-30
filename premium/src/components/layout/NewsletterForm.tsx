'use client';

import { useActionState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/Button';
import { subscribeNewsletterAction, type NewsletterState } from '@/server/actions/shop';

export function NewsletterForm() {
  const t = useTranslations('newsletter');
  const [state, action, pending] = useActionState<NewsletterState, FormData>(subscribeNewsletterAction, undefined);

  if (state?.ok) {
    return (
      <p role="status" className="font-display text-heading">
        {t('thanks')}
      </p>
    );
  }

  return (
    <form action={action} className="w-full max-w-xl" noValidate>
      <label htmlFor="newsletter-email" className="sr-only">{t('emailLabel')}</label>
      <div className="flex flex-col gap-3 sm:flex-row">
        <input id="newsletter-email" name="email" type="email" autoComplete="email" required placeholder={t('placeholder')} className="field flex-1" aria-invalid={state?.error === 'invalid' || undefined} aria-describedby="newsletter-msg" />
        {/* Campo trampa anti-bots: oculto a personas y a lectores de pantalla. */}
        <input name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 opacity-0" />
        <Button type="submit" size="md" disabled={pending}>{pending ? t('sending') : t('submit')}</Button>
      </div>
      <p id="newsletter-msg" role={state?.error ? 'alert' : undefined} className="mt-3 min-h-5 text-caption text-fg-muted">
        {state?.error === 'invalid' ? t('invalid') : state?.error === 'rate' ? t('rate') : t('privacy')}
      </p>
    </form>
  );
}
