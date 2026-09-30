import type { Metadata } from 'next';
import Image from 'next/image';
import { hasLocale } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { LuxuryVideo } from '@/components/media/LuxuryVideo';
import { FadeReveal, ImageReveal } from '@/components/motion/Reveal';
import { buttonClass } from '@/components/ui/Button';
import { PageShell } from '@/components/ui/PageShell';
import { site } from '@/config/site';
import { getVideo } from '@/content/media';
import { routing } from '@/i18n/routing';
import { buildMetadata } from '@/lib/seo';
import { baseCatalog } from '@/server/repositories/catalog';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations({ locale, namespace: 'about' });
  return buildMetadata({ locale, path: '/about', title: t('title'), description: t('text') });
}

export default async function About({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations('about');
  const img = baseCatalog().find((p) => p.id === 'pu08')!.images[0]!;
  const video = getVideo('story.craft');
  const values = ['one', 'two', 'three'] as const;

  return (
    <PageShell eyebrow={t('eyebrow')} title={t('title')} text={t('text')}>
      <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-24">
        <ImageReveal className="relative aspect-[4/5] w-full"><Image src={img.src} alt="" fill sizes="(min-width: 1024px) 45vw, 100vw" priority placeholder="blur" blurDataURL={img.blur} className="object-cover" /></ImageReveal>
        <FadeReveal className="space-y-6 text-lead text-fg-muted">
          <p>{t('p1', { area: site.address.area, locality: site.address.locality })}</p>
          <p>{t('p2')}</p>
          <p>{t('p3')}</p>
          <a href={`https://wa.me/${site.whatsapp}`} target="_blank" rel="noopener noreferrer" className={buttonClass('outline', 'md', 'mt-4')}>{t('cta')}</a>
        </FadeReveal>
      </div>

      {video && <div className="mt-24"><LuxuryVideo video={video} aspectRatio="21 / 9" className="w-full" /></div>}

      <ol className="mt-24 grid gap-10 border-t border-line pt-12 md:grid-cols-3">
        {values.map((v, i) => (
          <FadeReveal as="li" key={v} delay={i * 100}><span className="label-micro text-accent">{String(i + 1).padStart(2, '0')}</span><h2 className="mt-3 font-display text-heading">{t(`values.${v}.title`)}</h2><p className="mt-3 text-fg-muted">{t(`values.${v}.text`)}</p></FadeReveal>
        ))}
      </ol>
    </PageShell>
  );
}
