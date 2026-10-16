'use client';

import { forwardRef, useCallback, useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { CloseIcon } from '@/components/ui/Icon';
import type { Spin } from '@/domain/catalog';
import { cn } from '@/lib/cn';
import { useMotionLevel } from '@/lib/hooks';

/**
 * Giro 360° al estilo de las fichas de joyería: se arrastra (o con las flechas) para girar la pieza y, al soltar, sigue con inercia y se asienta
 * en un fotograma limpio (nunca queda «mezclado»). Con pocos fotogramas, el cambio entre dos vistas se funde para que el giro no «salte».
 * Doble clic / doble toque / pellizco amplían para ver el detalle de la joya; con zoom, arrastrar mueve la foto en vez de girarla.
 * Los fotogramas se cargan la primera vez que se pide (`active`, o `preload` al acercarse al botón); con movimiento reducido no hay giro automático ni inercia.
 * Escape quita el zoom y, si no lo hay, llama a `onExit`.
 */
const ZOOM = 2.4;
const MAX_ZOOM = 4;

export function Spin360({ spin, name, active, preload = false, onExit }: { spin: Spin; name: string; active: boolean; preload?: boolean; onExit?: () => void }) {
  const t = useTranslations('product');
  const level = useMotionLevel();
  const n = spin.frames.length;
  const box = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const layers = useRef<Array<HTMLImageElement | null>>([]);
  const pos = useRef(0); // posición en fotogramas (fraccionaria)
  const vel = useRef(0); // fotogramas por milisegundo
  const drag = useRef<{ x: number; pos: number; px: number; py: number; zx: number; zy: number } | null>(null);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const pinch = useRef<{ d: number; s: number } | null>(null);
  const zoom = useRef({ s: 1, x: 0, y: 0 });
  const lastMove = useRef(0);
  const raf = useRef(0);
  const auto = useRef(true);
  const [ready, setReady] = useState(0);
  const [hint, setHint] = useState(true);
  const [zoomed, setZoomed] = useState(false);
  const [started, setStarted] = useState(false); // una vez pedido, los fotogramas se quedan cargados
  if ((active || preload) && !started) setStarted(true);

  const paint = useCallback(() => {
    const p = ((pos.current % n) + n) % n;
    const a = Math.floor(p);
    const b = (a + 1) % n;
    const f = Math.min(1, Math.max(0, (p - a - 0.35) / 0.3)); // la mezcla ocupa solo el tramo central: la mayor parte del tiempo se ve un fotograma limpio
    layers.current.forEach((el, i) => {
      if (!el) return;
      el.style.opacity = i === a ? '1' : i === b ? String(f) : '0';
      el.style.zIndex = i === b ? '2' : i === a ? '1' : '0';
    });
  }, [n]);

  /** Aplica el zoom: la foto no se sale de la caja (el desplazamiento se limita al borde ampliado). */
  const applyZoom = useCallback((s: number, x: number, y: number) => {
    const w = box.current?.clientWidth ?? 600;
    const h = box.current?.clientHeight ?? 750;
    const ns = Math.min(MAX_ZOOM, Math.max(1, s));
    const lx = ((ns - 1) * w) / 2;
    const ly = ((ns - 1) * h) / 2;
    zoom.current = { s: ns, x: ns === 1 ? 0 : Math.min(lx, Math.max(-lx, x)), y: ns === 1 ? 0 : Math.min(ly, Math.max(-ly, y)) };
    const el = stage.current;
    if (el) el.style.transform = `translate3d(${zoom.current.x}px, ${zoom.current.y}px, 0) scale(${ns})`;
    setZoomed((z) => (z === ns > 1 ? z : ns > 1));
  }, []);

  /** Amplía el punto (cx, cy) —en píxeles desde el centro de la caja— al nivel `s`, dejando ese punto quieto en pantalla. */
  const zoomAt = useCallback((s: number, cx: number, cy: number) => {
    const z = zoom.current;
    const ns = Math.min(MAX_ZOOM, Math.max(1, s));
    applyZoom(ns, cx - ((cx - z.x) * ns) / z.s, cy - ((cy - z.y) * ns) / z.s);
  }, [applyZoom]);

  // Precarga la primera vez que se pide y arranca el bucle solo mientras está a la vista.
  useEffect(() => {
    if (!started) return;
    let done = 0;
    spin.frames.forEach((src) => {
      const im = new Image();
      im.onload = im.onerror = () => setReady(++done);
      im.src = src;
    });
  }, [started, spin.frames]);

  useEffect(() => {
    if (!active || ready < n) return;
    paint();
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(48, now - last);
      last = now;
      if (!drag.current && !pinch.current) {
        if (auto.current && level === 'full' && zoom.current.s === 1) vel.current = (n / 12) * 0.0027; // giro lento inicial: ~4,5 s por vuelta sea cual sea el número de fotogramas
        else vel.current *= Math.exp(-dt / 320); // la inercia se frena con el tiempo, no con los fotogramas por segundo
        if (!auto.current && Math.abs(vel.current) < 0.0005) {
          vel.current = 0;
          pos.current += (Math.round(pos.current) - pos.current) * (1 - Math.exp(-dt / 90)); // se asienta en el fotograma más cercano
        }
        pos.current += vel.current * dt;
        paint();
      }
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [active, ready, n, level, paint]);

  // Al salir del giro se quita el zoom.
  useEffect(() => {
    if (!active) applyZoom(1, 0, 0);
  }, [active, applyZoom]);

  const stop = () => { auto.current = false; setHint(false); };
  const sens = () => (box.current?.clientWidth ?? 600) / n; // arrastrar la anchura de la caja = una vuelta completa
  const rel = (e: { clientX: number; clientY: number }) => {
    const r = box.current!.getBoundingClientRect();
    return { x: e.clientX - r.left - r.width / 2, y: e.clientY - r.top - r.height / 2 };
  };

  return (
    <div
      ref={box}
      className={cn('relative h-full w-full touch-pan-y select-none overflow-hidden', zoomed ? 'cursor-move' : 'cursor-grab active:cursor-grabbing')}
      style={{ backgroundColor: spin.tone ?? '#efe6d6' }}
      role="group"
      tabIndex={0}
      aria-roledescription="360"
      aria-label={t('spinLabel', { name })}
      onDoubleClick={(e) => {
        stop();
        const c = rel(e);
        if (zoom.current.s > 1) applyZoom(1, 0, 0);
        else zoomAt(ZOOM, c.x, c.y);
      }}
      onPointerDown={(e) => {
        stop();
        e.currentTarget.setPointerCapture(e.pointerId);
        pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
        if (pointers.current.size === 2) {
          const [p, q] = [...pointers.current.values()];
          pinch.current = { d: Math.hypot(p!.x - q!.x, p!.y - q!.y), s: zoom.current.s };
          drag.current = null;
          return;
        }
        drag.current = { x: e.clientX, pos: pos.current, px: e.clientX, py: e.clientY, zx: zoom.current.x, zy: zoom.current.y };
        vel.current = 0;
      }}
      onPointerMove={(e) => {
        if (pointers.current.has(e.pointerId)) pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
        if (pinch.current && pointers.current.size === 2) {
          const [p, q] = [...pointers.current.values()];
          const c = rel({ clientX: (p!.x + q!.x) / 2, clientY: (p!.y + q!.y) / 2 });
          zoomAt(pinch.current.s * (Math.hypot(p!.x - q!.x, p!.y - q!.y) / pinch.current.d), c.x, c.y);
          return;
        }
        const d = drag.current;
        if (!d) return;
        if (zoom.current.s > 1) {
          applyZoom(zoom.current.s, d.zx + (e.clientX - d.px), d.zy + (e.clientY - d.py)); // con zoom, arrastrar mueve la foto
          return;
        }
        const target = d.pos - (e.clientX - d.x) / sens();
        const dt = Math.max(8, e.timeStamp - (lastMove.current || e.timeStamp - 16));
        vel.current = vel.current * 0.6 + ((target - pos.current) / dt) * 0.4; // velocidad suavizada para que el lanzamiento no tiemble
        lastMove.current = e.timeStamp;
        pos.current = target;
        paint();
      }}
      onPointerUp={(e) => {
        pointers.current.delete(e.pointerId);
        if (pointers.current.size < 2) pinch.current = null;
        drag.current = null;
        if (e.timeStamp - lastMove.current > 90 || level !== 'full') vel.current = 0; // si se frenó antes de soltar, no hay lanzamiento
        lastMove.current = 0;
      }}
      onPointerCancel={(e) => { pointers.current.delete(e.pointerId); pinch.current = null; drag.current = null; lastMove.current = 0; }}
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          if (zoom.current.s > 1) applyZoom(1, 0, 0);
          else onExit?.();
          return;
        }
        if (e.key === '+' || e.key === '=') { stop(); zoomAt(zoom.current.s * 1.4, 0, 0); return; }
        if (e.key === '-') { zoomAt(zoom.current.s / 1.4, 0, 0); return; }
        if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
          e.preventDefault();
          stop();
          pos.current = Math.round(pos.current) + (e.key === 'ArrowRight' ? 1 : -1);
          vel.current = 0;
          paint();
        }
      }}
    >
      <div ref={stage} className="absolute inset-0 will-change-transform">
        {spin.frames.map((src, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={src} ref={(el) => { layers.current[i] = el; }} src={started ? src : undefined} alt={i === 0 ? name : ''} draggable={false} width={spin.width} height={spin.height} className="pointer-events-none absolute inset-0 h-full w-full object-contain" style={{ opacity: i === 0 ? 1 : 0 }} />
        ))}
      </div>
      {ready < n && started && <div className="absolute inset-0 grid place-items-center text-sm text-mut" aria-live="polite">{t('spinLoading')}</div>}
      {hint && ready >= n && <span className="pointer-events-none absolute inset-x-0 bottom-10 mx-auto w-fit rounded-full bg-ink/70 px-4 py-1.5 text-sm text-ivory backdrop-blur-sm">{t('spinHint')}</span>}
    </div>
  );
}

/**
 * Botón «360°» de la esquina superior izquierda de la foto principal (como en las fichas de Swarovski): un clic activa el giro sobre la misma foto
 * y otro clic (o Escape) vuelve a las fotos. Al acercarse o enfocarlo ya se van cargando los fotogramas, así que al pulsar no hay espera.
 */
export const SpinToggle = forwardRef<HTMLButtonElement, { on: boolean; onToggle: () => void; onWarm: () => void }>(function SpinToggle({ on, onToggle, onWarm }, ref) {
  const t = useTranslations('product');
  return (
    <button
      ref={ref}
      type="button"
      aria-pressed={on}
      aria-label={on ? t('spinOff') : t('showSpin')}
      onClick={onToggle}
      onPointerEnter={onWarm}
      onFocus={onWarm}
      onTouchStart={onWarm}
      className={cn(
        'absolute left-4 top-4 z-20 inline-flex h-11 items-center gap-1.5 rounded-full px-4 text-sm font-medium shadow-sm backdrop-blur-sm',
        'transition-[transform,background-color,color] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] active:scale-[0.97]',
        on ? 'bg-ivory text-ink' : 'bg-ink/70 text-ivory',
      )}
    >
      360°
      {on && <CloseIcon className="h-4 w-4" />}
    </button>
  );
});
