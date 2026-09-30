import type { Metadata } from 'next';
import Image from 'next/image';
import { hasLocale } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { TransitionLink } from '@/components/motion/TransitionLink';
import { JsonLd } from '@/components/seo/JsonLd';
import { PageShell } from '@/components/ui/PageShell';
import { getJournalEntry, journal } from '@/content/journal';
import { site } from '@/config/site';
import { pick } from '@/domain/i18n';
import { routing } from '@/i18n/routing';
import { formatDate } from '@/lib/format';
import { buildMetadata } from '@/lib/seo';
import { baseCatalog } from '@/server/repositories/catalog';

export function generateStaticParams() {
  return routing.locales.flatMap((locale) => journal.map((j) => ({ locale, slug: j.slug })));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }): Promise<Metadata> {
  const { locale, slug } = await params;
  const e = getJournalEntry(slug);
  if (!hasLocale(routing.locales, locale) || !e) return {};
  const cover = baseCatalog().find((p) => p.id === e.coverProductId)!.images[0]!;
  return buildMetadata({ locale, path: `/journal/${slug}`, title: pick(e.title, locale), description: pick(e.excerpt, locale), image: cover.src, type: 'article' });
}

export default async function JournalEntryPage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  const e = getJournalEntry(slug);
  if (!e) notFound();
  setRequestLocale(locale);
  const t = await getTranslations('journal');
  const cover = baseCatalog().find((p) => p.id === e.coverProductId)!.images[0]!;

  return (
    <PageShell eyebrow={`${formatDate(e.date, locale)} · ${t('read', { count: e.readMinutes })}`} title={pick(e.title, locale)} narrow>
      <JsonLd data={{ '@context': 'https://schema.org', '@type': 'Article', headline: pick(e.title, locale), datePublished: e.date, image: `${site.url}${cover.src}`, inLanguage: locale, author: { '@type': 'Organization', name: site.name } }} />
      <div className="relative mb-12 aspect-[16/10] overflow-hidden bg-surface-sunken"><Image src={cover.src} alt="" fill sizes="(min-width: 1024px) 56rem, 100vw" priority placeholder="blur" blurDataURL={cover.blur} className="object-cover" /></div>
      <article className="max-w-2xl space-y-8 text-lead text-fg-muted">
        {e.body.map((b, i) => (
          <section key={i}>{b.heading && <h2 className="mb-3 font-display text-heading text-fg">{pick(b.heading, locale)}</h2>}<p>{pick(b.text, locale)}</p></section>
        ))}
      </article>
      <TransitionLink href="/journal" variant="direction" direction={-1} className="label-micro link-underline mt-14 inline-block">{t('back')}</TransitionLink>
    </PageShell>
  );
}
