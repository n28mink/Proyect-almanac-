import Image from 'next/image';
import { getTranslations } from 'next-intl/server';
import { FadeReveal, ImageReveal, StaggerText } from '@/components/motion/Reveal';
import { ParallaxMedia } from '@/components/motion/ParallaxMedia';
import { ProductCard } from '@/components/product/ProductCard';
import { ButtonLink } from '@/components/ui/Button';
import { Section } from '@/components/ui/Section';
import type { Collection } from '@/domain/catalog';
import { pick } from '@/domain/i18n';
import type { Locale } from '@/i18n/routing';
import type { CardData } from '@/lib/card-data';

/** Colección destacada: texto a la izquierda, imagen contenida a la derecha y tres piezas debajo. */
export async function FeaturedCollection({ collection, cover, products, count, locale }: { collection: Collection; cover: { src: string; blur?: string; alt: string }; products: CardData[]; count: number; locale: Locale }) {
  const t = await getTranslations('home');
  return (
    <Section headerTone="dark">
      <div className="container-x grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,28rem)] lg:gap-24">
        <div className="order-2 lg:order-1">
          <p className="text-caption font-medium text-accent">{pick(collection.tagline, locale)}</p>
          <StaggerText as="h2" text={pick(collection.name, locale)} className="mt-4 font-display text-display-l" />
          <FadeReveal delay={120}>
            <p className="mt-6 max-w-md text-lead text-fg-muted">{pick(collection.description, locale)}</p>
            <p className="mt-6 text-caption text-fg-subtle">{t('pieces', { count })}</p>
            <div className="mt-8"><ButtonLink href={`/collections/${collection.slug}`} variant="outline" transition="clip">{t('discoverCollection')}</ButtonLink></div>
          </FadeReveal>
        </div>
        <ImageReveal className="relative order-1 mx-auto aspect-square w-full max-w-[16rem] sm:aspect-[4/5] sm:max-w-[22rem] lg:order-2 lg:max-w-none">
          <ParallaxMedia amount={6} className="h-full w-full">
            <Image src={cover.src} alt={cover.alt} fill sizes="(min-width: 1024px) 28rem, 90vw" priority={false} placeholder="blur" blurDataURL={cover.blur} className="object-cover" />
          </ParallaxMedia>
        </ImageReveal>
      </div>
      <div className="container-x mt-20 grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 lg:mt-28 lg:gap-x-8">
        {products.slice(0, 3).map((p, i) => (
          <FadeReveal key={p.id} delay={i * 90} className={i === 2 ? 'hidden md:block' : undefined}>
            <ProductCard p={p} sizes="(min-width: 768px) 30vw, 50vw" />
          </FadeReveal>
        ))}
      </div>
    </Section>
  );
}
