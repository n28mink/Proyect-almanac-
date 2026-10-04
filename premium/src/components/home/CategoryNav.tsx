import Image from 'next/image';
import { getTranslations } from 'next-intl/server';
import { FadeReveal } from '@/components/motion/Reveal';
import { TransitionLink } from '@/components/motion/TransitionLink';
import { Section, SectionHeading } from '@/components/ui/Section';
import { categories } from '@/config/taxonomy';
import { pick } from '@/domain/i18n';
import type { Locale } from '@/i18n/routing';
import { baseCatalog } from '@/server/repositories/catalog';

const HOME_CATEGORIES = ['earrings', 'necklaces', 'rings', 'bracelets', 'watches', 'shirts'];

/** Navegación por categoría: lienzos verticales; fila con snap en móvil, rejilla en escritorio. */
export async function CategoryNav({ locale }: { locale: Locale }) {
  const t = await getTranslations('home');
  const catalog = baseCatalog();
  const items = HOME_CATEGORIES.map((slug) => categories.find((c) => c.slug === slug)!)
    .map((c) => ({ c, product: catalog.find((p) => p.id === c.coverProductId)!, count: catalog.filter((p) => p.categories.includes(c.slug)).length }));

  return (
    <Section headerTone="dark" className="!pb-0">
      <div className="container-x mb-12 flex flex-wrap items-end justify-between gap-6">
        <SectionHeading title={t('categoriesTitle')} size="m" />
        <TransitionLink href="/shop" className="label-micro link-underline">{t('viewAll')}</TransitionLink>
      </div>
      <ul className="snap-row lg:container-x lg:grid lg:grid-cols-6 lg:gap-4 lg:overflow-visible lg:px-[var(--gutter)]">
        {items.map(({ c, product, count }, i) => {
          const img = product.images[0]!;
          return (
            <li key={c.slug} className="w-[62vw] max-w-[20rem] sm:w-[36vw] lg:w-auto lg:max-w-none">
              <FadeReveal delay={i * 70}>
                <TransitionLink href={`/shop/${c.slug}`} variant="mask" className="group block">
                  <div className="relative aspect-[3/4] overflow-hidden bg-surface-sunken">
                    <Image src={img.src} alt="" fill sizes="(min-width: 1024px) 16vw, 62vw" placeholder="blur" blurDataURL={img.blur} className="object-cover transition-transform duration-500 ease-[var(--ease-expo)] group-hover:scale-[1.05]" style={img.focal ? { objectPosition: `${img.focal.x * 100}% ${img.focal.y * 100}%` } : undefined} />
                    <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-ink/55 via-transparent to-transparent" />
                    <div className="absolute inset-x-4 bottom-4 flex items-end justify-between text-ivory">
                      <span className="font-display text-[1.55rem] leading-none">{pick(c.name, locale)}</span>
                      <span className="label-micro opacity-80">{count}</span>
                    </div>
                  </div>
                </TransitionLink>
              </FadeReveal>
            </li>
          );
        })}
      </ul>
    </Section>
  );
}
