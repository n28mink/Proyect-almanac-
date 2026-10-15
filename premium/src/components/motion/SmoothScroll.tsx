'use client';

import Lenis from 'lenis';
import { useEffect, useRef, type ReactNode } from 'react';
import { usePathname } from '@/i18n/navigation';
import { gsap, ScrollTrigger } from '@/lib/gsap';
import { smoothScroll } from '@/config/motion';
import { useFinePointer, useMotionLevel } from '@/lib/hooks';
import { useUi } from '@/stores/ui-store';

/**
 * Scroll suave con inercia (Lenis; ajustes en `smoothScroll`, src/config/motion.ts) sincronizado con ScrollTrigger mediante un único ticker de GSAP.
 * Solo para ratón y trackpad: no se crea en pantallas táctiles ni con «Reducir movimiento» (pie), y respeta prefers-reduced-motion. Los paneles modales lo detienen (y bloquean el scroll nativo por CSS).
 * Marca <html data-ready> al hidratar: desactiva la red de seguridad CSS de los reveals.
 */
export function SmoothScroll({ children }: { children: ReactNode }) {
  // Solo con puntero preciso (ratón/trackpad): en pantallas táctiles el scroll es el nativo del sistema.
  // Con «Reducir movimiento» del pie no se crea. Si es el sistema quien lo pide, Lenis lo respeta por su cuenta (`respectReducedMotion`) y la rueda va sin suavizado.
  const fine = useFinePointer();
  const level = useMotionLevel();
  const enabled = fine && level !== 'off';
  const pathname = usePathname();
  const lenisRef = useRef<Lenis | null>(null);
  const panel = useUi((s) => s.panel);

  useEffect(() => {
    document.documentElement.setAttribute('data-ready', '');
  }, []);

  useEffect(() => {
    if (!enabled) return;
    const lenis = new Lenis({ lerp: smoothScroll.lerp, wheelMultiplier: smoothScroll.wheelMultiplier, smoothWheel: true, syncTouch: false, anchors: true });
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
  }, [enabled]);

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
