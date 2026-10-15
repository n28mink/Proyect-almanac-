import Image from 'next/image';
import { getTranslations } from 'next-intl/server';
import { LuxuryVideo } from '@/components/media/LuxuryVideo';
import { FadeReveal, ImageReveal, StaggerText } from '@/components/motion/Reveal';
import type { VideoAsset } from '@/content/media';
import type { ProductView } from '@/lib/card-data';

/** Storytelling de ficha: IMAGEN → DETALLE → MACRO → VÍDEO → RELATO → ESPECIFICACIONES. */
export async function ProductStory({ p, video }: { p: ProductView; video: VideoAsset | null }) {
  const t = await getTranslations('product');
  const macro = p.detailIndex >= 0 ? p.images[p.detailIndex]! : null;

  return (
    <>
      {/* PRIMER PLANO: foto contenida junto a un texto breve (a todo el ancho se ampliaba hasta no distinguir la pieza). */}
      {macro && (
        <section data-header-tone="dark" className="container-x mt-24 grid items-center gap-8 md:mt-32 lg:grid-cols-[minmax(0,34rem)_1fr] lg:gap-20">
          <ImageReveal className="relative aspect-square w-full max-w-[34rem] bg-surface-sunken">
            <Image src={macro.src} alt={macro.alt} fill sizes="(min-width: 1024px) 34rem, 92vw" quality={80} placeholder={macro.blur ? 'blur' : 'empty'} blurDataURL={macro.blur} className="object-cover" />
          </ImageReveal>
          <FadeReveal delay={120} className="max-w-md">
            <h2 className="font-display text-heading">{t('macroCaption')}</h2>
            <p className="mt-4 text-lead text-fg-muted">{p.description}</p>
          </FadeReveal>
        </section>
      )}

      {/* VÍDEO + RELATO */}
      <section data-header-tone="dark" className={video ? 'container-x mt-24 grid items-center gap-12 md:mt-32 lg:grid-cols-2 lg:gap-24' : 'container-x mt-24 max-w-4xl md:mt-32'}>
        {video && (
          <ImageReveal className="mx-auto w-full max-w-md lg:max-w-none">
            <LuxuryVideo video={video} aspectRatio="4 / 5" fit="cover" className="w-full" />
          </ImageReveal>
        )}
        <div>
          <StaggerText as="h2" text={p.name} className="font-display text-display-m" />
          <FadeReveal delay={120}><p className="mt-8 text-lead text-fg-muted">{p.story}</p></FadeReveal>
        </div>
      </section>

      {/* ESPECIFICACIONES */}
      <section data-header-tone="dark" className="container-x mt-24 md:mt-32">
        <div className="grid gap-10 border-t border-line pt-12 lg:grid-cols-[1fr_2fr]">
          <h2 className="font-display text-heading">{t('specs')}</h2>
          <dl className="grid gap-x-12 sm:grid-cols-2">
            {p.specifications.map((s) => (
              <div key={s.label} className="flex items-baseline justify-between gap-6 border-b border-line py-4">
                <dt className="label-micro text-fg-subtle">{s.label}</dt>
                <dd className="text-right">{s.value}</dd>
              </div>
            ))}
          </dl>
        </div>
        <div className="grid gap-10 border-t border-line pt-12 lg:mt-12 lg:grid-cols-[1fr_2fr]">
          <h2 className="font-display text-heading">{t('careShipping')}</h2>
          <div className="grid gap-8 text-fg-muted sm:grid-cols-2">
            <p>{t('shippingLong')}</p>
            <p>{t('payLong')}</p>
          </div>
        </div>
      </section>
    </>
  );
}
