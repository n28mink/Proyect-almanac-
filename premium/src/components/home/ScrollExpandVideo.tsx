'use client';

import { useRef, type ReactNode } from 'react';
import { LuxuryVideo } from '@/components/media/LuxuryVideo';
import type { VideoAsset } from '@/content/media';
import { gsap, useGSAP } from '@/lib/gsap';
import { usePrefersReducedMotion } from '@/lib/hooks';
import { cn } from '@/lib/cn';

/**
 * Vídeo enmarcado que se expande a pantalla completa al hacer scroll (clip-path con scrub) — la única "escena"
 * de scroll cinematográfico del sitio. Sin JS o con reduced-motion se ve completo desde el principio.
 */
export function ScrollExpandVideo({ video, children, className, tone = 'ink' }: { video: VideoAsset; children?: ReactNode; className?: string; tone?: 'ink' | 'evergreen' }) {
  const root = useRef<HTMLElement>(null);
  const frame = useRef<HTMLDivElement>(null);
  const reduced = usePrefersReducedMotion();

  useGSAP(
    () => {
      if (reduced || !frame.current) return;
      gsap.fromTo(
        frame.current,
        { clipPath: 'inset(14% 10% 14% 10%)' },
        { clipPath: 'inset(0% 0% 0% 0%)', ease: 'none', scrollTrigger: { trigger: root.current, start: 'top 85%', end: 'top 15%', scrub: 0.6 } },
      );
      gsap.fromTo(
        '[data-expand-copy]',
        { yPercent: 14, autoAlpha: 0 },
        { yPercent: 0, autoAlpha: 1, ease: 'power2.out', scrollTrigger: { trigger: root.current, start: 'top 40%', end: 'top 5%', scrub: 0.6 } },
      );
    },
    { scope: root, dependencies: [reduced] },
  );

  return (
    <section ref={root} data-tone={tone} data-header-tone="light" className={cn('relative min-h-[80svh] overflow-hidden bg-surface text-fg md:min-h-[100svh]', className)}>
      <div ref={frame} className="absolute inset-0">
        <LuxuryVideo video={video} fit="cover" aspectRatio="auto" className="h-full w-full" />
        <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-ink/75 via-ink/20 to-ink/30" />
      </div>
      <div data-expand-copy="" className="container-x relative z-10 flex min-h-[80svh] flex-col justify-end pb-16 md:min-h-[100svh] md:pb-24">
        {children}
      </div>
    </section>
  );
}
