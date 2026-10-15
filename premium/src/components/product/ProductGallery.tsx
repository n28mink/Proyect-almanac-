'use client';

import Image from 'next/image';
import { forwardRef, useCallback, useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { CloseIcon, ArrowLeftIcon, ArrowRightIcon } from '@/components/ui/Icon';
import { Dialog } from '@/components/ui/Dialog';
import type { CardImage } from '@/lib/card-data';
import type { Spin } from '@/domain/catalog';
import { Spin360 } from './Spin360';
import { cn } from '@/lib/cn';
import { useFinePointer } from '@/lib/hooks';

interface GalleryProps {
  images: CardImage[];
  index: number;
  onIndexChange: (i: number) => void;
  name: string;
  /** Giro 360°: diapositiva extra al final (índice = images.length). */
  spin?: Spin;
}

const focal = (i: CardImage) => (i.focal ? { objectPosition: `${i.focal.x * 100}% ${i.focal.y * 100}%` } : undefined);

/**
 * Galería de ficha: en escritorio miniaturas + zoom con puntero + lightbox; en móvil, carrusel táctil con snap.
 * La imagen activa la controla el padre (cambiar de variante mueve la galería).
 */
export const ProductGallery = forwardRef<HTMLDivElement, GalleryProps>(function ProductGallery({ images, index, onIndexChange, name, spin }, ref) {
  const t = useTranslations('product');
  const fine = useFinePointer();
  const [zoom, setZoom] = useState<{ x: number; y: number } | null>(null);
  const [box, setBox] = useState(false);
  const scroller = useRef<HTMLUListElement>(null);
  const total = images.length + (spin ? 1 : 0);
  const onSpin = !!spin && index === images.length;
  const lit = images[Math.min(index, images.length - 1)]!; // la diapositiva 360° no abre el lightbox

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
        {spin && (
          <li>
            <button type="button" onClick={() => goTo(images.length)} aria-label={t('showSpin')} aria-current={onSpin} className={cn('relative grid aspect-[4/5] w-full place-items-center overflow-hidden border text-sm font-medium transition-colors', onSpin ? 'border-fg' : 'border-transparent opacity-70 hover:opacity-100')} style={{ backgroundColor: spin.tone }}>
              <Image src={spin.frames[0]!} alt="" fill sizes="88px" className="object-contain opacity-60" />
              <span className="relative rounded-full bg-ink/70 px-2 py-0.5 text-ivory">360°</span>
            </button>
          </li>
        )}
      </ul>

      <div className="order-1 lg:order-2">
        {/* Escritorio: imagen activa con zoom */}
        <div
          className={cn('relative hidden aspect-[4/5] overflow-hidden bg-surface-sunken lg:block', fine && !onSpin ? 'cursor-zoom-in' : '')}
          onPointerMove={(e) => {
            if (!fine) return;
            const r = e.currentTarget.getBoundingClientRect();
            setZoom({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 });
          }}
          onPointerLeave={() => setZoom(null)}
          onClick={() => !onSpin && setBox(true)}
          role={onSpin ? undefined : 'button'}
          tabIndex={onSpin ? -1 : 0}
          aria-label={onSpin ? undefined : t('openLightbox')}
          onKeyDown={(e) => !onSpin && (e.key === 'Enter' || e.key === ' ') && setBox(true)}
        >
          {images.map((img, i) => (
            <Image
              key={img.src}
              src={img.src}
              alt={i === index ? img.alt : ''}
              fill
              sizes="(min-width: 1280px) 46vw, 50vw"
              quality={90}
              priority={i === 0}
              placeholder={img.blur ? 'blur' : 'empty'}
              blurDataURL={img.blur}
              className={cn('object-cover transition-opacity duration-500', i === index ? 'opacity-100' : 'opacity-0')}
              style={{ ...focal(img), transform: zoom && i === index ? 'scale(1.5)' : undefined, transformOrigin: zoom ? `${zoom.x}% ${zoom.y}%` : undefined, transition: 'opacity .5s, transform .35s var(--ease-luxe)' }}
              aria-hidden={i !== index}
            />
          ))}
          {spin && (
            <div className={cn('absolute inset-0 transition-opacity duration-500', onSpin ? 'opacity-100' : 'pointer-events-none opacity-0')} aria-hidden={!onSpin}>
              <Spin360 spin={spin} name={name} active={onSpin} />
            </div>
          )}
        </div>

        {/* Móvil/tablet: carrusel con snap */}
        <div className="relative lg:hidden">
          <ul ref={scroller} className="flex snap-x snap-mandatory overflow-x-auto scrollbar-none" aria-label={t('gallery')}>
            {images.map((img, i) => (
              <li key={img.src} className="relative aspect-[4/5] w-full shrink-0 snap-center bg-surface-sunken">
                <Image src={img.src} alt={img.alt} fill sizes="100vw" quality={90} priority={i === 0} placeholder={img.blur ? 'blur' : 'empty'} blurDataURL={img.blur} className="object-cover" style={focal(img)} onClick={() => setBox(true)} />
              </li>
            ))}
            {spin && (
              <li className="relative aspect-[4/5] w-full shrink-0 snap-center">
                <Spin360 spin={spin} name={name} active={onSpin} />
              </li>
            )}
          </ul>
          <div className="pointer-events-none absolute inset-x-0 bottom-4 flex justify-center gap-2" aria-hidden="true">
            {Array.from({ length: total }, (_, i) => (
              <span key={i} className={cn('h-1.5 rounded-full bg-ivory/90 shadow transition-all duration-300', i === index ? 'w-6' : 'w-1.5 opacity-60')} />
            ))}
          </div>
        </div>
      </div>

      <Dialog open={box} onClose={() => setBox(false)} side="full" label={t('lightboxLabel', { name })} lazyContent>
        <div data-tone="ink" className="relative grid h-full place-items-center bg-surface">
          <div className="relative h-full w-full">
            <Image src={lit.src} alt={lit.alt} fill sizes="100vw" quality={90} className="object-contain" />
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
