'use client';

import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/Button';

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const t = useTranslations('common');
  return (
    <div className="container-x grid min-h-[70svh] place-items-center pt-[calc(var(--header-h)+var(--announcement-h))] text-center" role="alert">
      <div className="space-y-6">
        <p className="font-display text-display-m">{t('errorTitle')}</p>
        <p className="mx-auto max-w-md text-fg-muted">{t('errorText')}</p>
        <Button onClick={reset}>{t('retry')}</Button>
      </div>
    </div>
  );
}
