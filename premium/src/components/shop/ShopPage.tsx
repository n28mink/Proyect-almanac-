import Image from 'next/image';
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
import { toCardData } from '@/lib/card-data';
import { itemListJsonLd } from '@/lib/seo';
import { ShopBrowser } from './ShopBrowser';

/** Estructura común de /shop y /shop/[category]. La lista base se renderiza en servidor (SEO); los filtros actúan en cliente. */
/** Difuminado de la foto en móvil: se funde con el fondo por arriba y por la izquierda, como el de escritorio. */
const MOBILE_FADE = {
  maskImage: 'linear-gradient(to right, transparent, #000 34%), linear-gradient(to bottom, transparent, #000 38%)',
  maskComposite: 'intersect',
  WebkitMaskImage: 'linear-gradient(to right, transparent, #000 34%), linear-gradient(to bottom, transparent, #000 38%)',
  WebkitMaskComposite: 'source-in',
} as const;

export interface ShopHero {
  src: string;
  alt: string;
  blur?: string;
  /** object-position CSS de la foto (el collar queda a la vista al encuadrar). */
  position?: string;
  /** Voltea la foto en horizontal (para que la pieza quede del lado visible del degradado). */
  flip?: boolean;
}

export async function ShopPage({ locale, products, title, blurb, eyebrow, category, parent, branches, hero }: { locale: Locale; products: Product[]; title: string; blurb?: string; eyebrow?: string; category?: string; parent?: { label: string; href: string }; /** Ramas de una categoría con desglose (Regalos → para ella / para él). */ branches?: { label: string; href: string; current: boolean }[]; hero?: ShopHero }) {
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
  const up = parent ?? (category ? { label: t('breadcrumbShop'), href: '/shop' } : undefined);

  return (
    <div className="pt-[calc(var(--header-h)+var(--announcement-h)+1.5rem)]" data-header-tone="dark">
      <JsonLd data={itemListJsonLd(locale, products)} />
      <header className={hero ? 'relative isolate overflow-hidden pb-8 md:min-h-[27rem] md:pb-12' : undefined}>
        {hero && (
          <div className="absolute inset-y-0 right-0 -z-10 hidden w-[58%] md:block lg:w-[50%]" aria-hidden="true" style={{ maskImage: 'linear-gradient(to right, transparent, #000 38%)', WebkitMaskImage: 'linear-gradient(to right, transparent, #000 38%)' }}>
            <Image src={hero.src} alt="" fill priority sizes="(min-width: 1024px) 50vw, 58vw" quality={80} placeholder={hero.blur ? 'blur' : 'empty'} blurDataURL={hero.blur} className="object-cover" style={{ objectPosition: hero.position ?? '50% 60%', transform: hero.flip ? 'scaleX(-1)' : undefined }} />
          </div>
        )}
        <div className="container-x pb-8 md:pb-10">
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
        <div>
          <div>
            <StaggerText as="h1" text={title} className="font-display text-display-m" intro />
            {eyebrow && <p className="mt-4 max-w-md text-lead text-fg">{eyebrow}</p>}
            {blurb && <p className="mt-3 max-w-md text-fg-muted">{blurb}</p>}
            {branches && (
              <ul className="mt-6 flex flex-wrap gap-2" aria-label={t('giftBranches')}>
                {branches.map((b) => (
                  <li key={b.href}>
                    <TransitionLink href={b.href} aria-current={b.current ? 'page' : undefined} className={`inline-flex min-h-11 items-center border px-5 text-sm transition-colors ${b.current ? 'border-accent bg-accent text-surface' : 'border-line-strong text-fg hover:bg-fg/5'}`}>{b.label}</TransitionLink>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        </div>
        {hero && (
          <div className="container-x md:hidden">
            <div className="relative mt-2 aspect-[5/3] overflow-hidden" style={MOBILE_FADE}>
              <Image src={hero.src} alt={hero.alt} fill priority sizes="100vw" quality={80} placeholder={hero.blur ? 'blur' : 'empty'} blurDataURL={hero.blur} className="object-cover" style={{ objectPosition: hero.position ?? '50% 60%', transform: hero.flip ? 'scaleX(-1)' : undefined }} />
            </div>
          </div>
        )}
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
