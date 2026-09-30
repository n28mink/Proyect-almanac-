import type { Metadata } from 'next';
import { hasLocale } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { BestSellers } from '@/components/home/BestSellers';
import { CategoryNav } from '@/components/home/CategoryNav';
import { CollectionsStory } from '@/components/home/CollectionsStory';
import { Craftsmanship } from '@/components/home/Craftsmanship';
import { EditorialSplit } from '@/components/home/EditorialSplit';
import { FashionEditorial } from '@/components/home/FashionEditorial';
import { FeaturedCollection } from '@/components/home/FeaturedCollection';
import { Hero } from '@/components/home/Hero';
import { JournalTeaser } from '@/components/home/JournalTeaser';
import { LookbookMosaic } from '@/components/home/LookbookMosaic';
import { WhatsAppBand } from '@/components/home/WhatsAppBand';
import { ProductRail } from '@/components/home/ProductRail';
import { ScrollExpandVideo } from '@/components/home/ScrollExpandVideo';
import { WatchShowcase } from '@/components/home/WatchShowcase';
import { KineticMarquee } from '@/components/motion/KineticMarquee';
import { StaggerText } from '@/components/motion/Reveal';
import { ButtonLink } from '@/components/ui/Button';
import { Eyebrow } from '@/components/ui/Section';
import { collections } from '@/content/collections';
import { journal } from '@/content/journal';
import { getVideo } from '@/content/media';
import { pick } from '@/domain/i18n';
import { routing } from '@/i18n/routing';
import { toCardData } from '@/lib/card-data';
import { buildMetadata } from '@/lib/seo';
import { getCampaigns } from '@/server/repositories/campaigns';
import { getCatalog } from '@/server/repositories/catalog';

export const revalidate = 300;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations({ locale, namespace: 'seo' });
  return buildMetadata({ locale, path: '/', title: t('title'), description: t('description') });
}

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations('home');

  const [catalog, campaigns] = await Promise.all([getCatalog(), getCampaigns()]);
  const byId = (id: string) => catalog.find((p) => p.id === id)!;

  const lumiere = collections.find((c) => c.slug === 'lumiere')!;
  const lumiereProducts = catalog.filter((p) => p.collection === 'lumiere').sort((a, b) => Number(b.featured) - Number(a.featured)).slice(0, 3);
  const coverProduct = byId(lumiere.coverProductId);
  const cover = coverProduct.images[0]!;

  const newArrivals = catalog.filter((p) => p.newArrival).slice(0, 10).map((p) => toCardData(p, locale));
  const bestsellers = catalog.filter((p) => p.bestseller).slice(0, 8).map((p) => toCardData(p, locale));
  const watch = byId('rw03');

  const splitA = byId('ar11').images[0]!;
  const splitB = byId('an07').images[0]!;
  const lookIds = ['ar10', 'co09', 'ar37', 'an06', 'pu05', 'co08'];
  const looks = lookIds.map((id) => byId(id)).map((p) => ({ slug: p.slug, src: p.images[0]!.src, blur: p.images[0]!.blur, alt: pick(p.images[0]!.alt, locale), name: pick(p.name, locale) }));

  const tiles = collections.map((c) => {
    const p = byId(c.coverProductId);
    return { slug: c.slug, name: pick(c.name, locale), tagline: pick(c.tagline, locale), description: pick(c.description, locale), image: { src: p.images[0]!.src, blur: p.images[0]!.blur }, piecesLabel: t('pieces', { count: catalog.filter((x) => x.collection === c.slug).length }), tone: c.tone };
  });

  const journalEntries = journal.slice(0, 3);
  const covers = Object.fromEntries(journalEntries.map((e) => { const img = byId(e.coverProductId).images[0]!; return [e.slug, { src: img.src, blur: img.blur }]; }));
  const marqueeItems = (['earrings', 'necklaces', 'rings', 'bracelets', 'watches'] as const).map((k) => t(`marquee.${k}`));

  return (
    <>
      <Hero campaign={campaigns.hero} video={getVideo(campaigns.hero.videoKey)} locale={locale} />

      <FeaturedCollection
        collection={lumiere}
        cover={{ src: cover.src, blur: cover.blur, alt: pick(cover.alt, locale) }}
        products={lumiereProducts.map((p) => toCardData(p, locale))}
        locale={locale}
      />

      <CategoryNav locale={locale} />

      <div className="bg-surface py-14 text-fg md:py-20" data-header-tone="dark" aria-hidden="true">
        <KineticMarquee items={marqueeItems.map((w) => <span key={w} className="font-display text-display-m italic text-fg/80 whitespace-nowrap">{w}</span>)} duration={52} />
      </div>

      <EditorialSplit imageA={{ src: splitA.src, blur: splitA.blur, alt: pick(splitA.alt, locale) }} imageB={{ src: splitB.src, blur: splitB.blur, alt: pick(splitB.alt, locale) }} />

      {getVideo(campaigns.jewelry.videoKey) && (
        <ScrollExpandVideo video={getVideo(campaigns.jewelry.videoKey)!}>
          <Eyebrow className="mb-5">{pick(campaigns.jewelry.eyebrow, locale)}</Eyebrow>
          <StaggerText as="h2" text={pick(campaigns.jewelry.title, locale)} className="font-display text-display-l max-w-3xl text-ivory" />
          <p className="mt-6 max-w-md text-lead text-ivory/90">{pick(campaigns.jewelry.text, locale)}</p>
          <div className="mt-9"><ButtonLink href={campaigns.jewelry.cta.href} transition="curtain" className="!border-ivory !bg-ivory !text-ink hover:!bg-transparent hover:!text-ivory">{pick(campaigns.jewelry.cta.label, locale)}</ButtonLink></div>
        </ScrollExpandVideo>
      )}

      <ProductRail products={newArrivals} eyebrow={t('newEyebrow')} title={t('newTitle')} href="/shop/new-arrivals" />

      <WatchShowcase campaign={campaigns.watches} video={getVideo(campaigns.watches.videoKey)} watch={watch} locale={locale} />

      <BestSellers products={bestsellers} />

      <FashionEditorial campaign={campaigns.fashion} video={getVideo(campaigns.fashion.videoKey)} locale={locale} />

      <CollectionsStory tiles={tiles} title={t('storyTitle')} eyebrow={t('storyEyebrow')} allLabel={t('allCollections')} />

      <Craftsmanship campaign={campaigns.story} video={getVideo(campaigns.story.videoKey)} locale={locale} />

      <LookbookMosaic tiles={looks} />

      <JournalTeaser entries={journalEntries} covers={covers} locale={locale} />

      <WhatsAppBand />
    </>
  );
}
