import { Suspense } from 'react';
import { getTranslations } from 'next-intl/server';
import { StaggerText } from '@/components/motion/Reveal';
import { ProductCard } from '@/components/product/ProductCard';
import { JsonLd } from '@/components/seo/JsonLd';
import { Eyebrow } from '@/components/ui/Section';
import { categories } from '@/config/taxonomy';
import { collections } from '@/content/collections';
import type { Product } from '@/domain/catalog';
import { pick } from '@/domain/i18n';
import type { Locale } from '@/i18n/routing';
import { toCardData } from '@/lib/card-data';
import { itemListJsonLd } from '@/lib/seo';
import { ShopBrowser } from './ShopBrowser';

/** Estructura común de /shop y /shop/[category]. La lista base se renderiza en servidor (SEO); los filtros actúan en cliente. */
export async function ShopPage({ locale, products, title, blurb, eyebrow }: { locale: Locale; products: Product[]; title: string; blurb?: string; eyebrow?: string }) {
  const t = await getTranslations('shop');
  const cards = products.map((p, i) => ({ ...toCardData(p, locale), order: i }));

  const labels = {
    finish: { gold: t('finish.gold'), silver: t('finish.silver'), rose: t('finish.rose'), mixed: t('finish.mixed') },
    material: { steel: t('materialKeys.steel'), metal: t('materialKeys.metal') },
    audience: { women: pick(categories.find((c) => c.slug === 'women')!.name, locale), men: pick(categories.find((c) => c.slug === 'men')!.name, locale) },
    collection: Object.fromEntries(collections.map((c) => [c.slug, pick(c.name, locale)])),
  };

  return (
    <div className="pt-[calc(var(--header-h)+var(--announcement-h))]" data-header-tone="dark">
      <JsonLd data={itemListJsonLd(locale, products)} />
      <header className="container-x pb-10 pt-16 md:pb-14 md:pt-24">
        {eyebrow && <Eyebrow className="mb-5">{eyebrow}</Eyebrow>}
        <StaggerText as="h1" text={title} className="font-display text-display-l" intro />
        {blurb && <p className="mt-6 max-w-xl text-lead text-fg-muted">{blurb}</p>}
      </header>
      <Suspense
        fallback={
          <ul className="container-x grid grid-cols-2 gap-x-3 gap-y-12 pb-24 md:grid-cols-3 md:gap-x-6 xl:grid-cols-4">
            {cards.map((p, i) => (
              <li key={p.id}><ProductCard p={p} priority={i < 4} /></li>
            ))}
          </ul>
        }
      >
        <ShopBrowser products={cards} labels={labels} />
      </Suspense>
    </div>
  );
}
