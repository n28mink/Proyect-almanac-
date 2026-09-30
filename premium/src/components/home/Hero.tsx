import { getTranslations } from 'next-intl/server';
import { LuxuryVideo } from '@/components/media/LuxuryVideo';
import { MagneticButton } from '@/components/motion/MagneticButton';
import { StaggerText } from '@/components/motion/Reveal';
import { ButtonLink } from '@/components/ui/Button';
import type { VideoAsset } from '@/content/media';
import type { CampaignBlock } from '@/content/campaigns';
import { pick } from '@/domain/i18n';
import type { Locale } from '@/i18n/routing';

/**
 * Hero cinematográfico: el vídeo de campaña ocupa toda la pantalla. El poster es el LCP (sin bloquear FCP);
 * el <video> se monta al quedar el hilo libre. Texto editorial con entrada CSS pura (no depende de hidratar).
 */
export async function Hero({ campaign, video, locale }: { campaign: CampaignBlock; video: VideoAsset | null; locale: Locale }) {
  const t = await getTranslations('home');
  return (
    <section data-header-tone="light" data-tone="ink" className="relative isolate min-h-[100svh] overflow-hidden bg-surface text-fg">
      {video && (
        <div className="intro-fade absolute inset-0 -z-10">
          <LuxuryVideo video={video} priority fit="cover" aspectRatio="auto" className="h-full w-full" />
        </div>
      )}
      <div aria-hidden="true" className="absolute inset-0 -z-[5] bg-gradient-to-t from-ink/80 via-ink/25 to-ink/55" />

      <div className="container-x flex min-h-[100svh] flex-col justify-end pb-16 pt-40 md:pb-24">
        <p className="label-micro intro-rise mb-6 text-champagne" style={{ ['--i' as string]: 0 }}>{pick(campaign.eyebrow, locale)}</p>
        <h1 className="font-display text-display-xl max-w-[14ch]">
          <StaggerText text={pick(campaign.title, locale)} intro />
        </h1>
        <p className="intro-rise mt-8 max-w-md text-lead text-fg/90" style={{ ['--i' as string]: 5 }}>{pick(campaign.text, locale)}</p>
        <div className="intro-rise mt-10 flex flex-wrap items-center gap-4" style={{ ['--i' as string]: 6 }}>
          <MagneticButton>
            <ButtonLink href={campaign.cta.href} size="lg" transition="curtain" className="!border-ivory !bg-ivory !text-ink hover:!bg-transparent hover:!text-ivory">
              {pick(campaign.cta.label, locale)}
            </ButtonLink>
          </MagneticButton>
          <ButtonLink href="/lookbook" variant="link" transition="ivory" className="!text-ivory">
            {t('heroSecondary')}
          </ButtonLink>
        </div>
        <p aria-hidden="true" className="label-micro intro-fade absolute bottom-6 right-[var(--gutter)] hidden text-fg/70 md:block" style={{ ['--i' as string]: 8 }}>
          {t('scroll')}
        </p>
      </div>
    </section>
  );
}
