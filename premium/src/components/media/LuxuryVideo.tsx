'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import type { VideoAsset } from '@/content/media';
import { pick } from '@/domain/i18n';
import type { Locale } from '@/i18n/routing';
import { cn } from '@/lib/cn';
import { useInView, useMediaQuery, usePrefersReducedMotion } from '@/lib/hooks';

interface LuxuryVideoProps {
  video: VideoAsset;
  className?: string;
  /** Vídeo crítico (hero): el poster se precarga y el vídeo se monta al quedar el hilo libre. */
  priority?: boolean;
  /** Montar solo al acercarse al viewport. Por defecto true si no es prioritario. */
  lazy?: boolean;
  autoPlay?: boolean;
  loop?: boolean;
  muted?: boolean;
  controls?: boolean;
  /** Estrategia de precarga del <video>. */
  preload?: 'none' | 'metadata' | 'auto';
  /** Pausar cuando sale de pantalla (ahorra CPU/batería). */
  pauseWhenHidden?: boolean;
  /** Botón accesible de pausa/reproducción (WCAG 2.2.2 para movimiento > 5 s). */
  showToggle?: boolean;
  fit?: 'cover' | 'contain';
  /** Anula el aspect-ratio (por defecto el del poster) — evita layout shift. */
  aspectRatio?: string;
  /** Ruta de imagen alternativa si el vídeo falla. Por defecto el poster. */
  fallbackImage?: string;
  objectPosition?: string;
}

/**
 * Vídeo de campaña reutilizable.
 * SSR pinta SOLO el poster (LCP, sin bloquear FCP); el <video> se monta tras hidratar (idle) o al acercarse.
 * Elige recorte móvil/escritorio, webm+mp4, se pausa fuera de pantalla y respeta reduced-motion / ahorro de datos
 * (solo poster + botón de reproducir bajo petición). Si el vídeo falla, queda el poster.
 */
export function LuxuryVideo({
  video, className, priority = false, lazy, autoPlay = true, loop = true, muted = true, controls = false, preload = 'metadata',
  pauseWhenHidden = true, showToggle = true, fit = 'cover', aspectRatio, fallbackImage, objectPosition = 'center',
}: LuxuryVideoProps) {
  const t = useTranslations('video');
  const locale = useLocale() as Locale;
  const reduced = usePrefersReducedMotion();
  const isDesktop = useMediaQuery('(min-width: 768px)');
  const [wrapRef, inView] = useInView<HTMLDivElement>('300px 0px');
  const videoRef = useRef<HTMLVideoElement>(null);
  const [idle, setIdle] = useState(false);
  const [userPlay, setUserPlay] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [failed, setFailed] = useState(false);

  const saveData = typeof navigator !== 'undefined' && (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData === true;
  const motionAllowed = !reduced && !saveData;
  const wantsMount = (motionAllowed && autoPlay) || userPlay;
  const lazyMount = lazy ?? !priority;
  const shouldMount = wantsMount && !failed && (lazyMount ? inView : idle || inView);

  useEffect(() => {
    if (!priority) return;
    const ric = (window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number }).requestIdleCallback;
    const id = ric ? ric(() => setIdle(true), { timeout: 1800 }) : window.setTimeout(() => setIdle(true), 600);
    return () => {
      if (!ric) clearTimeout(id);
    };
  }, [priority]);

  // Pausa fuera de pantalla.
  useEffect(() => {
    const v = videoRef.current;
    if (!v || !pauseWhenHidden || !shouldMount) return;
    if (inView) void v.play().catch(() => undefined);
    else v.pause();
  }, [inView, pauseWhenHidden, shouldMount]);

  const toggle = useCallback(() => {
    const v = videoRef.current;
    if (!v) {
      setUserPlay(true);
      return;
    }
    if (v.paused) void v.play().catch(() => undefined);
    else v.pause();
  }, []);

  const posterDesktop = video.poster.desktop;
  const posterMobile = video.poster.mobile ?? posterDesktop;
  const sources = isDesktop || !video.sources.mobile ? video.sources.desktop : video.sources.mobile;
  const ratio = aspectRatio ?? `${posterDesktop.width} / ${posterDesktop.height}`;
  const label = pick(video.label, locale);
  const showButton = showToggle && (shouldMount || !motionAllowed);

  return (
    <div ref={wrapRef} className={cn('relative isolate overflow-hidden', className)} style={{ aspectRatio: ratio, backgroundColor: posterDesktop.tone }}>
      {/* Arte dirigido: recorte vertical en móvil. <img> nativo para no precargar los dos posters. */}
      <picture>
        <source media="(max-width: 767px)" srcSet={posterMobile.src} />
        <img
          src={fallbackImage ?? posterDesktop.src}
          alt=""
          width={posterDesktop.width}
          height={posterDesktop.height}
          className={cn('absolute inset-0 h-full w-full', fit === 'cover' ? 'object-cover' : 'object-contain')}
          style={{ objectPosition }}
          fetchPriority={priority ? 'high' : 'auto'}
          loading={priority ? 'eager' : 'lazy'}
          decoding={priority ? 'sync' : 'async'}
        />
      </picture>

      {shouldMount && (
        <video
          ref={videoRef}
          className={cn('absolute inset-0 h-full w-full transition-opacity duration-700', fit === 'cover' ? 'object-cover' : 'object-contain', playing ? 'opacity-100' : 'opacity-0')}
          style={{ objectPosition }}
          muted={muted}
          loop={loop}
          playsInline
          autoPlay
          controls={controls}
          preload={preload}
          poster={posterDesktop.src}
          aria-label={label}
          onPlaying={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onError={() => setFailed(true)}
          key={isDesktop ? 'd' : 'm'}
        >
          {sources.map((s) => (
            <source key={s.src} src={s.src} type={s.type} />
          ))}
          {video.captions?.map((c) => (
            <track key={c.src} kind="captions" src={c.src} srcLang={c.srclang} label={c.label} />
          ))}
        </video>
      )}

      {showButton && (
        <button
          type="button"
          onClick={toggle}
          aria-label={playing ? t('pause') : t('play')}
          aria-pressed={playing}
          className="absolute bottom-4 right-4 z-10 grid h-11 w-11 place-items-center border border-white/40 bg-ink/45 text-ivory backdrop-blur-sm transition-colors hover:bg-ink/70"
        >
          {playing ? (
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true"><rect x="6" y="5" width="4" height="14" /><rect x="14" y="5" width="4" height="14" /></svg>
          ) : (
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z" /></svg>
          )}
        </button>
      )}
      <span className="sr-only">{label}</span>
    </div>
  );
}
