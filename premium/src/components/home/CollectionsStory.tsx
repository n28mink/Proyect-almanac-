'use client';

import Image from 'next/image';
import { useRef } from 'react';
import { TransitionLink } from '@/components/motion/TransitionLink';
import { gsap, useGSAP } from '@/lib/gsap';
import { useIsDesktop, useMotionLevel } from '@/lib/hooks';
import { ArrowLeftIcon, ArrowRightIcon } from '@/components/ui/Icon';
import { cn } from '@/lib/cn';

export interface CollectionTile {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  image: { src: string; blur?: string };
  /** Texto ya localizado, p. ej. "14 piezas". */
  piecesLabel: string;
  tone: 'light' | 'ink' | 'evergreen';
}

/**
 * Storytelling de colecciones. En escritorio: sección fijada con scroll horizontal sutil (ScrollTrigger + pin).
 * En móvil/tablet o con reduced-motion: carril con snap nativo (sin secuestrar el scroll).
 */
export function CollectionsStory({ tiles, title, allLabel, prevLabel, nextLabel }: { tiles: CollectionTile[]; title: string; allLabel: string; prevLabel: string; nextLabel: string }) {
  const root = useRef<HTMLElement>(null);
  const track = useRef<HTMLUListElement>(null);
  const desktop = useIsDesktop();
  const level = useMotionLevel();
  // El scroll fijado es una acción de la persona (lo mueve su rueda), así que sobrevive a la preferencia del sistema; solo el interruptor del pie lo apaga.
  const pinned = desktop && level !== 'off';
  // Sin scroll fijado (interruptor del pie), en escritorio la fila se recorre con flechas.
  const arrows = desktop && !pinned;
  const slide = (dir: 1 | -1) => {
    const el = track.current;
    if (el) el.scrollBy({ left: dir * Math.round(el.clientWidth * 0.7), behavior: level === 'full' ? 'smooth' : 'auto' });
  };

  useGSAP(
    () => {
      if (!pinned || !track.current || !root.current) return;
      const distance = () => Math.max(0, track.current!.scrollWidth - window.innerWidth + 160);
      gsap.fromTo('[data-story-progress]', { scaleX: 0 }, { scaleX: 1, ease: 'none', scrollTrigger: { trigger: root.current, start: 'top top', end: () => `+=${distance()}`, scrub: true, invalidateOnRefresh: true } });
      gsap.to(track.current, {
        x: () => -distance(),
        ease: 'none',
        scrollTrigger: { trigger: root.current, start: 'top top', end: () => `+=${distance()}`, pin: true, scrub: true, invalidateOnRefresh: true, anticipatePin: 1 },
      });
    },
    { scope: root, dependencies: [pinned, tiles.length] },
  );

  return (
    <section ref={root} data-tone="ink" data-header-tone="light" className="relative overflow-hidden bg-surface py-20 text-fg lg:py-24 lg:pt-[calc(var(--header-h)+1rem)]">
      <div className="container-x mb-10 flex flex-wrap items-end justify-between gap-4 lg:mb-14">
        <div>
          <h2 className="font-display text-display-l">{title}</h2>
        </div>
        <div className="flex items-center gap-6">
          {arrows && (
            <div className="flex gap-2">
              {([[-1, prevLabel, ArrowLeftIcon], [1, nextLabel, ArrowRightIcon]] as const).map(([dir, label, Icon]) => (
                <button key={dir} type="button" onClick={() => slide(dir)} aria-label={label} className="grid h-11 w-11 place-items-center rounded-full border border-line transition-[background-color,color,scale] duration-150 ease-[var(--ease-out)] hover:bg-fg hover:text-surface active:scale-95">
                  <Icon width={18} height={18} />
                </button>
              ))}
            </div>
          )}
          <TransitionLink href="/collections" className="label-micro link-underline">{allLabel}</TransitionLink>
        </div>
      </div>

      {pinned && (
        <div aria-hidden="true" className="container-x mb-8">
          <div className="h-px w-full bg-line"><div data-story-progress="" className="h-px origin-left scale-x-0 bg-accent-decor" /></div>
        </div>
      )}
      <ul ref={track} className={cn(pinned ? 'flex w-max gap-8 px-[var(--gutter)]' : 'snap-row')}>
        {tiles.map((c) => (
          <li key={c.slug} className={cn(pinned ? 'w-[22rem] shrink-0 xl:w-[26rem]' : 'w-[64vw] max-w-[24rem] sm:w-[44vw]')}>
            <TransitionLink href={`/collections/${c.slug}`} variant="mask" className="group block">
              <div className="relative aspect-[4/5] overflow-hidden bg-surface-sunken">
                <Image src={c.image.src} alt="" fill sizes="(min-width: 1280px) 26rem, 80vw" placeholder="blur" blurDataURL={c.image.blur} className="object-cover transition-transform duration-500 ease-[var(--ease-expo)] group-hover:scale-[1.04]" />
              </div>
              <div className="mt-5 flex items-end justify-between gap-6">
                <div>
                  <h3 className="font-display text-display-m leading-none">{c.name}</h3>
                  <p className="mt-2 text-fg-muted">{c.tagline}</p>
                </div>
                <span className="label-micro whitespace-nowrap text-fg-subtle">{c.piecesLabel}</span>
              </div>
            </TransitionLink>
          </li>
        ))}
      </ul>
    </section>
  );
}
