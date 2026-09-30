import type { Metadata, Viewport } from 'next';
import { hasLocale, NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';
import { CartDrawer } from '@/components/cart/CartDrawer';
import { Footer } from '@/components/layout/Footer';
import { Header } from '@/components/layout/Header';
import { MenuOverlay } from '@/components/layout/MenuOverlay';
import { getNavData } from '@/components/layout/nav-data';
import { Providers } from '@/components/layout/Providers';
import { SearchOverlay } from '@/components/layout/SearchOverlay';
import { JsonLd } from '@/components/seo/JsonLd';
import { pick } from '@/domain/i18n';
import { routing } from '@/i18n/routing';
import { defaultCampaigns } from '@/content/campaigns';
import { organizationJsonLd, websiteJsonLd } from '@/lib/seo';
import { displayFont, sansFont } from '../fonts';
import '@/styles/globals.css';

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [{ color: '#f6f1e9' }],
};

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations({ locale, namespace: 'seo' });
  return {
    title: { default: t('title'), template: `%s | Clover` },
    description: t('description'),
    applicationName: 'Clover',
    icons: { icon: '/icon.svg' },
  };
}

/** Namespaces que necesita el cliente (admin y legal se quedan en el servidor). */
const CLIENT_NAMESPACES = ['common', 'header', 'search', 'cart', 'video', 'newsletter', 'product', 'shop', 'checkout', 'auth', 'account', 'wishlist'];

export default async function LocaleLayout({ children, params }: { children: ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const all = (await getMessages()) as Record<string, unknown>;
  const messages = Object.fromEntries(CLIENT_NAMESPACES.filter((ns) => ns in all).map((ns) => [ns, all[ns]]));
  const t = await getTranslations('common');
  const nav = getNavData(locale);
  const announcements = defaultCampaigns.announcements.map((a) => pick(a, locale));

  return (
    <html lang={locale} className={`${displayFont.variable} ${sansFont.variable}`} suppressHydrationWarning>
      <body>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <Providers>
            <a href="#main" className="sr-only-focusable fixed left-4 top-4 z-[120] bg-ink px-5 py-3 text-ivory">{t('skip')}</a>
            <Header announcements={announcements} primary={nav.primary} />
            <main id="main" tabIndex={-1} className="outline-none">
              {children}
            </main>
            <Footer nav={nav} />
            <CartDrawer />
            <MenuOverlay nav={nav} />
            <SearchOverlay suggestions={[...nav.menuTypes, ...nav.menuAudience]} />
          </Providers>
        </NextIntlClientProvider>
        <JsonLd data={organizationJsonLd(locale)} />
        <JsonLd data={websiteJsonLd(locale)} />
      </body>
    </html>
  );
}
