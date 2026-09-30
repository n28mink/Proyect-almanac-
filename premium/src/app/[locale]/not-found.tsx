import { getTranslations } from 'next-intl/server';
import { ButtonLink } from '@/components/ui/Button';
import { PageShell } from '@/components/ui/PageShell';

export default async function NotFound() {
  const t = await getTranslations('notFound');
  return (
    <PageShell eyebrow="404" title={t('title')} text={t('text')}>
      <div className="flex flex-wrap gap-4">
        <ButtonLink href="/" transition="curtain">{t('home')}</ButtonLink>
        <ButtonLink href="/shop" variant="outline">{t('shop')}</ButtonLink>
      </div>
    </PageShell>
  );
}
