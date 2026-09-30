import { getLocale, getTranslations } from 'next-intl/server';
import { StaggerText } from '@/components/motion/Reveal';
import { ExternalButtonLink } from '@/components/ui/Button';
import { Section } from '@/components/ui/Section';
import type { Locale } from '@/i18n/routing';
import { greeting, whatsappDisplay, whatsappUrl } from '@/lib/whatsapp';

/** Cierre de la home: en lugar de captar correos, invita a escribir por WhatsApp (canal real de venta de Clover). */
export async function WhatsAppBand() {
  const t = await getTranslations('contact');
  const locale = (await getLocale()) as Locale;
  return (
    <Section tone="evergreen" headerTone="light">
      <div className="container-x text-center">
        <StaggerText as="h2" text={t('title')} className="font-display text-display-l mx-auto max-w-3xl" />
        <p className="mx-auto mt-6 max-w-lg text-lead text-fg-muted">{t('text')}</p>
        <div className="mt-10 flex flex-col items-center gap-3">
          <ExternalButtonLink href={whatsappUrl(greeting(locale))} size="lg">{t('cta')}</ExternalButtonLink>
          <p className="text-caption text-fg-subtle">{whatsappDisplay}</p>
        </div>
      </div>
    </Section>
  );
}
