/**
 * Tokens de movimiento — fuente de verdad para CSS, Motion y GSAP.
 * Los valores CSS equivalentes viven en src/styles/tokens.css y un test los mantiene sincronizados.
 */

/** Duraciones en segundos (GSAP / Motion). Las variables CSS usan ms. */
export const duration = {
  instant: 0.12,
  fast: 0.24,
  base: 0.42,
  slow: 0.7,
  cinematic: 1.1,
} as const;

export type DurationKey = keyof typeof duration;

/** Curvas cúbicas de Bézier [x1, y1, x2, y2] — idénticas en CSS, Motion y GSAP. */
export const bezier = {
  luxe: [0.22, 1, 0.36, 1],
  expo: [0.16, 1, 0.3, 1],
  curtain: [0.76, 0, 0.24, 1],
  inOut: [0.65, 0, 0.35, 1],
  /** Salida/respuesta de interfaz: arranca al instante (nunca ease-in en UI). */
  out: [0.23, 1, 0.32, 1],
  /** Cajones y hojas: curva tipo iOS. */
  drawer: [0.32, 0.72, 0, 1],
} as const;

export type EaseKey = keyof typeof bezier;

export const cssEase = (key: EaseKey): string => `cubic-bezier(${bezier[key].join(', ')})`;

/** Curva para Motion (`transition.ease`). */
export const motionEase = (key: EaseKey): [number, number, number, number] => [...bezier[key]];

/**
 * Convierte una curva Bézier en función `t → progreso` para GSAP (`ease: gsapEase('luxe')`),
 * de modo que CSS, Motion y GSAP animen con exactamente la misma curva.
 */
export function gsapEase(key: EaseKey): (t: number) => number {
  const [x1, y1, x2, y2] = bezier[key];
  const cx = 3 * x1;
  const bx = 3 * (x2 - x1) - cx;
  const ax = 1 - cx - bx;
  const cy = 3 * y1;
  const by = 3 * (y2 - y1) - cy;
  const ay = 1 - cy - by;

  const sampleX = (t: number) => ((ax * t + bx) * t + cx) * t;
  const sampleY = (t: number) => ((ay * t + by) * t + cy) * t;
  const sampleDX = (t: number) => (3 * ax * t + 2 * bx) * t + cx;

  const solveT = (x: number): number => {
    let t = x;
    for (let i = 0; i < 8; i++) {
      const dx = sampleX(t) - x;
      if (Math.abs(dx) < 1e-6) return t;
      const d = sampleDX(t);
      if (Math.abs(d) < 1e-6) break;
      t -= dx / d;
    }
    let lo = 0;
    let hi = 1;
    t = x;
    while (lo < hi) {
      const dx = sampleX(t);
      if (Math.abs(dx - x) < 1e-6) return t;
      if (x > dx) lo = t;
      else hi = t;
      t = (hi - lo) / 2 + lo;
      if (hi - lo < 1e-7) break;
    }
    return t;
  };

  return (x: number) => {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    return sampleY(solveT(x));
  };
}

/** Distancias y umbrales compartidos por el sistema de reveal. */
export const reveal = {
  /** Margen del IntersectionObserver: dispara un poco antes de entrar. */
  rootMargin: '0px 0px -8% 0px',
  threshold: 0.12,
  stagger: 0.06,
} as const;

/** Presupuesto de las transiciones de página (ms). */
export const pageTransition = {
  cover: 0.38,
  reveal: 0.52,
  /** Tiempo máximo esperando a que la ruta nueva monte antes de revelar igualmente. */
  maxWait: 1.6,
} as const;
