'use client';

import { useRef, type ReactNode } from 'react';
import { gsap, useGSAP } from '@/lib/gsap';
import { useIsDesktop, useMotionLevel } from '@/lib/hooks';

/**
 * Entrada ligada al scroll (scrub): cada hijo marcado con `data-scrub-item` llega desde un lado, girado y algo más pequeño,
 * y se asienta en su sitio mientras la persona baja. No fija la pantalla: el scroll sigue su curso.
 * Distinta a la escena horizontal fijada de «Cinco historias». Solo escritorio; el interruptor del pie la apaga.
 */
export function ScrubIn({ children, as: Tag = 'div', className }: { children: ReactNode; as?: 'div' | 'ul'; className?: string }) {
  const root = useRef<HTMLElement>(null);
  const level = useMotionLevel();
  const desktop = useIsDesktop();

  useGSAP(
    () => {
      if (!desktop || level === 'off' || !root.current) return;
      const items = gsap.utils.toArray<HTMLElement>('[data-scrub-item]', root.current);
      items.forEach((el, i) => {
        const side = i % 2 === 0 ? -1 : 1;
        gsap.fromTo(
          el,
          { xPercent: side * 38, yPercent: 14 + (i % 3) * 8, rotate: side * 5, scale: 0.88 },
          { xPercent: 0, yPercent: 0, rotate: 0, scale: 1, ease: 'none', scrollTrigger: { trigger: el, start: 'top 105%', end: 'top 52%', scrub: true } },
        );
      });
    },
    { scope: root, dependencies: [desktop, level] },
  );

  return (
    <Tag ref={root as never} className={className}>
      {children}
    </Tag>
  );
}
