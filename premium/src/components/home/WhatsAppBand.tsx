import { getLocale, getTranslations } from 'next-intl/server';
import { KineticMarquee } from '@/components/motion/KineticMarquee';
import { StaggerText } from '@/components/motion/Reveal';
import { ExternalButtonLink } from '@/components/ui/Button';
import { Eyebrow, Section } from '@/components/ui/Section';
import type { Locale } from '@/i18n/routing';
import { greeting, whatsappDisplay, whatsappUrl } from '@/lib/whatsapp';

/** Cierre de la home: en lugar de captar correos, invita a escribir por WhatsApp (canal real de venta de Clover). */
export async function WhatsAppBand() {
  const t = await getTranslations('contact');
  const locale = (await getLocale()) as Locale;
  const words = [t('marquee1'), t('marquee2'), t('marquee3')];
  return (
    <Section tone="evergreen" headerTone="light" className="overflow-hidden !pb-0">
      <div className="container-x text-center">
        <Eyebrow className="mb-6">{t('eyebrow')}</Eyebrow>
        <StaggerText as="h2" text={t('title')} className="font-display text-display-l mx-auto max-w-3xl" />
        <p className="mx-auto mt-6 max-w-lg text-lead text-fg-muted">{t('text')}</p>
        <div className="mt-10 flex flex-col items-center gap-3">
          <ExternalButtonLink href={whatsappUrl(greeting(locale))} size="lg">{t('cta')}</ExternalButtonLink>
          <p className="text-caption text-fg-subtle">{whatsappDisplay}</p>
        </div>
      </div>
      <KineticMarquee items={words.map((w) => <span key={w} data-decorative className="font-display text-display-xl whitespace-nowrap text-fg/10">{w}</span>)} className="mt-20 select-none" duration={46} />
    </Section>
  );
}
