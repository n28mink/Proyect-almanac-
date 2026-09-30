import type { Metadata } from 'next';
import { hasLocale } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { PageShell } from '@/components/ui/PageShell';
import { getLegal, legalDocs } from '@/content/legal';
import { pick } from '@/domain/i18n';
import { routing } from '@/i18n/routing';
import { formatDate } from '@/lib/format';
import { buildMetadata } from '@/lib/seo';

export function generateStaticParams() {
  return routing.locales.flatMap((locale) => legalDocs.map((d) => ({ locale, slug: d.slug })));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }): Promise<Metadata> {
  const { locale, slug } = await params;
  const doc = getLegal(slug);
  if (!hasLocale(routing.locales, locale) || !doc) return {};
  return buildMetadata({ locale, path: `/legal/${slug}`, title: pick(doc.title, locale), description: pick(doc.sections[0]!.text, locale) });
}

export default async function LegalPage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  const doc = getLegal(slug);
  if (!doc) notFound();
  setRequestLocale(locale);
  const t = await getTranslations('legal');
  return (
    <PageShell eyebrow={t('updated', { date: formatDate(doc.updated, locale) })} title={pick(doc.title, locale)} narrow>
      <div className="max-w-2xl space-y-10">
        {doc.sections.map((s) => (
          <section key={s.heading.en}><h2 className="font-display text-heading">{pick(s.heading, locale)}</h2><p className="mt-3 text-fg-muted">{pick(s.text, locale)}</p></section>
        ))}
      </div>
    </PageShell>
  );
}
