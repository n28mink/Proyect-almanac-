'use client';

import Lenis from 'lenis';
import { useEffect, useRef, type ReactNode } from 'react';
import { usePathname } from '@/i18n/navigation';
import { gsap, ScrollTrigger } from '@/lib/gsap';
import { usePrefersReducedMotion } from '@/lib/hooks';
import { useUi } from '@/stores/ui-store';

/**
 * Scroll suave (Lenis) sincronizado con ScrollTrigger mediante un único ticker de GSAP.
 * Se desactiva con prefers-reduced-motion; los paneles modales lo detienen (y bloquean el scroll nativo por CSS).
 * Marca <html data-ready> al hidratar: desactiva la red de seguridad CSS de los reveals.
 */
export function SmoothScroll({ children }: { children: ReactNode }) {
  const reduced = usePrefersReducedMotion();
  const pathname = usePathname();
  const lenisRef = useRef<Lenis | null>(null);
  const panel = useUi((s) => s.panel);

  useEffect(() => {
    document.documentElement.setAttribute('data-ready', '');
  }, []);

  useEffect(() => {
    if (reduced) return;
    const lenis = new Lenis({ duration: 1.05, smoothWheel: true, syncTouch: false, anchors: true });
    lenisRef.current = lenis;
    lenis.on('scroll', ScrollTrigger.update);
    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
    return () => {
      gsap.ticker.remove(tick);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, [reduced]);

  useEffect(() => {
    const lenis = lenisRef.current;
    if (!lenis) return;
    if (panel) lenis.stop();
    else lenis.start();
  }, [panel]);

  useEffect(() => {
    lenisRef.current?.scrollTo(0, { immediate: true, force: true });
    const id = requestAnimationFrame(() => ScrollTrigger.refresh());
    return () => cancelAnimationFrame(id);
  }, [pathname]);

  return <>{children}</>;
}
