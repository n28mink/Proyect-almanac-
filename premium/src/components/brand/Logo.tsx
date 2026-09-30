import { useTranslations } from 'next-intl';
import { cn } from '@/lib/cn';

/** Trébol de cuatro hojas en línea fina con tallo: el mismo signo que acompaña al nombre en el logotipo original. */
export function CloverGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="-13 -13 26 32" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <defs>
        <path id="clover-leaf" d="M0 0C-1.4-2-8-5-8-11-8-14.6-3.6-15.4 0-11.2 3.6-15.4 8-14.6 8-11 8-5 1.4-2 0 0Z" />
      </defs>
      <use href="#clover-leaf" transform="scale(.8) translate(0 -1)" />
      <use href="#clover-leaf" transform="scale(.8) translate(1 0) rotate(90)" />
      <use href="#clover-leaf" transform="scale(.8) translate(0 1) rotate(180)" />
      <use href="#clover-leaf" transform="scale(.8) translate(-1 0) rotate(270)" />
      <path d="M0 1.5C0 8 1.5 13 6 17" />
    </svg>
  );
}

/** «Clover🍀»: nombre en serif + trébol como superíndice (texto accesible: «Clover»). */
export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn('inline-flex items-start font-display leading-none tracking-[0.005em] text-[var(--logo-fg,var(--accent))]', className)} translate="no">
      <span>Clover</span>
      <CloverGlyph className="ml-[0.05em] mt-[0.02em] h-[0.78em] w-[0.62em] text-gold" />
    </span>
  );
}

/**
 * Logotipo de Clover: wordmark serif con el trébol + subtítulo «Accesorios y Prendas».
 * `stacked` (cabecera): subtítulo bajo el nombre, centrado. Por defecto va en línea.
 */
export function Logo({ className, subtitle = true, stacked = false }: { className?: string; subtitle?: boolean; stacked?: boolean }) {
  const t = useTranslations('brand');
  return (
    <span className={cn('inline-flex', stacked ? 'mt-1 flex-col items-center gap-1.5' : 'items-baseline gap-3', className)}>
      <Wordmark className={stacked ? 'text-[1.85rem] md:text-[2.15rem]' : 'text-[2rem]'} />
      {subtitle && (
        <span className={cn('uppercase text-current opacity-75', stacked ? 'text-[0.5625rem] tracking-[0.3em] md:text-[0.625rem]' : 'text-[0.6875rem] tracking-[0.24em]')}>{t('subtitle')}</span>
      )}
    </span>
  );
}
