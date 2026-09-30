import type { Metadata } from 'next';
import Image from 'next/image';
import { hasLocale } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { FadeReveal } from '@/components/motion/Reveal';
import { TransitionLink } from '@/components/motion/TransitionLink';
import { PageShell } from '@/components/ui/PageShell';
import { journal } from '@/content/journal';
import { pick } from '@/domain/i18n';
import { routing } from '@/i18n/routing';
import { formatDate } from '@/lib/format';
import { buildMetadata } from '@/lib/seo';
import { baseCatalog } from '@/server/repositories/catalog';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations({ locale, namespace: 'journal' });
  return buildMetadata({ locale, path: '/journal', title: t('title'), description: t('text') });
}

export default async function JournalIndex({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations('journal');
  const catalog = baseCatalog();
  return (
    <PageShell eyebrow={t('eyebrow')} title={t('title')} text={t('text')}>
      <ul className="grid gap-x-8 gap-y-16 md:grid-cols-3">
        {journal.map((e, i) => {
          const img = catalog.find((p) => p.id === e.coverProductId)!.images[0]!;
          return (
            <FadeReveal as="li" key={e.slug} delay={i * 100}>
              <TransitionLink href={`/journal/${e.slug}`} variant="ivory" className="group block">
                <div className="relative aspect-[4/5] overflow-hidden bg-surface-sunken"><Image src={img.src} alt="" fill sizes="(min-width: 768px) 30vw, 100vw" placeholder="blur" blurDataURL={img.blur} className="object-cover transition-transform duration-[1600ms] ease-[var(--ease-expo)] group-hover:scale-[1.04]" /></div>
                <p className="label-micro mt-5 text-fg-subtle">{formatDate(e.date, locale)} · {t('read', { count: e.readMinutes })}</p>
                <h2 className="mt-2 font-display text-heading group-hover:text-accent">{pick(e.title, locale)}</h2>
                <p className="mt-2 text-fg-muted">{pick(e.excerpt, locale)}</p>
              </TransitionLink>
            </FadeReveal>
          );
        })}
      </ul>
    </PageShell>
  );
}
