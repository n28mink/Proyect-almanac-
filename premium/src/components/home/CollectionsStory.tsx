'use client';

import Image from 'next/image';
import { useRef } from 'react';
import { TransitionLink } from '@/components/motion/TransitionLink';
import { Eyebrow } from '@/components/ui/Section';
import { gsap, useGSAP } from '@/lib/gsap';
import { useIsDesktop, usePrefersReducedMotion } from '@/lib/hooks';
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
export function CollectionsStory({ tiles, title, eyebrow, allLabel }: { tiles: CollectionTile[]; title: string; eyebrow: string; allLabel: string }) {
  const root = useRef<HTMLElement>(null);
  const track = useRef<HTMLUListElement>(null);
  const desktop = useIsDesktop();
  const reduced = usePrefersReducedMotion();
  const pinned = desktop && !reduced;

  useGSAP(
    () => {
      if (!pinned || !track.current || !root.current) return;
      const distance = () => Math.max(0, track.current!.scrollWidth - window.innerWidth + 160);
      gsap.to(track.current, {
        x: () => -distance(),
        ease: 'none',
        scrollTrigger: { trigger: root.current, start: 'top top', end: () => `+=${distance()}`, pin: true, scrub: 0.8, invalidateOnRefresh: true, anticipatePin: 1 },
      });
    },
    { scope: root, dependencies: [pinned, tiles.length] },
  );

  return (
    <section ref={root} data-tone="ink" data-header-tone="light" className="relative overflow-hidden bg-surface py-20 text-fg lg:flex lg:min-h-[100svh] lg:flex-col lg:justify-center lg:py-0">
      <div className="container-x mb-10 flex flex-wrap items-end justify-between gap-4 lg:mb-14">
        <div>
          <Eyebrow className="mb-4">{eyebrow}</Eyebrow>
          <h2 className="font-display text-display-l">{title}</h2>
        </div>
        <TransitionLink href="/collections" className="label-micro link-underline">{allLabel}</TransitionLink>
      </div>

      <ul ref={track} className={cn(pinned ? 'flex w-max gap-8 px-[var(--gutter)]' : 'snap-row')}>
        {tiles.map((c, i) => (
          <li key={c.slug} className={cn(pinned ? 'w-[34rem] shrink-0 xl:w-[38rem]' : 'w-[78vw] max-w-[24rem] sm:w-[52vw]')}>
            <TransitionLink href={`/collections/${c.slug}`} variant="mask" className="group block">
              <div className="relative aspect-[4/5] overflow-hidden bg-surface-sunken">
                <Image src={c.image.src} alt="" fill sizes="(min-width: 1280px) 38rem, 80vw" placeholder="blur" blurDataURL={c.image.blur} className="object-cover transition-transform duration-[1600ms] ease-[var(--ease-expo)] group-hover:scale-[1.04]" />
                <span className="label-micro absolute left-5 top-5 text-ivory mix-blend-difference">{String(i + 1).padStart(2, '0')}</span>
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
