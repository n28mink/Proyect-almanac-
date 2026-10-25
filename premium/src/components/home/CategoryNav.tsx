import Image from 'next/image';
import { getTranslations } from 'next-intl/server';
import { FadeReveal } from '@/components/motion/Reveal';
import { ScrubIn } from '@/components/motion/ScrubIn';
import { TransitionLink } from '@/components/motion/TransitionLink';
import { ArrowRightIcon } from '@/components/ui/Icon';
import { Section, SectionHeading } from '@/components/ui/Section';
import { categories } from '@/config/taxonomy';
import { pick } from '@/domain/i18n';
import type { Locale } from '@/i18n/routing';
import { baseCatalog } from '@/server/repositories/catalog';

const HOME_CATEGORIES = ['earrings', 'necklaces', 'rings', 'bracelets', 'watches', 'sunglasses', 'shirts'];

/** Escritorio: 12 columnas en dos filas (5·4·3 y cuatro de 3); cada tile mantiene la misma altura. */
const SPANS = ['lg:col-span-5', 'lg:col-span-4', 'lg:col-span-3', 'lg:col-span-3', 'lg:col-span-3', 'lg:col-span-3', 'lg:col-span-3'];

/** Navegación por categoría: fila con snap en móvil; en escritorio, cuadrícula asimétrica con el nombre y una flecha sobre cada foto. */
export async function CategoryNav({ locale }: { locale: Locale }) {
  const t = await getTranslations('home');
  const catalog = baseCatalog();
  const items = HOME_CATEGORIES.map((slug) => categories.find((c) => c.slug === slug)!)
    .map((c) => ({ c, product: catalog.find((p) => p.id === c.coverProductId)!, count: catalog.filter((p) => p.categories.includes(c.slug)).length }));

  return (
    <Section headerTone="dark" className="overflow-x-clip !pb-0">
      <div className="container-x mb-12 flex flex-wrap items-end justify-between gap-6">
        <SectionHeading title={t('categoriesTitle')} size="m" />
        <TransitionLink href="/shop" className="label-micro link-underline">{t('viewAll')}</TransitionLink>
      </div>
      <ScrubIn as="ul" className="snap-row lg:container-x lg:grid lg:grid-cols-12 lg:gap-4 lg:overflow-visible lg:px-[var(--gutter)]">
        {items.map(({ c, product, count }, i) => {
          const img = product.images[0]!;
          return (
            <li key={c.slug} data-scrub-item="" className={`w-[62vw] max-w-[20rem] sm:w-[36vw] lg:w-auto lg:max-w-none ${SPANS[i]}`}>
              <FadeReveal delay={i * 70}>
                <TransitionLink href={`/shop/${c.slug}`} variant="mask" className="group block">
                  <div className="relative aspect-[3/4] overflow-hidden bg-surface-sunken lg:aspect-auto lg:h-[20rem]">
                    <Image src={img.src} alt="" fill sizes="(min-width: 1024px) 42vw, 62vw" placeholder="blur" blurDataURL={img.blur} className="object-cover transition-transform duration-500 ease-[var(--ease-expo)] group-hover:scale-[1.05]" style={img.focal ? { objectPosition: `${img.focal.x * 100}% ${img.focal.y * 100}%` } : undefined} />
                    <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-ink/75 via-ink/15 to-transparent" />
                    <div className="absolute inset-x-4 bottom-4 flex items-end justify-between gap-3 text-ivory">
                      <span>
                        <span className="block font-display text-[1.55rem] leading-none">{pick(c.name, locale)}</span>
                        <span className="mt-2 block text-caption opacity-90">{t('pieces', { count })}</span>
                      </span>
                      <span aria-hidden="true" className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-ivory/70 transition-[background-color,color,scale] duration-200 ease-[var(--ease-out)] group-hover:bg-ivory group-hover:text-forest group-active:scale-95">
                        <ArrowRightIcon width={20} height={20} className="-rotate-45" />
                      </span>
                    </div>
                  </div>
                </TransitionLink>
              </FadeReveal>
            </li>
          );
        })}
      </ScrubIn>
    </Section>
  );
}
