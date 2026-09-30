'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { usePrefersReducedMotion } from '@/lib/hooks';
import { useUi } from '@/stores/ui-store';

interface FlyApi {
  /** Registra el elemento del carrito de la cabecera (destino del vuelo). */
  registerAnchor: (el: HTMLElement | null) => void;
  /** Vuela una copia de `source` hasta el carrito, actualiza la insignia y anuncia el cambio. */
  fly: (source: HTMLElement | null, imageSrc?: string, label?: string) => void;
}

const Ctx = createContext<FlyApi | null>(null);

/**
 * Microinteracción "añadir al carrito": clon de la imagen que viaja al icono del carrito con un arco suave
 * (dos ejes con curvas distintas, solo transform), pulso de la insignia y anuncio aria-live.
 * Sin ids globales del DOM: el destino se registra por contexto. Con reduced-motion solo pulso + anuncio.
 */
export function FlyToCartProvider({ children }: { children: ReactNode }) {
  const anchor = useRef<HTMLElement | null>(null);
  const active = useRef<Set<() => void>>(new Set());
  const reduced = usePrefersReducedMotion();
  const announce = useUi((s) => s.announce);
  const t = useTranslations('cart');

  useEffect(() => {
    const running = active.current;
    return () => running.forEach((cancel) => cancel());
  }, []);

  const pulse = useCallback(() => {
    const badge = anchor.current?.querySelector<HTMLElement>('[data-cart-badge]');
    if (!badge) return;
    badge.classList.remove('badge-pop');
    void badge.offsetWidth;
    badge.classList.add('badge-pop');
    setTimeout(() => badge.classList.remove('badge-pop'), 600);
  }, []);

  const fly = useCallback(
    (source: HTMLElement | null, imageSrc?: string, label?: string) => {
      announce(label ?? t('added'));
      const target = anchor.current;
      if (reduced || !source || !target) {
        pulse();
        return;
      }
      const from = source.getBoundingClientRect();
      const to = target.getBoundingClientRect();
      const size = Math.min(88, Math.max(56, from.width * 0.5));
      const startX = from.left + from.width / 2 - size / 2;
      const startY = from.top + from.height / 2 - size / 2;
      const dx = to.left + to.width / 2 - size / 2 - startX;
      const dy = to.top + to.height / 2 - size / 2 - startY;

      const outer = document.createElement('div');
      const inner = document.createElement('div');
      Object.assign(outer.style, { position: 'fixed', left: `${startX}px`, top: `${startY}px`, width: `${size}px`, height: `${size}px`, zIndex: '95', pointerEvents: 'none', willChange: 'transform' });
      Object.assign(inner.style, {
        width: '100%', height: '100%', background: imageSrc ? `center / cover url("${imageSrc}")` : 'var(--color-champagne)',
        boxShadow: '0 12px 30px -8px rgb(21 20 18 / .35)', willChange: 'transform, opacity',
      });
      outer.setAttribute('aria-hidden', 'true');
      outer.append(inner);
      document.body.append(outer);

      const dur = 780;
      const ax = outer.animate([{ transform: 'translateX(0)' }, { transform: `translateX(${dx}px)` }], { duration: dur, easing: 'cubic-bezier(.55,0,.35,1)', fill: 'forwards' });
      const ay = outer.animate([{ transform: 'translateY(0)' }, { transform: `translateY(${dy}px)` }], { duration: dur, easing: 'cubic-bezier(.3,.1,.7,1)', fill: 'forwards', composite: 'add' });
      const ai = inner.animate([{ transform: 'scale(1)', opacity: 1 }, { transform: 'scale(.9)', opacity: 1, offset: 0.25 }, { transform: 'scale(.18)', opacity: 0.55 }], { duration: dur, easing: 'ease-in-out', fill: 'forwards' });

      const cleanup = () => {
        ax.cancel();
        ay.cancel();
        ai.cancel();
        outer.remove();
        active.current.delete(cleanup);
      };
      active.current.add(cleanup);
      ai.finished.then(() => {
        cleanup();
        pulse();
      }).catch(() => cleanup());
    },
    [announce, pulse, reduced, t],
  );

  const api = useMemo<FlyApi>(() => ({ registerAnchor: (el) => void (anchor.current = el), fly }), [fly]);
  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

export function useFlyToCart(): FlyApi {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useFlyToCart requiere <FlyToCartProvider>');
  return ctx;
}
