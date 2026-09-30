import { cn } from '@/lib/cn';

/** Marca de cuatro lóbulos (trébol) trazada en línea + gema central. Original de Clover. */
export function CloverMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" className={cn('h-8 w-8', className)} aria-hidden="true">
      <g stroke="currentColor" strokeWidth="1.4">
        <circle cx="17.5" cy="17.5" r="9.5" />
        <circle cx="30.5" cy="17.5" r="9.5" />
        <circle cx="17.5" cy="30.5" r="9.5" />
        <circle cx="30.5" cy="30.5" r="9.5" />
      </g>
      <path d="M24 20.6 27.4 24 24 27.4 20.6 24Z" fill="currentColor" />
    </svg>
  );
}

export function Logo({ className, markClassName, withMark = true }: { className?: string; markClassName?: string; withMark?: boolean }) {
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      {withMark && <CloverMark className={cn('h-7 w-7 text-accent-decor', markClassName)} />}
      <span className="font-display text-[1.7rem] leading-none tracking-[0.06em]">Clover</span>
    </span>
  );
}
