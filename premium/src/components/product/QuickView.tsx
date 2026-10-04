'use client';

import Image from 'next/image';
import { useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { TransitionLink } from '@/components/motion/TransitionLink';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { CloseIcon } from '@/components/ui/Icon';
import { Price } from '@/components/ui/Price';
import { cn } from '@/lib/cn';
import type { CardData } from '@/lib/card-data';
import { useAddToBag } from './use-add-to-bag';
import { WishlistButton } from './WishlistButton';

export function QuickView({ p, open, onClose }: { p: CardData; open: boolean; onClose: () => void }) {
  const t = useTranslations('product');
  const [variantId, setVariantId] = useState(p.defaultVariantId);
  const media = useRef<HTMLDivElement>(null);
  const addToBag = useAddToBag();
  const variant = p.variants.find((v) => v.id === variantId) ?? p.variants[0]!;
  const soldOut = variant.stock <= 0;

  return (
    <Dialog open={open} onClose={onClose} side="center" label={t('quickViewLabel', { name: p.name })} lazyContent>
      <div className="grid max-h-[92dvh] overflow-y-auto md:grid-cols-2" data-lenis-prevent="">
        <div ref={media} className="relative aspect-[4/5] bg-surface-sunken md:aspect-auto md:min-h-[34rem]">
          <Image src={variant.imageSrc} alt={p.image.alt} fill sizes="(min-width: 768px) 34rem, 100vw" className="object-cover" placeholder={p.image.blur ? 'blur' : 'empty'} blurDataURL={p.image.blur} />
        </div>
        <div className="relative flex flex-col p-6 md:p-10">
          <button type="button" onClick={onClose} aria-label={t('close')} className="absolute right-3 top-3 grid h-11 w-11 place-items-center transition-[opacity,scale] duration-150 ease-[var(--ease-out)] hover:opacity-70 active:scale-90">
            <CloseIcon />
          </button>
          <p className="label-micro text-accent">{p.categoryLabel}</p>
          <h2 className="mt-3 pr-10 font-display text-display-m">{p.name}</h2>
          <Price cents={p.price} className="mt-3 text-lead" />
          <p className="mt-5 text-fg-muted">{p.description}</p>

          {p.variants.length > 1 && (
            <fieldset className="mt-6">
              <legend className="label-micro mb-3 text-fg-subtle">{p.sized ? t('size') : t('option')}</legend>
              <div className="flex flex-wrap gap-2">
                {p.variants.map((v) => (
                  <label key={v.id} className={cn('label-micro cursor-pointer border px-4 py-3 transition-colors has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2', p.sized && 'grid min-w-14 place-items-center', v.id === variantId ? 'border-accent bg-accent text-surface' : 'border-line-strong hover:border-fg', v.stock <= 0 && 'opacity-40')}>
                    <input type="radio" name={`qv-${p.id}`} value={v.id} checked={v.id === variantId} onChange={() => setVariantId(v.id)} className="sr-only" />
                    {v.label}
                  </label>
                ))}
              </div>
            </fieldset>
          )}

          <div className="mt-auto flex flex-wrap items-center gap-3 pt-8">
            <Button
              size="lg"
              className="flex-1"
              disabled={soldOut}
              onClick={() => {
                addToBag({ productId: p.id, variantId, name: p.name, imageSrc: variant.imageSrc, source: media.current });
                onClose();
              }}
            >
              {soldOut ? t('soldOut') : t('addToBag')}
            </Button>
            <WishlistButton productId={p.id} name={p.name} className="border border-line-strong" />
          </div>
          <TransitionLink href={`/product/${p.slug}`} onClick={onClose} className="label-micro link-underline mt-6 w-fit">
            {t('fullDetails')}
          </TransitionLink>
        </div>
      </div>
    </Dialog>
  );
}
