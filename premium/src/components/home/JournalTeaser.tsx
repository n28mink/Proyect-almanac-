import Image from 'next/image';
import { getTranslations } from 'next-intl/server';
import { FadeReveal } from '@/components/motion/Reveal';
import { TransitionLink } from '@/components/motion/TransitionLink';
import { Section, SectionHeading } from '@/components/ui/Section';
import type { JournalEntry } from '@/content/journal';
import { pick } from '@/domain/i18n';
import type { Locale } from '@/i18n/routing';
import { formatDate } from '@/lib/format';

export async function JournalTeaser({ entries, covers, locale }: { entries: JournalEntry[]; covers: Record<string, { src: string; blur?: string }>; locale: Locale }) {
  const t = await getTranslations('home');
  return (
    <Section headerTone="dark">
      <div className="container-x mb-14 flex flex-wrap items-end justify-between gap-6">
        <SectionHeading title={t('journalTitle')} size="m" />
        <TransitionLink href="/journal" className="label-micro link-underline">{t('journalCta')}</TransitionLink>
      </div>
      <ul className="container-x grid gap-12 md:grid-cols-3 md:gap-8">
        {entries.map((e, i) => (
          <FadeReveal as="li" key={e.slug} delay={i * 100}>
            <TransitionLink href={`/journal/${e.slug}`} variant="ivory" className="group block">
              <div className="relative aspect-[4/5] overflow-hidden bg-surface-sunken">
                <Image src={covers[e.slug]!.src} alt="" fill sizes="(min-width: 768px) 30vw, 100vw" placeholder="blur" blurDataURL={covers[e.slug]!.blur} className="object-cover transition-transform duration-500 ease-[var(--ease-expo)] group-hover:scale-[1.04]" />
              </div>
              <p className="label-micro mt-5 text-fg-subtle">{formatDate(e.date, locale)}, {t('readMinutes', { count: e.readMinutes })}</p>
              <h3 className="mt-2 font-display text-heading group-hover:text-accent">{pick(e.title, locale)}</h3>
              <p className="mt-2 text-fg-muted">{pick(e.excerpt, locale)}</p>
            </TransitionLink>
          </FadeReveal>
        ))}
      </ul>
    </Section>
  );
}
