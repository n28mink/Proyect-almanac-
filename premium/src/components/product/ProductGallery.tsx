'use client';

import Image from 'next/image';
import { forwardRef, useCallback, useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { CloseIcon, ArrowLeftIcon, ArrowRightIcon } from '@/components/ui/Icon';
import { Dialog } from '@/components/ui/Dialog';
import type { CardImage } from '@/lib/card-data';
import { cn } from '@/lib/cn';
import { useFinePointer } from '@/lib/hooks';

interface GalleryProps {
  images: CardImage[];
  index: number;
  onIndexChange: (i: number) => void;
  name: string;
}

const focal = (i: CardImage) => (i.focal ? { objectPosition: `${i.focal.x * 100}% ${i.focal.y * 100}%` } : undefined);

/**
 * Galería de ficha: en escritorio miniaturas + zoom con puntero + lightbox; en móvil, carrusel táctil con snap.
 * La imagen activa la controla el padre (cambiar de variante mueve la galería).
 */
export const ProductGallery = forwardRef<HTMLDivElement, GalleryProps>(function ProductGallery({ images, index, onIndexChange, name }, ref) {
  const t = useTranslations('product');
  const fine = useFinePointer();
  const [zoom, setZoom] = useState<{ x: number; y: number } | null>(null);
  const [box, setBox] = useState(false);
  const scroller = useRef<HTMLUListElement>(null);

  // Móvil: sincroniza el índice con el scroll del carrusel.
  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    const onScroll = () => {
      const i = Math.round(el.scrollLeft / el.clientWidth);
      if (i !== index) onIndexChange(i);
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, [index, onIndexChange]);

  const goTo = useCallback((i: number) => {
    onIndexChange(i);
    const el = scroller.current;
    if (el && el.offsetParent) el.scrollTo({ left: i * el.clientWidth, behavior: 'smooth' });
  }, [onIndexChange]);

  return (
    <div ref={ref} className="grid gap-4 lg:grid-cols-[5.5rem_1fr]">
      {/* Miniaturas (escritorio) */}
      <ul className="order-2 hidden gap-3 lg:order-1 lg:flex lg:flex-col" aria-label={t('thumbnails')}>
        {images.map((img, i) => (
          <li key={img.src}>
            <button type="button" onClick={() => goTo(i)} aria-label={t('showImage', { n: i + 1 })} aria-current={i === index} className={cn('relative block aspect-[4/5] w-full overflow-hidden border transition-colors', i === index ? 'border-fg' : 'border-transparent opacity-70 hover:opacity-100')}>
              <Image src={img.src} alt="" fill sizes="88px" className="object-cover" style={focal(img)} />
            </button>
          </li>
        ))}
      </ul>

      <div className="order-1 lg:order-2">
        {/* Escritorio: imagen activa con zoom */}
        <div
          className={cn('relative hidden aspect-[4/5] overflow-hidden bg-surface-sunken lg:block', fine ? 'cursor-zoom-in' : '')}
          onPointerMove={(e) => {
            if (!fine) return;
            const r = e.currentTarget.getBoundingClientRect();
            setZoom({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 });
          }}
          onPointerLeave={() => setZoom(null)}
          onClick={() => setBox(true)}
          role="button"
          tabIndex={0}
          aria-label={t('openLightbox')}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setBox(true)}
        >
          {images.map((img, i) => (
            <Image
              key={img.src}
              src={img.src}
              alt={i === index ? img.alt : ''}
              fill
              sizes="(min-width: 1280px) 46vw, 50vw"
              priority={i === 0}
              placeholder={img.blur ? 'blur' : 'empty'}
              blurDataURL={img.blur}
              className={cn('object-cover transition-opacity duration-500', i === index ? 'opacity-100' : 'opacity-0')}
              style={{ ...focal(img), transform: zoom && i === index ? 'scale(1.9)' : undefined, transformOrigin: zoom ? `${zoom.x}% ${zoom.y}%` : undefined, transition: 'opacity .5s, transform .35s var(--ease-luxe)' }}
              aria-hidden={i !== index}
            />
          ))}
        </div>

        {/* Móvil/tablet: carrusel con snap */}
        <div className="relative lg:hidden">
          <ul ref={scroller} className="flex snap-x snap-mandatory overflow-x-auto scrollbar-none" aria-label={t('gallery')} data-lenis-prevent-wheel="">
            {images.map((img, i) => (
              <li key={img.src} className="relative aspect-[4/5] w-full shrink-0 snap-center bg-surface-sunken">
                <Image src={img.src} alt={img.alt} fill sizes="100vw" priority={i === 0} placeholder={img.blur ? 'blur' : 'empty'} blurDataURL={img.blur} className="object-cover" style={focal(img)} onClick={() => setBox(true)} />
              </li>
            ))}
          </ul>
          <div className="pointer-events-none absolute inset-x-0 bottom-4 flex justify-center gap-2" aria-hidden="true">
            {images.map((img, i) => (
              <span key={img.src} className={cn('h-1.5 rounded-full bg-ivory/90 shadow transition-all duration-300', i === index ? 'w-6' : 'w-1.5 opacity-60')} />
            ))}
          </div>
        </div>
      </div>

      <Dialog open={box} onClose={() => setBox(false)} side="full" label={t('lightboxLabel', { name })} lazyContent>
        <div data-tone="ink" className="relative grid h-full place-items-center bg-surface">
          <div className="relative h-full w-full">
            <Image src={images[index]!.src} alt={images[index]!.alt} fill sizes="100vw" className="object-contain" />
          </div>
          <button type="button" onClick={() => setBox(false)} aria-label={t('close')} className="absolute right-4 top-4 grid h-12 w-12 place-items-center bg-ink/60 text-ivory backdrop-blur-sm"><CloseIcon /></button>
          {images.length > 1 && (
            <>
              <button type="button" onClick={() => onIndexChange((index - 1 + images.length) % images.length)} aria-label={t('prevImage')} className="absolute left-4 top-1/2 grid h-12 w-12 -translate-y-1/2 place-items-center bg-ink/60 text-ivory backdrop-blur-sm"><ArrowLeftIcon /></button>
              <button type="button" onClick={() => onIndexChange((index + 1) % images.length)} aria-label={t('nextImage')} className="absolute right-4 top-1/2 grid h-12 w-12 -translate-y-1/2 place-items-center bg-ink/60 text-ivory backdrop-blur-sm"><ArrowRightIcon /></button>
            </>
          )}
        </div>
      </Dialog>
    </div>
  );
});
