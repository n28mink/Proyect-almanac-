'use client';

import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { reveal } from '@/config/motion';
import { useMotionReducedByUser } from './motion-pref';

function mediaQueryStore(query: string) {
  return {
    subscribe(cb: () => void) {
      const mq = window.matchMedia(query);
      mq.addEventListener('change', cb);
      return () => mq.removeEventListener('change', cb);
    },
    get: () => window.matchMedia(query).matches,
  };
}

export function useMediaQuery(query: string, serverValue = false): boolean {
  const store = mediaQueryStore(query);
  return useSyncExternalStore(store.subscribe, store.get, () => serverValue);
}

/** Movimiento reducido: por preferencia del sistema o por el interruptor del pie de página. */
export function usePrefersReducedMotion(): boolean {
  const system = useMediaQuery('(prefers-reduced-motion: reduce)');
  const user = useMotionReducedByUser();
  return system || user;
}
/** Dispositivo con puntero preciso y hover real (ratón/trackpad). */
export const useFinePointer = () => useMediaQuery('(hover: hover) and (pointer: fine)');
export const useIsDesktop = () => useMediaQuery('(min-width: 1024px)');

/** Marca `data-in` la primera vez que el elemento entra en pantalla. Sin JS el contenido ya es visible (ver motion.css). */
export function useRevealOnce<T extends HTMLElement>(options?: { rootMargin?: string; threshold?: number }) {
  const ref = useRef<T>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === 'undefined') {
      el.setAttribute('data-in', '');
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.setAttribute('data-in', '');
            io.unobserve(entry.target);
          }
        }
      },
      { rootMargin: options?.rootMargin ?? reveal.rootMargin, threshold: options?.threshold ?? reveal.threshold },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [options?.rootMargin, options?.threshold]);
  return ref;
}

/** true mientras el elemento está (aunque sea parcialmente) en viewport. */
export function useInView<T extends HTMLElement>(rootMargin = '200px 0px') {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(([entry]) => setInView(!!entry?.isIntersecting), { rootMargin });
    io.observe(el);
    return () => io.disconnect();
  }, [rootMargin]);
  return [ref, inView] as const;
}
