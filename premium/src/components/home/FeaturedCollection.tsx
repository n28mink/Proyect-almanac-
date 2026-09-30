import Image from 'next/image';
import { getTranslations } from 'next-intl/server';
import { ImageReveal, FadeReveal } from '@/components/motion/Reveal';
import { ParallaxMedia } from '@/components/motion/ParallaxMedia';
import { ProductCard } from '@/components/product/ProductCard';
import { ButtonLink } from '@/components/ui/Button';
import { Section, SectionHeading } from '@/components/ui/Section';
import type { Collection } from '@/domain/catalog';
import { pick } from '@/domain/i18n';
import type { Locale } from '@/i18n/routing';
import type { CardData } from '@/lib/card-data';

/** Colección destacada: gran imagen con parallax + texto editorial + tres piezas. */
export async function FeaturedCollection({ collection, cover, products, locale }: { collection: Collection; cover: { src: string; blur?: string; alt: string }; products: CardData[]; locale: Locale }) {
  const t = await getTranslations('home');
  return (
    <Section headerTone="dark">
      <div className="container-x grid items-center gap-12 lg:grid-cols-[1.05fr_1fr] lg:gap-20">
        <ImageReveal className="relative aspect-[4/5] w-full">
          <ParallaxMedia amount={7} className="h-full w-full">
            <Image src={cover.src} alt={cover.alt} fill sizes="(min-width: 1024px) 50vw, 100vw" priority={false} placeholder="blur" blurDataURL={cover.blur} className="object-cover" />
          </ParallaxMedia>
        </ImageReveal>
        <div>
          <SectionHeading title={pick(collection.name, locale)} text={pick(collection.description, locale)} />
          <FadeReveal delay={200} className="mt-10">
            <ButtonLink href={`/collections/${collection.slug}`} variant="outline" transition="clip">{t('discoverCollection')}</ButtonLink>
          </FadeReveal>
        </div>
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
