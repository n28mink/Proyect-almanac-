import type { Metadata } from 'next';
import Image from 'next/image';
import { hasLocale } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { FadeReveal, ImageReveal, StaggerText } from '@/components/motion/Reveal';
import { TransitionLink } from '@/components/motion/TransitionLink';
import { Eyebrow } from '@/components/ui/Section';
import { collections } from '@/content/collections';
import { pick } from '@/domain/i18n';
import { routing } from '@/i18n/routing';
import { buildMetadata } from '@/lib/seo';
import { getCatalog } from '@/server/repositories/catalog';

export const revalidate = 300;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations({ locale, namespace: 'collections' });
  return buildMetadata({ locale, path: '/collections', title: t('title'), description: t('text') });
}

export default async function CollectionsIndex({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations('collections');
  const catalog = await getCatalog();

  return (
    <div className="pt-[calc(var(--header-h)+var(--announcement-h))]" data-header-tone="dark">
      <header className="container-x pb-14 pt-16 md:pt-24">
        <Eyebrow className="mb-5">{t('eyebrow')}</Eyebrow>
        <StaggerText as="h1" text={t('title')} className="font-display text-display-l" intro />
        <p className="mt-6 max-w-xl text-lead text-fg-muted">{t('text')}</p>
      </header>
      <ul className="container-x grid gap-x-8 gap-y-20 pb-28 md:grid-cols-2">
        {collections.map((c, i) => {
          const p = catalog.find((x) => x.id === c.coverProductId)!;
          const img = p.images[0]!;
          const count = catalog.filter((x) => x.collection === c.slug).length;
          return (
            <FadeReveal as="li" key={c.slug} delay={(i % 2) * 120} className={i % 2 === 1 ? 'md:mt-24' : ''}>
              <TransitionLink href={`/collections/${c.slug}`} variant="mask" className="group block">
                <ImageReveal className="relative aspect-[4/5] w-full bg-surface-sunken">
                  <Image src={img.src} alt="" fill sizes="(min-width: 768px) 45vw, 100vw" placeholder="blur" blurDataURL={img.blur} className="object-cover transition-transform duration-[1600ms] ease-[var(--ease-expo)] group-hover:scale-[1.04]" />
                </ImageReveal>
                <div className="mt-6 flex items-end justify-between gap-6">
                  <div>
                    <p className="label-micro text-accent">{pick(c.tagline, locale)}</p>
                    <h2 className="mt-2 font-display text-display-m leading-none group-hover:text-accent">{pick(c.name, locale)}</h2>
                  </div>
                  <span className="label-micro whitespace-nowrap text-fg-subtle">{t('pieces', { count })}</span>
                </div>
              </TransitionLink>
            </FadeReveal>
          );
        })}
      </ul>
    </div>
  );
}
