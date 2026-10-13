import { Suspense } from 'react';
import { getTranslations } from 'next-intl/server';
import { StaggerText } from '@/components/motion/Reveal';
import { ProductCard } from '@/components/product/ProductCard';
import { JsonLd } from '@/components/seo/JsonLd';
import { TransitionLink } from '@/components/motion/TransitionLink';
import { categories } from '@/config/taxonomy';
import { collections } from '@/content/collections';
import type { Product } from '@/domain/catalog';
import { pick } from '@/domain/i18n';
import type { Locale } from '@/i18n/routing';
import type { CardData } from '@/lib/card-data';
import { toCardData } from '@/lib/card-data';
import { itemListJsonLd } from '@/lib/seo';
import { ShopBrowser } from './ShopBrowser';
import { ShopShortcuts, type Shortcut } from './ShopShortcuts';

const TYPE_SLUGS = ['necklaces', 'earrings', 'rings', 'bracelets', 'watches', 'shirts', 'accessories'];
const JEWELRY_SLUGS = ['necklaces', 'earrings', 'rings', 'bracelets'];

/** Atajos bajo el título: tipos de pieza en la tienda completa y en Joyería; en el resto, los tonos (o colores de prenda) que haya. */
function buildShortcuts(cards: CardData[], category: string | undefined, labels: { finish: Record<string, string>; color: Record<string, string> }, locale: Locale): Shortcut[] {
  const img = (c: CardData) => ({ src: c.image.src, blur: c.image.blur });
  const byType = (slugs: string[]) =>
    slugs.flatMap((slug) => {
      const def = categories.find((c) => c.slug === slug);
      const pool = cards.filter((c) => c.categorySlug === slug);
      const cover = pool.find((c) => c.id === def?.coverProductId) ?? pool[0];
      return def && cover ? [{ key: slug, label: pick(def.name, locale), href: `/shop/${slug}`, image: img(cover) }] : [];
    });
  if (!category) return byType(TYPE_SLUGS);
  if (category === 'jewelry') return byType(JEWELRY_SLUGS);

  const base = `/shop/${category}`;
  const finishes = [...new Set(cards.map((c) => c.finish).filter((f): f is NonNullable<CardData['finish']> => Boolean(f)))];
  if (finishes.length >= 2) {
    return finishes.map((f) => ({ key: f, label: labels.finish[f] ?? f, href: `${base}?finish=${f}`, image: img(cards.find((c) => c.finish === f)!) }));
  }
  const colors = [...new Map(cards.flatMap((c) => c.garmentColors.map((g) => [g.key, c] as const))).entries()];
  return colors.length >= 2 ? colors.map(([key, c]) => ({ key, label: labels.color[key] ?? key, href: `${base}?color=${key}`, image: img(c) })) : [];
}

/** Estructura común de /shop y /shop/[category]. La lista base se renderiza en servidor (SEO); los filtros actúan en cliente. */
export async function ShopPage({ locale, products, title, blurb, eyebrow, category, parent }: { locale: Locale; products: Product[]; title: string; blurb?: string; eyebrow?: string; category?: string; parent?: { label: string; href: string } }) {
  const t = await getTranslations('shop');
  const tp = await getTranslations('product');
  const cards = products.map((p, i) => ({ ...toCardData(p, locale), order: i }));

  const labels = {
    finish: { gold: t('finish.gold'), silver: t('finish.silver'), rose: t('finish.rose'), mixed: t('finish.mixed') },
    color: Object.fromEntries(cards.flatMap((c) => c.garmentColors.map((g) => [g.key, g.label]))),
    material: { steel: t('materialKeys.steel'), metal: t('materialKeys.metal'), textile: t('materialKeys.textile') },
    audience: { women: pick(categories.find((c) => c.slug === 'women')!.name, locale), men: pick(categories.find((c) => c.slug === 'men')!.name, locale) },
    collection: Object.fromEntries(collections.map((c) => [c.slug, pick(c.name, locale)])),
  };
  const shortcuts = parent ? [] : buildShortcuts(cards, category, labels, locale);
  const up = parent ?? (category ? { label: t('breadcrumbShop'), href: '/shop' } : undefined);

  return (
    <div className="pt-[calc(var(--header-h)+var(--announcement-h)+1.5rem)]" data-header-tone="dark">
      <JsonLd data={itemListJsonLd(locale, products)} />
      <header className="container-x pb-8 md:pb-10">
        <nav aria-label={tp('breadcrumb')} className="label-micro mb-8 text-fg-subtle">
          <ol className="flex flex-wrap items-center gap-2">
            <li><TransitionLink href="/" className="hover:text-fg">{tp('home')}</TransitionLink></li>
            <li aria-hidden="true">/</li>
            {up ? (
              <>
                <li><TransitionLink href={up.href} className="hover:text-fg">{up.label}</TransitionLink></li>
                <li aria-hidden="true">/</li>
                <li aria-current="page" className="text-fg">{title}</li>
              </>
            ) : (
              <li aria-current="page" className="text-fg">{t('breadcrumbShop')}</li>
            )}
          </ol>
        </nav>
        <div className="grid items-end gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:gap-16">
          <div>
            <StaggerText as="h1" text={title} className="font-display text-display-m" intro />
            {eyebrow && <p className="mt-4 max-w-md text-lead text-fg">{eyebrow}</p>}
            {blurb && <p className="mt-3 max-w-md text-fg-muted">{blurb}</p>}
          </div>
          <ShopShortcuts items={shortcuts} label={t('shortcuts')} />
        </div>
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
