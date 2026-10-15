'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, type ReactNode } from 'react';
import { Wordmark } from '@/components/brand/Logo';
import { gsapEase, pageTransition } from '@/config/motion';
import { usePathname, useRouter } from '@/i18n/navigation';
import { gsap } from '@/lib/gsap';
import { usePrefersReducedMotion } from '@/lib/hooks';
import { useUi } from '@/stores/ui-store';

export type TransitionVariant = 'curtain' | 'ivory' | 'clip' | 'mask' | 'direction';

export interface NavigateOptions {
  variant?: TransitionVariant;
  /** Punto de origen (px de viewport) para la variante `clip`. */
  origin?: { x: number; y: number };
  /** Para `direction`: 1 avanza (entra desde la derecha), -1 retrocede. */
  direction?: 1 | -1;
  /** Mueve el foco al contenido principal (navegación por teclado). */
  focusMain?: boolean;
  /** Sin cortina: navegación inmediata. Las acciones iniciadas con teclado nunca se animan. */
  instant?: boolean;
}

interface Api {
  navigate: (href: string, options?: NavigateOptions) => void;
}

const Ctx = createContext<Api | null>(null);

const FULL = 'inset(0% 0% 0% 0%)';

/** Estados de recorte inicial → cubierto → salida, por variante. */
function shapes(v: TransitionVariant, o: NavigateOptions): { from: string; full: string; out: string; tone: 'ink' | 'porcelain'; soft?: boolean } {
  const dir = o.direction ?? 1;
  switch (v) {
    case 'ivory':
      return { from: 'inset(0% 0% 100% 0%)', full: FULL, out: 'inset(100% 0% 0% 0%)', tone: 'porcelain' as const };
    // Enlaces con foto: desvanecido en marfil (sin círculo ni rombo que barran la pantalla de golpe).
    case 'clip':
    case 'mask':
      return { from: FULL, full: FULL, out: FULL, tone: 'porcelain', soft: true };
    case 'direction':
      return dir === 1
        ? { from: 'inset(0% 0% 0% 100%)', full: FULL, out: 'inset(0% 100% 0% 0%)', tone: 'porcelain' as const }
        : { from: 'inset(0% 100% 0% 0%)', full: FULL, out: 'inset(0% 0% 0% 100%)', tone: 'porcelain' as const };
    case 'curtain':
    default:
      return { from: 'inset(100% 0% 0% 0%)', full: FULL, out: 'inset(0% 0% 100% 0%)', tone: 'ink' as const };
  }
}

/**
 * Transiciones de página reutilizables (App Router no puede animar la salida de la ruta vieja).
 * Máquina: idle → covering (cortina sube) → router.push → navigating (espera a que la ruta nueva monte) → revealing → idle.
 * Presupuesto: cortinas ~380 ms cubrir + ~520 ms revelar; enlaces con foto (`clip`, `mask`) desvanecido en marfil de ~460 ms + pausa + ~720 ms. Con reduced-motion o al activar el enlace con el teclado la navegación es inmediata.
 */
export function PageTransitionProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const reduced = usePrefersReducedMotion();
  const closePanel = useUi((s) => s.closePanel);

  const overlay = useRef<HTMLDivElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const mark = useRef<HTMLDivElement>(null);
  const state = useRef<'idle' | 'covering' | 'navigating' | 'revealing'>('idle');
  const pathRef = useRef(pathname);
  const waiter = useRef<(() => void) | null>(null);
  const tl = useRef<gsap.core.Timeline | null>(null);

  useEffect(() => {
    pathRef.current = pathname;
    waiter.current?.();
  }, [pathname]);

  useEffect(() => () => void tl.current?.kill(), []);

  const navigate = useCallback<Api['navigate']>(
    (href, options = {}) => {
      const target = pathnameOf(href);
      if (options.instant || reduced || state.current !== 'idle' || !overlay.current || !panel.current || target === pathRef.current) {
        closePanel();
        router.push(href);
        if (options.focusMain) window.setTimeout(() => document.getElementById('main')?.focus({ preventScroll: true }), 60);
        return;
      }
      const el = overlay.current;
      const pan = panel.current;
      const shape = shapes(options.variant ?? 'curtain', options);
      const ease = gsapEase('curtain');
      const soft = Boolean(shape.soft);
      state.current = 'covering';
      closePanel();
      pan.dataset.tone = shape.tone;
      gsap.set(el, { autoAlpha: 1, pointerEvents: 'auto' });
      gsap.set(pan, { clipPath: shape.from, autoAlpha: soft ? 0 : 1 });
      gsap.set(mark.current, { autoAlpha: 0, y: 12 });

      const reveal = () => {
        state.current = 'revealing';
        if (options.focusMain) document.getElementById('main')?.focus({ preventScroll: true });
        const out = gsap.timeline({
          onComplete: () => {
            gsap.set(el, { autoAlpha: 0, pointerEvents: 'none' });
            state.current = 'idle';
          },
        });
        out.to(mark.current, { autoAlpha: 0, duration: soft ? 0.32 : 0.2, ease: 'power1.out' }, 0);
        out.to(pan, soft ? { autoAlpha: 0, duration: pageTransition.softReveal, ease: gsapEase('luxe') } : { clipPath: shape.out, duration: pageTransition.reveal, ease }, 0.05);
      };

      const cover = soft ? pageTransition.softCover : pageTransition.cover;
      tl.current = gsap
        .timeline()
        .to(pan, soft ? { autoAlpha: 1, duration: cover, ease: gsapEase('out') } : { clipPath: shape.full, duration: cover, ease })
        .to(mark.current, { autoAlpha: 1, y: 0, duration: 0.28, ease: 'power2.out' }, cover * (soft ? 0.3 : 0.45))
        .add(() => {
          state.current = 'navigating';
          const covered = performance.now();
          let done = false;
          const finish = () => {
            if (done) return;
            done = true;
            waiter.current = null;
            // Pausa mínima con la pantalla cubierta (solo desvanecido suave) y dos frames para que la ruta nueva pinte.
            const wait = soft ? Math.max(0, pageTransition.softHold * 1000 - (performance.now() - covered)) : 0;
            window.setTimeout(() => requestAnimationFrame(() => requestAnimationFrame(reveal)), wait);
          };
          waiter.current = finish;
          router.push(href);
          window.setTimeout(finish, pageTransition.maxWait * 1000);
        });
    },
    [closePanel, reduced, router],
  );

  const api = useMemo<Api>(() => ({ navigate }), [navigate]);

  return (
    <Ctx.Provider value={api}>
      {children}
      <div ref={overlay} aria-hidden="true" className="pointer-events-none invisible fixed inset-0 opacity-0" style={{ zIndex: 'var(--z-transition)' }}>
        <div ref={panel} data-tone="ink" className="absolute inset-0 grid place-items-center bg-forest text-gold-soft data-[tone=porcelain]:bg-porcelain data-[tone=porcelain]:text-forest" style={{ clipPath: 'inset(100% 0% 0% 0%)' }}>
          <div ref={mark}>
            <Wordmark className="text-[2.75rem] md:text-[3.5rem]" />
          </div>
        </div>
      </div>
    </Ctx.Provider>
  );
}

function pathnameOf(href: string): string {
  try {
    return new URL(href, 'http://x').pathname.replace(/\/$/, '') || '/';
  } catch {
    return href;
  }
}

export function usePageTransition(): Api {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('usePageTransition requiere <PageTransitionProvider>');
  return ctx;
}
