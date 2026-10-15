import { getTranslations } from 'next-intl/server';
import { FadeReveal, StaggerText } from '@/components/motion/Reveal';
import { ButtonLink } from '@/components/ui/Button';
import { Section } from '@/components/ui/Section';

/** Presentación de la casa: dónde nace Clover y cómo trabaja. Sin cifras ni fechas que no podamos sostener. */
export async function HouseStory() {
  const t = await getTranslations('home.house');
  return (
    <Section className="py-20 md:py-28 lg:py-32">
      <div className="container-x">
        <div className="flex items-center gap-5">
          <span aria-hidden="true" className="h-px w-14 bg-accent-decor" />
          <p className="text-caption font-medium text-fg-muted">{t('place')}</p>
        </div>
        <div className="mt-10 grid gap-10 lg:mt-14 lg:grid-cols-[1.25fr_1fr] lg:gap-24">
          <StaggerText as="h2" text={t('title')} className="font-display text-display-l max-w-[16ch]" />
          <div className="lg:pt-3">
            <FadeReveal><p className="text-lead text-fg">{t('p1')}</p></FadeReveal>
            <FadeReveal delay={120}><p className="mt-5 max-w-prose text-fg-muted">{t('p2')}</p></FadeReveal>
            <FadeReveal delay={200} className="mt-9">
              <ButtonLink href="/about" variant="outline" transition="ivory">{t('cta')}</ButtonLink>
            </FadeReveal>
          </div>
        </div>
      </div>
    </Section>
  );
}
