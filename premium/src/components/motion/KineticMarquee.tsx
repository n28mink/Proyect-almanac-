'use client';

import { useRef, type ReactNode } from 'react';
import { gsap, ScrollTrigger, useGSAP } from '@/lib/gsap';
import { usePrefersReducedMotion } from '@/lib/hooks';
import { cn } from '@/lib/cn';

interface KineticMarqueeProps {
  items: ReactNode[];
  /** Segundos por vuelta completa. */
  duration?: number;
  className?: string;
  itemClassName?: string;
  separator?: ReactNode;
}

/**
 * Marquesina cinética: bucle infinito con GSAP que reacciona a la velocidad y dirección del scroll,
 * y se pausa fuera de pantalla. Con reduced-motion se queda estática.
 */
export function KineticMarquee({ items, duration = 38, className, itemClassName, separator = <span aria-hidden="true">✦</span> }: KineticMarqueeProps) {
  const root = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const reduced = usePrefersReducedMotion();

  useGSAP(
    () => {
      if (reduced || !track.current || !root.current) return;
      const loop = gsap.to(track.current, { xPercent: -50, duration, ease: 'none', repeat: -1 });
      let dir = 1;
      const st = ScrollTrigger.create({
        trigger: root.current,
        start: 'top bottom',
        end: 'bottom top',
        onToggle: (self) => (self.isActive ? loop.play() : loop.pause()),
        onUpdate: (self) => {
          const v = self.getVelocity();
          if (Math.abs(v) < 30) return;
          dir = v > 0 ? 1 : -1;
          gsap.to(loop, { timeScale: dir * (1 + Math.min(Math.abs(v) / 500, 4)), duration: 0.25, overwrite: true });
          gsap.to(loop, { timeScale: dir, duration: 0.9, delay: 0.25 });
        },
      });
      return () => {
        st.kill();
        loop.kill();
      };
    },
    { scope: root, dependencies: [reduced, duration] },
  );

  const row = (key: string, hidden = false) => (
    <div key={key} className="flex shrink-0 items-center" aria-hidden={hidden || undefined}>
      {items.map((item, i) => (
        <span key={i} className={cn('flex items-center gap-8 pr-8', itemClassName)}>
          {item}
          {separator}
        </span>
      ))}
    </div>
  );

  return (
    <div ref={root} className={cn('overflow-hidden', className)}>
      <div ref={track} className="marquee-track">
        {row('a')}
        {row('b', true)}
      </div>
    </div>
  );
}
