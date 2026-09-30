import { hasLocale } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Field } from '@/components/ui/PageShell';
import { listVideoKeys } from '@/content/media';
import { routing } from '@/i18n/routing';
import { saveCampaignAction } from '@/server/actions/admin';
import { getCampaigns } from '@/server/repositories/campaigns';

const BLOCKS = ['hero', 'jewelry', 'watches', 'fashion', 'story'] as const;

/** Cambia el vídeo (por clave del media registry) y los textos de cada bloque de campaña de la home, sin tocar código. */
export default async function AdminCampaigns({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations('admin');
  const campaigns = await getCampaigns();
  const keys = listVideoKeys().filter((k) => !k.startsWith('product.'));

  return (
    <div>
      <h1 className="font-display text-display-m">{t('tabs.campaigns')}</h1>
      <p className="mb-10 mt-3 max-w-2xl text-fg-muted">{t('campaignsText')}</p>
      <div className="grid gap-10 xl:grid-cols-2">
        {BLOCKS.map((b) => {
          const c = campaigns[b];
          return (
            <form key={b} action={saveCampaignAction} className="space-y-4 border border-line p-6">
              <input type="hidden" name="block" value={b} />
              <h2 className="label-micro text-accent">{t(`block.${b}`)}</h2>
              <Field label={t('video')} id={`${b}-video`}>
                <select id={`${b}-video`} name="videoKey" defaultValue={c.videoKey} className="field">{keys.map((k) => <option key={k} value={k}>{k}</option>)}</select>
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label={`${t('title')} (ES)`} id={`${b}-te`}><input id={`${b}-te`} name="titleEs" defaultValue={c.title.es} required maxLength={120} className="field" /></Field>
                <Field label={`${t('title')} (EN)`} id={`${b}-tn`}><input id={`${b}-tn`} name="titleEn" defaultValue={c.title.en} required maxLength={120} className="field" /></Field>
                <Field label={`${t('text')} (ES)`} id={`${b}-xe`}><textarea id={`${b}-xe`} name="textEs" defaultValue={c.text.es} required maxLength={280} rows={3} className="field" /></Field>
                <Field label={`${t('text')} (EN)`} id={`${b}-xn`}><textarea id={`${b}-xn`} name="textEn" defaultValue={c.text.en} required maxLength={280} rows={3} className="field" /></Field>
              </div>
              <Button type="submit" variant="outline" size="sm">{t('save')}</Button>
            </form>
          );
        })}
      </div>
    </div>
  );
}
