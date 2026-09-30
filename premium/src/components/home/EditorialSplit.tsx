import Image from 'next/image';
import { getTranslations } from 'next-intl/server';
import { FadeReveal, ImageReveal, StaggerText } from '@/components/motion/Reveal';
import { ButtonLink } from '@/components/ui/Button';
import { Section } from '@/components/ui/Section';

interface Img { src: string; blur?: string; alt: string }

/** Sección editorial partida: imagen fija (sticky) mientras el relato avanza. Mucho espacio negativo. */
export async function EditorialSplit({ imageA, imageB }: { imageA: Img; imageB: Img }) {
  const t = await getTranslations('home');
  return (
    <Section tone="sunken" headerTone="dark">
      <div className="container-x grid gap-14 lg:grid-cols-2 lg:gap-24">
        <div className="lg:sticky lg:top-28 lg:h-[calc(100svh-9rem)] lg:self-start">
          <ImageReveal className="relative aspect-[4/5] w-full lg:aspect-auto lg:h-full">
            <Image src={imageA.src} alt={imageA.alt} fill sizes="(min-width: 1024px) 45vw, 100vw" placeholder="blur" blurDataURL={imageA.blur} className="object-cover" />
          </ImageReveal>
        </div>

        <div className="flex flex-col justify-center gap-16 lg:py-24">
          <div>
            <StaggerText as="p" text={t('philosophyQuote')} className="font-display text-display-m" />
          </div>
          <FadeReveal className="max-w-md space-y-5 text-lead text-fg-muted">
            <p>{t('philosophyP1')}</p>
            <p>{t('philosophyP2')}</p>
          </FadeReveal>
          <ImageReveal className="relative hidden aspect-[5/4] w-3/4 self-end lg:block">
            <Image src={imageB.src} alt={imageB.alt} fill sizes="30vw" placeholder="blur" blurDataURL={imageB.blur} className="object-cover" />
          </ImageReveal>
          <FadeReveal>
            <ButtonLink href="/about" variant="link" transition="ivory">{t('philosophyCta')}</ButtonLink>
          </FadeReveal>
        </div>
      </div>
    </Section>
  );
}
