import { hasLocale } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { getVideo, listVideoKeys } from '@/content/media';
import { pick } from '@/domain/i18n';
import { routing } from '@/i18n/routing';

export default async function AdminMedia({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations('admin');
  const items = listVideoKeys().map((k) => getVideo(k)!).filter(Boolean);
  return (
    <div>
      <h1 className="font-display text-display-m">{t('tabs.media')}</h1>
      <p className="mb-8 mt-3 max-w-2xl text-fg-muted">{t('mediaText')}</p>
      <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((v) => (
          <li key={v.key} className="border border-line">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={v.poster.desktop.src} alt="" width={v.poster.desktop.width} height={v.poster.desktop.height} loading="lazy" className="aspect-video w-full object-cover" />
            <div className="space-y-1 p-4 text-caption"><p className="label-micro text-accent">{v.key}</p><p className="text-fg-muted">{pick(v.label, locale)}</p><p className="text-fg-subtle">{v.duration.toFixed(1)} s · {v.sources.desktop.length} src{v.sources.mobile ? ' + mobile' : ''}</p></div>
          </li>
        ))}
      </ul>
    </div>
  );
}
