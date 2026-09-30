import { getTranslations } from 'next-intl/server';
import { LuxuryVideo } from '@/components/media/LuxuryVideo';
import { FadeReveal, StaggerText } from '@/components/motion/Reveal';
import { ParallaxMedia } from '@/components/motion/ParallaxMedia';
import { ButtonLink } from '@/components/ui/Button';
import { Eyebrow, Section } from '@/components/ui/Section';
import type { CampaignBlock } from '@/content/campaigns';
import type { VideoAsset } from '@/content/media';
import { pick } from '@/domain/i18n';
import type { Locale } from '@/i18n/routing';

/** "Cómo elegimos": selección, detalle y servicio — sin afirmar procesos de fabricación que Clover no realiza. */
export async function Craftsmanship({ campaign, video, locale }: { campaign: CampaignBlock; video: VideoAsset | null; locale: Locale }) {
  const t = await getTranslations('home');
  const pillars = ['selection', 'detail', 'service'] as const;
  return (
    <Section tone="evergreen" headerTone="light" className="relative overflow-hidden">
      {video && (
        <ParallaxMedia amount={6} className="pointer-events-none absolute inset-0 opacity-30" >
          <LuxuryVideo video={video} aspectRatio="auto" fit="cover" showToggle={false} className="h-full w-full" />
        </ParallaxMedia>
      )}
      <div aria-hidden="true" className="absolute inset-0 bg-evergreen/70" />
      <div className="container-x relative">
        <div className="max-w-3xl">
          <Eyebrow className="mb-6">{pick(campaign.eyebrow, locale)}</Eyebrow>
          <StaggerText as="h2" text={pick(campaign.title, locale)} className="font-display text-display-l" />
          <FadeReveal delay={150}><p className="mt-8 max-w-xl text-lead text-fg-muted">{pick(campaign.text, locale)}</p></FadeReveal>
        </div>
        <ol className="mt-16 grid gap-10 border-t border-line pt-10 md:grid-cols-3 md:gap-12 lg:mt-24">
          {pillars.map((p, i) => (
            <FadeReveal as="li" key={p} delay={i * 110}>
              <span className="label-micro text-accent">{String(i + 1).padStart(2, '0')}</span>
              <h3 className="mt-4 font-display text-heading">{t(`pillars.${p}.title`)}</h3>
              <p className="mt-3 text-fg-muted">{t(`pillars.${p}.text`)}</p>
            </FadeReveal>
          ))}
        </ol>
        <FadeReveal className="mt-14">
          <ButtonLink href={campaign.cta.href} variant="outline" transition="ivory">{pick(campaign.cta.label, locale)}</ButtonLink>
        </FadeReveal>
      </div>
    </Section>
  );
}
