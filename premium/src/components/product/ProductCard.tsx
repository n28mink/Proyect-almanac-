'use client';

import Image from 'next/image';
import { useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { TransitionLink } from '@/components/motion/TransitionLink';
import { EyeIcon, PlusIcon } from '@/components/ui/Icon';
import { Price } from '@/components/ui/Price';
import { cn } from '@/lib/cn';
import type { CardData, CardImage } from '@/lib/card-data';
import { QuickView } from './QuickView';
import { AddLabel, useAddedFlash } from './AddLabel';
import { useAddToBag } from './use-add-to-bag';
import { WishlistButton } from './WishlistButton';

const focalStyle = (img: CardImage) => (img.focal ? { objectPosition: `${Math.round(img.focal.x * 100)}% ${Math.round(img.focal.y * 100)}%` } : undefined);

/** Vídeo corto al hover: se monta en el primer hover/foco (preload none), suena mudo, y se pausa al salir. */
function HoverVideo({ video, active }: { video: NonNullable<CardData['hoverVideo']>; active: boolean }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [ready, setReady] = useState(false);
  const src = video.sources.desktop;
  return (
    <video
      ref={(el) => {
        ref.current = el;
        if (el) {
          if (active) void el.play().catch(() => undefined);
          else el.pause();
        }
      }}
      muted
      loop
      playsInline
      preload="none"
      aria-hidden="true"
      tabIndex={-1}
      onPlaying={() => setReady(true)}
      className={cn('absolute inset-0 h-full w-full object-cover transition-opacity duration-500', ready && active ? 'opacity-100' : 'opacity-0')}
    >
      {src.map((s) => (
        <source key={s.src} src={s.src} type={s.type} />
      ))}
    </video>
  );
}

interface ProductCardProps {
  p: CardData;
  /** Solo para lo que aparece sobre el pliegue (LCP). */
  priority?: boolean;
  sizes?: string;
  layout?: 'grid' | 'list';
  className?: string;
}

export function ProductCard({ p, priority = false, sizes = '(min-width: 1280px) 25vw, (min-width: 768px) 33vw, 50vw', layout = 'grid', className }: ProductCardProps) {
  const t = useTranslations('product');
  const media = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState(false);
  const [everHovered, setEverHovered] = useState(false);
  const [quick, setQuick] = useState(false);
  const addToBag = useAddToBag();
  const [added, flash] = useAddedFlash();
  const single = p.variants.length === 1;
  const soldOut = !p.inStock;

  const badgeText = p.badge ? t(`badge.${p.badge}`) : null;

  return (
    <article
      className={cn('product-card group relative', layout === 'list' && 'grid grid-cols-[minmax(0,9rem)_1fr] items-center gap-6 sm:grid-cols-[14rem_1fr]', className)}
      onPointerEnter={(e) => {
        if (e.pointerType !== 'mouse') return;
        setHovered(true);
        setEverHovered(true);
      }}
      onPointerLeave={() => setHovered(false)}
      onFocus={() => setEverHovered(true)}
    >
      <div className="relative">
        <TransitionLink href={`/product/${p.slug}`} variant="clip" aria-label={`${p.name}, ${p.categoryLabel}`} className="block">
          <div ref={media} className="card-media relative aspect-[4/5] overflow-hidden bg-surface-sunken">
            <Image
              data-base-layer=""
              src={p.image.src}
              alt={p.image.alt}
              fill
              sizes={sizes}
              priority={priority}
              placeholder={p.image.blur ? 'blur' : 'empty'}
              blurDataURL={p.image.blur}
              className="object-cover"
              style={focalStyle(p.image)}
            />
            {p.hoverImage && !p.hoverVideo && (
              <Image data-hover-layer="" src={p.hoverImage.src} alt="" fill sizes={sizes} className="object-cover" style={focalStyle(p.hoverImage)} aria-hidden="true" />
            )}
            {p.hoverVideo && everHovered && <HoverVideo video={p.hoverVideo} active={hovered} />}
            {badgeText && (
              <span className={cn('label-micro absolute left-3 top-3 px-2.5 py-1.5', p.badge === 'soldOut' ? 'bg-ink text-ivory' : 'bg-ivory/90 text-ink backdrop-blur-sm')}>{badgeText}</span>
            )}
          </div>
        </TransitionLink>

        <WishlistButton productId={p.id} name={p.name} className="absolute right-1 top-1 z-10" />

        {layout === 'grid' && (
          <div className="card-actions absolute inset-x-3 bottom-3 z-10 hidden gap-2 md:flex">
            <button
              type="button"
              disabled={soldOut}
              onClick={() => {
                if (!single) return setQuick(true);
                addToBag({ productId: p.id, variantId: p.defaultVariantId, name: p.name, imageSrc: p.image.src, source: media.current });
                flash();
              }}
              className="label-micro flex h-11 flex-1 items-center justify-center gap-2 bg-ivory/95 text-ink backdrop-blur-sm transition-[background-color,color,scale] duration-200 ease-[var(--ease-out)] hover:bg-ink hover:text-ivory active:scale-[0.97] disabled:opacity-50"
            >
              {single ? (
                <AddLabel added={added} idle={<><PlusIcon width={16} height={16} />{t('quickAdd')}</>} done={t('added')} />
              ) : (
                <><PlusIcon width={16} height={16} />{t('chooseOption')}</>
              )}
            </button>
            <button type="button" onClick={() => setQuick(true)} aria-label={t('quickViewLabel', { name: p.name })} className="grid h-11 w-11 place-items-center bg-ivory/95 text-ink backdrop-blur-sm transition-colors hover:bg-ink hover:text-ivory">
              <EyeIcon width={18} height={18} />
            </button>
          </div>
        )}
      </div>

      <div className={cn('pt-4', layout === 'list' && 'pt-0')}>
        <p className="text-caption text-fg-subtle">{p.categoryLabel}</p>
        <h3 className="mt-1.5 min-h-[2.6em] font-display text-[1.3rem] leading-[1.2]">
          <TransitionLink href={`/product/${p.slug}`} variant="clip" className="hover:text-accent">{p.name}</TransitionLink>
        </h3>
        <Price cents={p.price} className="mt-1 block text-caption text-fg-muted" />
        {layout === 'list' && <p className="mt-3 hidden max-w-prose text-fg-muted sm:block">{p.description}</p>}
        {layout === 'grid' && (
          <button type="button" disabled={soldOut} onClick={() => (single ? addToBag({ productId: p.id, variantId: p.defaultVariantId, name: p.name, imageSrc: p.image.src, source: media.current }) : setQuick(true))} className="label-micro link-underline hit-area mt-3 w-fit md:hidden">
            {single ? t('quickAdd') : t('chooseOption')}
          </button>
        )}
      </div>

      {quick && <QuickView p={p} open={quick} onClose={() => setQuick(false)} />}
    </article>
  );
}
