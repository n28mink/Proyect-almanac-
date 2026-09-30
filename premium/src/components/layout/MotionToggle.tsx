'use client';

import { cn } from '@/lib/cn';
import { setMotionPref, useMotionReducedByUser } from '@/lib/motion-pref';

/**
 * Interruptor de movimiento. Sustituye al botón de pausa sobre los vídeos: un solo control, siempre en el mismo sitio,
 * que detiene vídeos, scroll suave, revelados y transiciones (WCAG 2.2.2). Respeta además prefers-reduced-motion.
 */
export function MotionToggle({ labelReduce, labelRestore, className }: { labelReduce: string; labelRestore: string; className?: string }) {
  const reduced = useMotionReducedByUser();
  return (
    <button
      type="button"
      aria-pressed={reduced}
      onClick={() => setMotionPref(reduced ? 'auto' : 'reduced')}
      className={cn('label-micro nav-link inline-flex min-h-11 items-center px-1 text-fg-subtle hover:text-fg', reduced && 'text-fg', className)}
    >
      {reduced ? labelRestore : labelReduce}
    </button>
  );
}
