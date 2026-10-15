'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import type { Spin } from '@/domain/catalog';
import { useMotionLevel } from '@/lib/hooks';

/**
 * Giro 360° al estilo de las fichas de joyería: se arrastra (o con flechas del teclado) para girar la pieza y, al soltar,
 * sigue con inercia. Con pocos fotogramas, el cambio entre dos vistas se funde para que el giro no «salte».
 * Los fotogramas se cargan al abrir la diapositiva; con movimiento reducido no hay giro automático ni inercia.
 */
export function Spin360({ spin, name, active }: { spin: Spin; name: string; active: boolean }) {
  const t = useTranslations('product');
  const level = useMotionLevel();
  const n = spin.frames.length;
  const box = useRef<HTMLDivElement>(null);
  const layers = useRef<Array<HTMLImageElement | null>>([]);
  const pos = useRef(0); // posición en fotogramas (fraccionaria)
  const vel = useRef(0);
  const drag = useRef<{ x: number; pos: number; last: number; t: number } | null>(null);
  const raf = useRef(0);
  const auto = useRef(true);
  const [ready, setReady] = useState(0);
  const [hint, setHint] = useState(true);

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

  // Precarga al abrir la diapositiva y arranca el bucle solo cuando está a la vista.
  useEffect(() => {
    if (!active) return;
    let done = 0;
    spin.frames.forEach((src) => {
      const im = new Image();
      im.onload = im.onerror = () => setReady(++done);
      im.src = src;
    });
  }, [active, spin.frames]);

  useEffect(() => {
    if (!active || ready < n) return;
    paint();
    const tick = () => {
      if (!drag.current) {
        if (auto.current && level === 'full') vel.current = 0.045; // giro lento inicial
        else vel.current *= 0.94;
        if (Math.abs(vel.current) < 0.002 && !auto.current) vel.current = 0;
        pos.current += vel.current;
        paint();
      }
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [active, ready, n, level, paint]);

  const stop = () => { auto.current = false; setHint(false); };
  const sens = () => (box.current?.clientWidth ?? 600) / n; // arrastrar la anchura de la caja = una vuelta completa

  return (
    <div
      ref={box}
      className="relative h-full w-full cursor-grab touch-pan-y select-none overflow-hidden active:cursor-grabbing"
      style={{ backgroundColor: spin.tone ?? '#efe6d6' }}
      role="group"
      tabIndex={0}
      aria-roledescription="360"
      aria-label={t('spinLabel', { name })}
      onPointerDown={(e) => {
        stop();
        e.currentTarget.setPointerCapture(e.pointerId);
        drag.current = { x: e.clientX, pos: pos.current, last: e.clientX, t: performance.now() };
        vel.current = 0;
      }}
      onPointerMove={(e) => {
        const d = drag.current;
        if (!d) return;
        const now = performance.now();
        pos.current = d.pos - (e.clientX - d.x) / sens();
        if (now - d.t > 0) vel.current = -((e.clientX - d.last) / sens()) * (16 / Math.max(8, now - d.t));
        d.last = e.clientX;
        d.t = now;
        paint();
      }}
      onPointerUp={() => { drag.current = null; if (level !== 'full') vel.current = 0; }}
      onPointerCancel={() => { drag.current = null; }}
      onKeyDown={(e) => {
        if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
          e.preventDefault();
          stop();
          pos.current = Math.round(pos.current) + (e.key === 'ArrowRight' ? 1 : -1);
          vel.current = 0;
          paint();
        }
      }}
    >
      {spin.frames.map((src, i) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img key={src} ref={(el) => { layers.current[i] = el; }} src={active ? src : undefined} alt={i === 0 ? name : ''} draggable={false} width={spin.width} height={spin.height} className="pointer-events-none absolute inset-0 h-full w-full object-contain" style={{ opacity: i === 0 ? 1 : 0 }} />
      ))}
      {ready < n && active && <div className="absolute inset-0 grid place-items-center text-sm text-mut" aria-live="polite">{t('spinLoading')}</div>}
      <span className="pointer-events-none absolute left-4 top-4 rounded-full bg-ink/70 px-3 py-1 text-sm font-medium text-ivory backdrop-blur-sm">360°</span>
      {hint && ready >= n && <span className="pointer-events-none absolute inset-x-0 bottom-10 mx-auto w-fit rounded-full bg-ink/70 px-4 py-1.5 text-sm text-ivory backdrop-blur-sm">{t('spinHint')}</span>}
    </div>
  );
}
