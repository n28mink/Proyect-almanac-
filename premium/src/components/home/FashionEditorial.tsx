import { LuxuryVideo } from '@/components/media/LuxuryVideo';
import { FadeReveal, ImageReveal, StaggerText } from '@/components/motion/Reveal';
import { ButtonLink } from '@/components/ui/Button';
import { Eyebrow, Section } from '@/components/ui/Section';
import type { CampaignBlock } from '@/content/campaigns';
import type { VideoAsset } from '@/content/media';
import { pick } from '@/domain/i18n';
import type { Locale } from '@/i18n/routing';

/** Vídeo editorial de moda: recorte vertical junto a un texto breve. */
export function FashionEditorial({ campaign, video, locale }: { campaign: CampaignBlock; video: VideoAsset | null; locale: Locale }) {
  return (
    <Section headerTone="dark">
      <div className="container-x grid items-center gap-12 lg:grid-cols-[1fr_1.1fr] lg:gap-24">
        <div className="order-2 lg:order-1">
          <Eyebrow className="mb-6">{pick(campaign.eyebrow, locale)}</Eyebrow>
          <StaggerText as="h2" text={pick(campaign.title, locale)} className="font-display text-display-l" />
          <FadeReveal delay={150}>
            <p className="mt-8 max-w-md text-lead text-fg-muted">{pick(campaign.text, locale)}</p>
            <div className="mt-10"><ButtonLink href={campaign.cta.href} variant="outline" transition="mask">{pick(campaign.cta.label, locale)}</ButtonLink></div>
          </FadeReveal>
        </div>
        {video && (
          <ImageReveal className="order-1 mx-auto w-full max-w-xl lg:order-2 lg:max-w-none">
            <LuxuryVideo video={video} aspectRatio="4 / 5" fit="cover" className="w-full" />
          </ImageReveal>
        )}
      </div>
    </Section>
  );
}
