'use client';

import { useEffect, useRef, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Product3D } from '@/components/three/Product3D';
import { Button, ExternalButtonLink } from '@/components/ui/Button';
import { CheckIcon, MinusIcon, PlusIcon, ReturnIcon, TruckIcon, WhatsAppIcon } from '@/components/ui/Icon';
import { Price } from '@/components/ui/Price';
import type { ProductView } from '@/lib/card-data';
import { cn } from '@/lib/cn';
import { useInView } from '@/lib/hooks';
import { customizeMessage, whatsappUrl } from '@/lib/whatsapp';
import type { Locale } from '@/i18n/routing';
import { ProductGallery } from './ProductGallery';
import { AddLabel, useAddedFlash } from './AddLabel';
import { useAddToBag } from './use-add-to-bag';
import { WishlistButton } from './WishlistButton';

/** Ficha: galería + panel de compra fijo (sticky) en escritorio, barra de compra fija en móvil. */
export function ProductDetail({ p }: { p: ProductView }) {
  const t = useTranslations('product');
  const locale = useLocale() as Locale;
  const addToBag = useAddToBag();
  const [added, flash] = useAddedFlash();
  const [index, setIndex] = useState(0);
  const [variantId, setVariantId] = useState((p.variants.find((v) => v.stock > 0) ?? p.variants[0]!).id);
  const [qty, setQty] = useState(1);
  const [view, setView] = useState<'photos' | '3d'>('photos');
  const gallery = useRef<HTMLDivElement>(null);
  const [ctaRef, ctaVisible] = useInView<HTMLDivElement>('0px');
  const variant = p.variants.find((v) => v.id === variantId)!;
  const soldOut = variant.stock <= 0;
  const low = !soldOut && variant.stock <= 3;
  const max = Math.min(10, variant.stock);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const pickVariant = (id: string) => {
    const v = p.variants.find((x) => x.id === id)!;
    setVariantId(id);
    setQty(1);
    setIndex(v.imageIndex);
    setView('photos');
  };

  const add = () => {
    addToBag({ productId: p.id, variantId, quantity: qty, name: p.name, imageSrc: p.images[variant.imageIndex]?.src ?? p.images[0]!.src, source: gallery.current });
    flash();
  };

  const img0 = p.images[0]!;

  return (
    <div className="container-x grid gap-10 lg:grid-cols-[1.25fr_1fr] lg:gap-16 xl:gap-24">
      <div>
        {p.model3d && (
          <div role="tablist" aria-label={t('viewMode')} className="mb-4 flex gap-2">
            {(['photos', '3d'] as const).map((m) => (
              <button key={m} role="tab" type="button" aria-selected={view === m} onClick={() => setView(m)} className={cn('label-micro border px-4 py-2.5 transition-colors', view === m ? 'border-accent bg-accent text-surface' : 'border-line-strong hover:border-fg')}>
                {m === 'photos' ? t('photos') : t('view3dTab')}
              </button>
            ))}
          </div>
        )}
        {view === '3d' && p.model3d ? (
          <Product3D model={p.model3d.model} posterSrc={img0.src} posterBlur={img0.blur} posterAlt={img0.alt} dials={p.model3d.dials} activeVariantId={variantId} />
        ) : (
          <ProductGallery ref={gallery} images={p.images} index={index} onIndexChange={setIndex} name={p.name} />
        )}
      </div>

      <div className="lg:sticky lg:top-[calc(var(--header-h)+var(--announcement-h)+1rem)] lg:self-start">
        <p className="label-micro text-accent">{p.categoryLabel}{p.collection ? `, ${p.collection.name}` : ''}</p>
        <h1 className="mt-4 font-display text-display-m">{p.name}</h1>
        <div className="mt-5 flex items-baseline gap-4">
          <Price cents={p.price} className="font-display text-heading" />
          {p.badge && p.badge !== 'soldOut' && <span className="label-micro border border-line-strong px-2.5 py-1">{t(`badge.${p.badge}`)}</span>}
        </div>
        <p className="mt-6 text-fg-muted">{p.description}</p>

        {p.variants.length > 1 && (
          <fieldset className="mt-8">
            <legend className="label-micro mb-3 text-fg-subtle">{p.sized ? t('size') : t('option')}: <span className="text-fg">{variant.label}</span></legend>
            <div className="flex flex-wrap gap-2">
              {p.variants.map((v) => (
                <label key={v.id} className={cn('label-micro cursor-pointer border px-4 py-3 transition-colors has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2', p.sized && 'grid min-w-14 place-items-center', v.id === variantId ? 'border-accent bg-accent text-surface' : 'border-line-strong hover:border-fg', v.stock <= 0 && 'opacity-40 line-through')}>
                  <input type="radio" name="variant" value={v.id} checked={v.id === variantId} onChange={() => pickVariant(v.id)} className="sr-only" />
                  {v.label}
                </label>
              ))}
            </div>
          </fieldset>
        )}

        <p className={cn('mt-6 flex items-center gap-2 text-caption', soldOut ? 'text-danger' : low ? 'text-forest' : 'text-success')} role="status">
          <CheckIcon width={16} height={16} />
          {soldOut ? t('soldOut') : low ? t('lowStock', { count: variant.stock }) : t('inStock')}
        </p>

        <div ref={ctaRef} className="mt-6 flex flex-wrap items-stretch gap-3">
          <div className="flex items-center border border-line-strong" role="group" aria-label={t('quantity')}>
            <button type="button" onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label={t('decrease')} className="grid h-14 w-12 place-items-center hover:bg-fg/5"><MinusIcon width={16} height={16} /></button>
            <output className="tabular min-w-8 text-center" aria-live="polite">{qty}</output>
            <button type="button" onClick={() => setQty((q) => Math.min(max, q + 1))} disabled={qty >= max} aria-label={t('increase')} className="grid h-14 w-12 place-items-center hover:bg-fg/5 disabled:opacity-30"><PlusIcon width={16} height={16} /></button>
          </div>
          <Button size="lg" className="min-w-0 flex-1" disabled={soldOut} onClick={add}>
            {/* En pantallas estrechas «Añadir a la bolsa» no cabe junto a cantidad y favoritos: versión corta. */}
            {soldOut ? t('soldOut') : <AddLabel added={added} idle={<><span className="sm:hidden">{t('addShort')}</span><span className="hidden sm:inline">{t('addToBag')}</span></>} done={t('added')} />}
          </Button>
          <WishlistButton productId={p.id} name={p.name} className="h-14 w-14 border border-line-strong" />
        </div>

        {p.customizable && (
          <section aria-labelledby="custom-title" className="mt-8 border border-line-strong p-5">
            <h2 id="custom-title" className="font-display text-lead">{t('customTitle')}</h2>
            <p className="mt-2 text-caption text-fg-muted">{t('customText')}</p>
            <ExternalButtonLink href={whatsappUrl(customizeMessage(p.name, p.sized ? variant.label : undefined, locale))} variant="outline" className="mt-4 w-full gap-2 sm:w-auto">
              <WhatsAppIcon width={18} height={18} />{t('customCta')}
            </ExternalButtonLink>
            <p className="mt-3 text-caption text-fg-subtle">{t('customHint')}</p>
          </section>
        )}

        <ul className="mt-8 space-y-3 border-t border-line pt-6 text-caption text-fg-muted">
          <li className="flex items-start gap-3"><TruckIcon width={20} height={20} className="mt-0.5 shrink-0" />{t('shippingNote')}</li>
          <li className="flex items-start gap-3"><ReturnIcon width={20} height={20} className="mt-0.5 shrink-0" />{t('paymentNote')}</li>
        </ul>

        {p.highlights.length > 0 && (
          <details className="group mt-6 border-t border-line pt-4" open>
            <summary className="label-micro flex min-h-11 cursor-pointer list-none items-center justify-between">{t('highlights')}<PlusIcon width={16} height={16} className="transition-transform group-open:rotate-45" /></summary>
            <ul className="mt-3 space-y-2 text-fg-muted">
              {p.highlights.map((h) => <li key={h} className="flex gap-3"><span aria-hidden="true" className="mt-2.5 h-1 w-1 shrink-0 rounded-full bg-accent-decor" />{h}</li>)}
            </ul>
          </details>
        )}
      </div>

      {/* Barra de compra fija (móvil): aparece cuando el botón principal sale de pantalla */}
      {mounted && (
        <div aria-hidden={ctaVisible} className={cn('fixed inset-x-0 bottom-0 z-30 flex items-center gap-4 border-t border-line bg-surface/95 px-[var(--gutter)] py-3 backdrop-blur-md transition-transform duration-500 ease-[var(--ease-expo)] lg:hidden', ctaVisible ? 'translate-y-full' : 'translate-y-0')} inert={ctaVisible}>
          <div className="min-w-0 flex-1">
            <p className="truncate font-display text-lead leading-tight">{p.name}</p>
            <Price cents={p.price} className="text-caption text-fg-muted" />
          </div>
          <Button disabled={soldOut} onClick={add}>{soldOut ? t('soldOut') : <AddLabel added={added} idle={t('addToBag')} done={t('added')} />}</Button>
        </div>
      )}
    </div>
  );
}
