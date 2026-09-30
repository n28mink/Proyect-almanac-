import { getTranslations } from 'next-intl/server';
import { FadeReveal } from '@/components/motion/Reveal';
import { TransitionLink } from '@/components/motion/TransitionLink';
import { ProductCard } from '@/components/product/ProductCard';
import { Section, SectionHeading } from '@/components/ui/Section';
import type { CardData } from '@/lib/card-data';

/** Carril horizontal de producto (snap táctil, sin scroll-hijack). Para novedades. */
export async function ProductRail({ products, eyebrow, title, href }: { products: CardData[]; eyebrow: string; title: string; href: string }) {
  const t = await getTranslations('home');
  return (
    <Section headerTone="dark" className="!overflow-hidden">
      <div className="container-x mb-12 flex flex-wrap items-end justify-between gap-6">
        <SectionHeading eyebrow={eyebrow} title={title} size="m" />
        <TransitionLink href={href} className="label-micro link-underline">{t('viewAll')}</TransitionLink>
      </div>
      <ul className="snap-row" data-lenis-prevent-wheel="">
        {products.map((p, i) => (
          <li key={p.id} className="w-[64vw] max-w-[22rem] sm:w-[38vw] lg:w-[24vw]">
            <FadeReveal delay={i * 60}>
              <ProductCard p={p} sizes="(min-width: 1024px) 24vw, 64vw" />
            </FadeReveal>
          </li>
        ))}
      </ul>
    </Section>
  );
}
