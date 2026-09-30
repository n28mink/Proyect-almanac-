import { getLocale, getTranslations } from 'next-intl/server';
import { Logo } from '@/components/brand/Logo';
import { TransitionLink } from '@/components/motion/TransitionLink';
import type { Locale } from '@/i18n/routing';
import { site } from '@/config/site';
import { greeting, whatsappDisplay, whatsappUrl } from '@/lib/whatsapp';
import { LocaleSwitcher } from './Switchers';
import type { NavData } from './nav-data';

export async function Footer({ nav }: { nav: NavData }) {
  const t = await getTranslations('footer');
  const locale = (await getLocale()) as Locale;
  const col = 'space-y-3 text-caption';
  const head = 'label-micro mb-5 text-fg-subtle';
  const link = 'nav-link w-fit text-fg-muted hover:text-fg';
  const wa = whatsappUrl(greeting(locale));

  return (
    <footer data-tone="evergreen" className="bg-surface text-fg">
      <div className="container-x grid gap-12 py-16 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr] lg:py-24">
        <div className="max-w-sm">
          <Logo />
          <p className="mt-6 text-fg-muted">{t('about')}</p>
          <p className="mt-6 text-caption text-fg-subtle">
            {site.address.area}, {site.address.locality}, {site.address.region} · Venezuela
          </p>
        </div>

        <nav aria-label={t('shop')} className={col}>
          <h2 className={head}>{t('shop')}</h2>
          <ul className="space-y-3">
            {[...nav.menuMain, ...nav.menuTypes].map((l) => (
              <li key={l.href}><TransitionLink href={l.href} className={link}>{l.label}</TransitionLink></li>
            ))}
          </ul>
        </nav>

        <nav aria-label={t('house')} className={col}>
          <h2 className={head}>{t('house')}</h2>
          <ul className="space-y-3">
            <li><TransitionLink href="/about" className={link}>{t('story')}</TransitionLink></li>
            <li><TransitionLink href="/journal" className={link}>{t('journal')}</TransitionLink></li>
            <li><TransitionLink href="/lookbook" className={link}>{t('lookbook')}</TransitionLink></li>
          </ul>
        </nav>

        <nav aria-label={t('help')} className={col}>
          <h2 className={head}>{t('help')}</h2>
          <ul className="space-y-3">
            <li><a href={wa} target="_blank" rel="noopener noreferrer" className={link}>WhatsApp · {whatsappDisplay}</a></li>
            <li><TransitionLink href="/legal/shipping" className={link}>{t('shipping')}</TransitionLink></li>
            <li><TransitionLink href="/legal/privacy" className={link}>{t('privacy')}</TransitionLink></li>
            <li><TransitionLink href="/legal/terms" className={link}>{t('terms')}</TransitionLink></li>
            <li><TransitionLink href="/legal/cookies" className={link}>{t('cookies')}</TransitionLink></li>
          </ul>
        </nav>
      </div>

      <div className="container-x flex flex-col items-start justify-between gap-6 border-t border-line py-6 md:flex-row md:items-center">
        <p className="text-caption text-fg-subtle">© {new Date().getFullYear()} {site.legalName}. {t('rights')}</p>
        <div className="flex flex-wrap items-center gap-x-8 gap-y-2">
          <LocaleSwitcher />
        </div>
      </div>
      <p className="container-x pb-8 text-caption text-fg-subtle">{t('pricesNote')}</p>
    </footer>
  );
}
