'use client';

import { useRef, type ReactNode } from 'react';
import { gsap, useGSAP } from '@/lib/gsap';
import { usePrefersReducedMotion } from '@/lib/hooks';
import { cn } from '@/lib/cn';

interface ParallaxMediaProps {
  children: ReactNode;
  /** Recorrido en % de la altura (por lado). 6–12 es sutil. */
  amount?: number;
  className?: string;
  innerClassName?: string;
}

/**
 * Parallax con scrub de ScrollTrigger. El contenedor recorta; el interior es `amount`% más alto y se desplaza.
 * Solo transform (GPU). Sin efecto con reduced-motion.
 */
export function ParallaxMedia({ children, amount = 8, className, innerClassName }: ParallaxMediaProps) {
  const root = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  const reduced = usePrefersReducedMotion();

  useGSAP(
    () => {
      if (reduced || !inner.current) return;
      gsap.fromTo(
        inner.current,
        { yPercent: -amount },
        { yPercent: amount, ease: 'none', scrollTrigger: { trigger: root.current, start: 'top bottom', end: 'bottom top', scrub: true } },
      );
    },
    { scope: root, dependencies: [reduced, amount] },
  );

  return (
    <div ref={root} className={cn('relative overflow-hidden', className)}>
      <div ref={inner} className={cn('absolute inset-x-0 will-change-transform', innerClassName)} style={{ top: `-${amount}%`, bottom: `-${amount}%` }}>
        {children}
      </div>
    </div>
  );
}
