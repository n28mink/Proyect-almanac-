import Image from 'next/image';
import { getTranslations } from 'next-intl/server';
import { ParallaxMedia } from '@/components/motion/ParallaxMedia';
import { FadeReveal, ImageReveal } from '@/components/motion/Reveal';
import { TransitionLink } from '@/components/motion/TransitionLink';
import { Section, SectionHeading } from '@/components/ui/Section';
import { cn } from '@/lib/cn';

export interface LookTile {
  slug: string;
  src: string;
  blur?: string;
  alt: string;
  name: string;
}

const layouts = ['md:col-span-5 md:aspect-[4/5]', 'md:col-span-4 md:mt-24 md:aspect-[3/4]', 'md:col-span-3 md:aspect-[3/4]', 'md:col-span-4 md:aspect-[4/5]', 'md:col-span-5 md:mt-16 md:aspect-[5/4]', 'md:col-span-3 md:aspect-[3/4]'];

/** Lookbook: mosaico asimétrico con parallax suave. Cada imagen lleva a su ficha. */
export async function LookbookMosaic({ tiles }: { tiles: LookTile[] }) {
  const t = await getTranslations('home');
  return (
    <Section tone="sunken" headerTone="dark">
      <div className="container-x mb-14 flex flex-wrap items-end justify-between gap-6">
        <SectionHeading title={t('lookbookTitle')} size="m" />
        <TransitionLink href="/lookbook" className="label-micro link-underline">{t('lookbookCta')}</TransitionLink>
      </div>
      <div className="container-x grid grid-cols-2 gap-3 md:grid-cols-12 md:gap-6">
        {tiles.slice(0, 6).map((tile, i) => (
          <FadeReveal key={tile.slug} delay={(i % 3) * 90} className={cn('col-span-1', layouts[i], i === 0 && 'col-span-2')}>
            <TransitionLink href={`/product/${tile.slug}`} variant="clip" className="group block">
              <ImageReveal className="relative aspect-[3/4] w-full md:aspect-auto md:h-full">
                <ParallaxMedia amount={5} className="h-full w-full">
                  <Image src={tile.src} alt={tile.alt} fill sizes="(min-width: 768px) 30vw, 50vw" placeholder="blur" blurDataURL={tile.blur} className="object-cover" />
                </ParallaxMedia>
                <span className="label-micro absolute bottom-3 left-3 bg-ivory/90 px-2.5 py-1.5 text-ink opacity-0 backdrop-blur-sm transition-opacity duration-500 group-hover:opacity-100 group-focus-visible:opacity-100">{tile.name}</span>
              </ImageReveal>
            </TransitionLink>
          </FadeReveal>
        ))}
      </div>
    </Section>
  );
}
