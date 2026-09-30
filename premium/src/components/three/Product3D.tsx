'use client';

import dynamic from 'next/dynamic';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Button } from '@/components/ui/Button';
import { CubeIcon } from '@/components/ui/Icon';
import type { FinishKey, Model3d } from '@/domain/catalog';
import type { Locale } from '@/i18n/routing';
import { cn } from '@/lib/cn';
import { useInView, usePrefersReducedMotion } from '@/lib/hooks';
import { FINISH_COLORS } from './finish-colors';

const WatchViewer = dynamic(() => import('./WatchViewer'), {
  ssr: false,
  loading: () => <div className="skeleton absolute inset-0" aria-hidden="true" />,
});

/** ¿Vale la pena cargar WebGL? Descarta dispositivos débiles, ahorro de datos y navegadores sin WebGL2. */
function canRun3D(): boolean {
  try {
    const nav = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } };
    if (nav.connection?.saveData) return false;
    if (nav.deviceMemory !== undefined && nav.deviceMemory < 4) return false;
    if (nav.hardwareConcurrency !== undefined && nav.hardwareConcurrency < 4) return false;
    const c = document.createElement('canvas');
    return !!c.getContext('webgl2');
  } catch {
    return false;
  }
}

interface Product3DProps {
  model: Model3d;
  /** Foto 2D (poster y fallback). */
  posterSrc: string;
  posterBlur?: string;
  posterAlt: string;
  /** Esferas por variante, para el selector de color de esfera. */
  dials: Array<{ variantId: string; label: string; color: string }>;
  activeVariantId?: string;
  className?: string;
}

/**
 * Visor 3D bajo demanda (React Three Fiber). No descarga three/r3f hasta que el usuario lo pide;
 * si el dispositivo es débil, no hay WebGL2 o falla el contexto, se queda en la foto 2D.
 * Permite rotar, hacer zoom y cambiar acabado/esfera con iluminación de estudio procedural (sin HDR externos).
 */
export function Product3D({ model, posterSrc, posterBlur, posterAlt, dials, activeVariantId, className }: Product3DProps) {
  const t = useTranslations('product');
  const locale = useLocale() as Locale;
  const reduced = usePrefersReducedMotion();
  const [wrapRef, inView] = useInView<HTMLDivElement>('0px');
  const [supported, setSupported] = useState<boolean | null>(null);
  const [started, setStarted] = useState(false);
  const [failed, setFailed] = useState(false);
  const [finish, setFinish] = useState<FinishKey>(model.defaultFinish);
  const [dialId, setDialId] = useState(activeVariantId ?? dials[0]?.variantId);

  useEffect(() => setSupported(canRun3D()), []);
  useEffect(() => {
    if (activeVariantId) setDialId(activeVariantId);
  }, [activeVariantId]);

  const dial = dials.find((d) => d.variantId === dialId)?.color ?? dials[0]?.color ?? '#f4f1ea';
  const active = started && !failed && supported;

  return (
    <div className={cn('space-y-4', className)}>
      <div ref={wrapRef} className="relative aspect-square overflow-hidden bg-surface-sunken">
        {active ? (
          inView ? (
            <WatchViewer model={model} finish={finish} dial={dial} autoRotate={!reduced} onContextLost={() => setFailed(true)} />
          ) : (
            <div className="absolute inset-0" aria-hidden="true" />
          )
        ) : (
          <>
            <Image src={posterSrc} alt={posterAlt} fill sizes="(min-width: 1024px) 50vw, 100vw" placeholder={posterBlur ? 'blur' : 'empty'} blurDataURL={posterBlur} className="object-cover" />
            <div className="absolute inset-x-0 bottom-5 flex justify-center px-4">
              {supported === false || failed ? (
                <p className="bg-ivory/90 px-4 py-3 text-caption text-ink backdrop-blur-sm" role="status">{t('view3dUnavailable')}</p>
              ) : (
                <Button onClick={() => setStarted(true)} disabled={supported === null} className="!border-ivory !bg-ivory !text-ink hover:!bg-ink hover:!text-ivory">
                  <CubeIcon width={18} height={18} />
                  {t('view3d')}
                </Button>
              )}
            </div>
          </>
        )}
        {active && <p className="label-micro pointer-events-none absolute left-4 top-4 bg-ivory/80 px-2.5 py-1.5 text-ink backdrop-blur-sm">{t('dragToRotate')}</p>}
      </div>

      {active && (
        <div className="grid gap-4 sm:grid-cols-2">
          <fieldset>
            <legend className="label-micro mb-2 text-fg-subtle">{t('finish')}</legend>
            <div className="flex flex-wrap gap-2">
              {model.finishes.map((f) => (
                <button key={f} type="button" aria-pressed={finish === f} onClick={() => setFinish(f)} className={cn('label-micro flex items-center gap-2 border px-3 py-2.5 transition-colors', finish === f ? 'border-fg' : 'border-line-strong hover:border-fg')}>
                  <span aria-hidden="true" className="h-3.5 w-3.5 rounded-full border border-black/10" style={{ background: FINISH_COLORS[f].color }} />
                  {FINISH_COLORS[f].label[locale]}
                </button>
              ))}
            </div>
          </fieldset>
          {dials.length > 1 && (
            <fieldset>
              <legend className="label-micro mb-2 text-fg-subtle">{t('dial')}</legend>
              <div className="flex flex-wrap gap-2">
                {dials.map((d) => (
                  <button key={d.variantId} type="button" aria-pressed={dialId === d.variantId} aria-label={d.label} title={d.label} onClick={() => setDialId(d.variantId)} className={cn('grid h-10 w-10 place-items-center border transition-colors', dialId === d.variantId ? 'border-fg' : 'border-line-strong hover:border-fg')}>
                    <span aria-hidden="true" className="h-5 w-5 rounded-full border border-black/15" style={{ background: d.color }} />
                  </button>
                ))}
              </div>
            </fieldset>
          )}
        </div>
      )}
    </div>
  );
}
