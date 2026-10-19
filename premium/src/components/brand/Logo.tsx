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

/** «CLOVER»: nombre en serif de alto contraste (Bodoni Moda) en mayúsculas + trébol dorado como superíndice (texto accesible: «Clover»). */
export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn('inline-flex items-start font-brand font-semibold uppercase [line-height:1] tracking-[0.07em] text-[var(--logo-fg,var(--accent))]', className)} translate="no">
      <span>Clover</span>
      <CloverGlyph className="ml-[0.1em] -mt-[0.04em] h-[0.6em] w-[0.48em] text-[var(--logo-glyph,var(--color-gold))]" />
    </span>
  );
}

/**
 * Logotipo de Clover: wordmark con el trébol + subtítulo «Accesorios y Prendas».
 * `stacked` (cabecera): subtítulo bajo el nombre, centrado. Por defecto va en línea.
 */
export function Logo({ className, subtitle = true, stacked = false }: { className?: string; subtitle?: boolean; stacked?: boolean }) {
  const t = useTranslations('brand');
  return (
    <span className={cn('inline-flex', stacked ? 'mt-0.5 flex-col items-center gap-2' : 'flex-wrap items-baseline gap-x-3 gap-y-1', className)}>
      <Wordmark className={stacked ? 'text-[1.75rem] max-[359px]:text-[1.375rem] md:text-[2.1rem] lg:text-[2.75rem]' : 'text-[1.85rem]'} />
      {subtitle && (
        <span className={cn('whitespace-nowrap font-medium uppercase text-current', stacked ? 'text-[0.5625rem] tracking-[0.2em] max-[359px]:tracking-[0.06em] sm:text-[0.625rem] sm:tracking-[0.28em] md:text-[0.6875rem] lg:text-[0.75rem] lg:tracking-[0.36em]' : 'text-[0.6875rem] tracking-[0.26em]')}>{t('subtitle')}</span>
      )}
    </span>
  );
}
