import type { Metadata } from 'next';
import Image from 'next/image';
import { hasLocale } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { LuxuryVideo } from '@/components/media/LuxuryVideo';
import { ParallaxMedia } from '@/components/motion/ParallaxMedia';
import { FadeReveal, ImageReveal } from '@/components/motion/Reveal';
import { TransitionLink } from '@/components/motion/TransitionLink';
import { PageShell } from '@/components/ui/PageShell';
import { getVideo } from '@/content/media';
import { pick } from '@/domain/i18n';
import { routing } from '@/i18n/routing';
import { buildMetadata } from '@/lib/seo';
import { getCatalog } from '@/server/repositories/catalog';

export const revalidate = 300;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations({ locale, namespace: 'lookbook' });
  return buildMetadata({ locale, path: '/lookbook', title: t('title'), description: t('text') });
}

const IDS = ['ar10', 'co09', 'ar37', 'an06', 'pu05', 'co08', 'an07', 'pu09', 'ar39', 'co11', 'an04', 'pu06'];

export default async function Lookbook({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations('lookbook');
  const catalog = await getCatalog();
  const looks = IDS.map((id) => catalog.find((p) => p.id === id)).filter((p): p is NonNullable<typeof p> => !!p);
  const video = getVideo('editorial.fashion');
  const spans = ['md:col-span-7', 'md:col-span-5', 'md:col-span-4', 'md:col-span-4', 'md:col-span-4', 'md:col-span-6', 'md:col-span-6', 'md:col-span-5', 'md:col-span-7', 'md:col-span-4', 'md:col-span-4', 'md:col-span-4'];

  return (
    <PageShell eyebrow={t('eyebrow')} title={t('title')} text={t('text')}>
      {video && <div className="mb-16"><LuxuryVideo video={video} priority aspectRatio="21 / 9" className="w-full" /></div>}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-12 md:gap-6">
        {looks.map((p, i) => {
          const img = p.images[0]!;
          return (
            <FadeReveal key={p.id} delay={(i % 3) * 80} className={spans[i]}>
              <TransitionLink href={`/product/${p.slug}`} variant="clip" className="group block">
                <ImageReveal className="relative aspect-[4/5] w-full md:aspect-[5/6]">
                  <ParallaxMedia amount={4} className="h-full w-full"><Image src={img.src} alt={pick(img.alt, locale)} fill sizes="(min-width: 768px) 45vw, 100vw" placeholder="blur" blurDataURL={img.blur} className="object-cover" /></ParallaxMedia>
                </ImageReveal>
                <p className="mt-3 flex items-baseline justify-between gap-4"><span className="font-display text-lead group-hover:text-accent">{pick(p.name, locale)}</span><span className="label-micro text-fg-subtle">{t('shopLook')}</span></p>
              </TransitionLink>
            </FadeReveal>
          );
        })}
      </div>
    </PageShell>
  );
}
