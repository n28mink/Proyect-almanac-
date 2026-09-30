import { getTranslations } from 'next-intl/server';
import { LuxuryVideo } from '@/components/media/LuxuryVideo';
import { FadeReveal, StaggerText } from '@/components/motion/Reveal';
import { Product3D } from '@/components/three/Product3D';
import { ButtonLink } from '@/components/ui/Button';
import { Eyebrow, Section } from '@/components/ui/Section';
import type { CampaignBlock } from '@/content/campaigns';
import type { VideoAsset } from '@/content/media';
import type { Product } from '@/domain/catalog';
import { pick } from '@/domain/i18n';
import type { Locale } from '@/i18n/routing';
import { FINISH_COLORS } from '@/components/three/finish-colors';

/** Campaña de relojes: vídeo + visor 3D interactivo bajo demanda (con fallback 2D). */
export async function WatchShowcase({ campaign, video, watch, locale }: { campaign: CampaignBlock; video: VideoAsset | null; watch: Product; locale: Locale }) {
  const t = await getTranslations('home');
  const model = watch.model3d;
  const img = watch.images[0]!;
  const dials = model
    ? model.dials.map((d) => {
        const v = watch.variants.find((x) => x.id === d.variantId)!;
        return { variantId: d.variantId, label: pick(v.options.color, locale), color: d.color };
      })
    : [];

  return (
    <Section tone="ink" headerTone="light">
      <div className="container-x grid items-center gap-14 lg:grid-cols-[1fr_1.1fr] lg:gap-20">
        <div>
          <Eyebrow className="mb-6">{pick(campaign.eyebrow, locale)}</Eyebrow>
          <StaggerText as="h2" text={pick(campaign.title, locale)} className="font-display text-display-l" />
          <FadeReveal delay={150}>
            <p className="mt-8 max-w-md text-lead text-fg-muted">{pick(campaign.text, locale)}</p>
            <p className="mt-6 max-w-md text-caption text-fg-subtle">{t('watchNote', { finish: FINISH_COLORS[model?.defaultFinish ?? 'yellow-gold'].label[locale] })}</p>
            <div className="mt-10 flex flex-wrap gap-4">
              <ButtonLink href={campaign.cta.href} transition="curtain" className="!border-ivory !bg-ivory !text-ink hover:!bg-transparent hover:!text-ivory">{pick(campaign.cta.label, locale)}</ButtonLink>
              <ButtonLink href={`/product/${watch.slug}`} variant="link" transition="clip" className="!text-ivory">{t('watchCta')}</ButtonLink>
            </div>
          </FadeReveal>
          {video && (
            <FadeReveal delay={250} className="mt-14 hidden max-w-md lg:block">
              <LuxuryVideo video={video} className="w-full" aspectRatio="16 / 10" showToggle={false} />
            </FadeReveal>
          )}
        </div>

        {model && (
          <FadeReveal variant="scale">
            <Product3D model={model} posterSrc={img.src} posterBlur={img.blur} posterAlt={pick(img.alt, locale)} dials={dials} />
          </FadeReveal>
        )}
      </div>
    </Section>
  );
}
