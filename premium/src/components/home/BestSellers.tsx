import { getTranslations } from 'next-intl/server';
import { FadeReveal } from '@/components/motion/Reveal';
import { TransitionLink } from '@/components/motion/TransitionLink';
import { ProductCard } from '@/components/product/ProductCard';
import { Section, SectionHeading } from '@/components/ui/Section';
import type { CardData } from '@/lib/card-data';

export async function BestSellers({ products }: { products: CardData[] }) {
  const t = await getTranslations('home');
  return (
    <Section tone="sunken" headerTone="dark">
      <div className="container-x mb-14 flex flex-wrap items-end justify-between gap-6">
        <SectionHeading eyebrow={t('bestEyebrow')} title={t('bestTitle')} size="m" />
        <TransitionLink href="/shop?sort=featured" className="label-micro link-underline">{t('viewAll')}</TransitionLink>
      </div>
      <ul className="container-x grid grid-cols-2 gap-x-4 gap-y-12 lg:grid-cols-4 lg:gap-x-8">
        {products.slice(0, 8).map((p, i) => (
          <FadeReveal as="li" key={p.id} delay={(i % 4) * 80}>
            <ProductCard p={p} />
          </FadeReveal>
        ))}
      </ul>
    </Section>
  );
}
