import { getTranslations } from 'next-intl/server';
import { NewsletterForm } from '@/components/layout/NewsletterForm';
import { KineticMarquee } from '@/components/motion/KineticMarquee';
import { StaggerText } from '@/components/motion/Reveal';
import { Eyebrow, Section } from '@/components/ui/Section';

export async function NewsletterBand() {
  const t = await getTranslations('newsletter');
  const words = [t('marquee1'), t('marquee2'), t('marquee3')];
  return (
    <Section tone="ink" headerTone="light" className="overflow-hidden !pb-0">
      <div className="container-x text-center">
        <Eyebrow className="mb-6">{t('eyebrow')}</Eyebrow>
        <StaggerText as="h2" text={t('title')} className="font-display text-display-l mx-auto max-w-3xl" />
        <p className="mx-auto mt-6 max-w-lg text-lead text-fg-muted">{t('text')}</p>
        <div className="mx-auto mt-10 flex justify-center">
          <NewsletterForm />
        </div>
      </div>
      <KineticMarquee items={words.map((w) => <span key={w} data-decorative className="font-display text-display-xl whitespace-nowrap text-fg/10">{w}</span>)} className="mt-20 select-none" duration={46} />
    </Section>
  );
}
