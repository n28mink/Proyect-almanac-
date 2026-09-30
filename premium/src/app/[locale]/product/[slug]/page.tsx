import type { Metadata } from 'next';
import { hasLocale } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { FadeReveal } from '@/components/motion/Reveal';
import { TransitionLink } from '@/components/motion/TransitionLink';
import { ProductCard } from '@/components/product/ProductCard';
import { ProductDetail } from '@/components/product/ProductDetail';
import { ProductStory } from '@/components/product/ProductStory';
import { JsonLd } from '@/components/seo/JsonLd';
import { getCategory } from '@/config/taxonomy';
import { getCollection } from '@/content/collections';
import { getVideo } from '@/content/media';
import { pick } from '@/domain/i18n';
import { routing } from '@/i18n/routing';
import { toCardData, toProductView } from '@/lib/card-data';
import { breadcrumbJsonLd, buildMetadata, productJsonLd } from '@/lib/seo';
import { baseCatalog, getCatalog } from '@/server/repositories/catalog';

export const revalidate = 300;

export function generateStaticParams() {
  return routing.locales.flatMap((locale) => baseCatalog().map((p) => ({ locale, slug: p.slug })));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const p = (await getCatalog()).find((x) => x.slug === slug);
  if (!p) return {};
  return buildMetadata({ locale, path: `/product/${slug}`, title: pick(p.name, locale), description: pick(p.description, locale), image: p.images[0]!.src });
}

export default async function ProductPage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations('product');

  const catalog = await getCatalog();
  const product = catalog.find((x) => x.slug === slug);
  if (!product) notFound();

  const collection = product.collection ? getCollection(product.collection) : undefined;
  const view = toProductView(product, locale, collection ? pick(collection.name, locale) : undefined);
  const video = getVideo(product.videos.find((k) => k.startsWith('product.')) ?? '');
  const category = getCategory(product.category);

  const related = catalog
    .filter((x) => x.id !== product.id && (product.collection ? x.collection === product.collection : x.category === product.category))
    .slice(0, 4);

  return (
    <div className="pb-24 pt-[calc(var(--header-h)+var(--announcement-h)+1.5rem)] lg:pb-0">
      <JsonLd data={productJsonLd(locale, product)} />
      <JsonLd data={breadcrumbJsonLd(locale, [{ name: t('home'), path: '/' }, { name: pick(category?.name ?? { es: product.category, en: product.category }, locale), path: `/shop/${product.category}` }, { name: pick(product.name, locale), path: `/product/${product.slug}` }])} />

      <nav aria-label={t('breadcrumb')} className="container-x mb-6 label-micro text-fg-subtle" data-header-tone="dark">
        <ol className="flex flex-wrap items-center gap-2">
          <li><TransitionLink href="/" className="hover:text-fg">{t('home')}</TransitionLink></li>
          <li aria-hidden="true">/</li>
          <li><TransitionLink href={`/shop/${product.category}`} className="hover:text-fg">{view.categoryLabel}</TransitionLink></li>
          <li aria-hidden="true">/</li>
          <li aria-current="page" className="text-fg">{view.name}</li>
        </ol>
      </nav>

      <div data-header-tone="dark">
        <ProductDetail p={view} locale={locale} />
      </div>

      <ProductStory p={view} video={video} />

      {related.length > 0 && (
        <section data-header-tone="dark" className="container-x mt-24 pb-24 md:mt-32">
          <h2 className="mb-10 font-display text-display-m">{collection ? t('moreFrom', { name: pick(collection.name, locale) }) : t('related')}</h2>
          <ul className="grid grid-cols-2 gap-x-4 gap-y-10 lg:grid-cols-4 lg:gap-x-8">
            {related.map((r, i) => (
              <FadeReveal as="li" key={r.id} delay={i * 80}>
                <ProductCard p={toCardData(r, locale)} />
              </FadeReveal>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
