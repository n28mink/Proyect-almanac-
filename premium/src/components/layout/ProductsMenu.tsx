'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { TransitionLink } from '@/components/motion/TransitionLink';
import { CategoryIcon, ChevronDownIcon } from '@/components/ui/Icon';
import { usePathname } from '@/i18n/navigation';
import { cn } from '@/lib/cn';
import type { NavLink } from './nav-data';

/**
 * Menú desplegable "Productos" de la cabecera: una fila por categoría con su icono.
 * Se abre con clic/teclado y, con puntero fino, al pasar por encima; se cierra con Escape, al salir o al navegar.
 */
export function ProductsMenu({ items }: { items: NavLink[] }) {
  const t = useTranslations('header');
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const timer = useRef<number | undefined>(undefined);
  const id = useId();

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      setOpen(false);
      root.current?.querySelector<HTMLButtonElement>('button')?.focus();
    };
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const hover = (next: boolean) => (e: React.PointerEvent) => {
    if (e.pointerType !== 'mouse') return;
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setOpen(next), next ? 60 : 160);
  };

  return (
    <div ref={root} className="relative" onPointerEnter={hover(true)} onPointerLeave={hover(false)}>
      <button type="button" aria-expanded={open} aria-controls={id} onClick={() => setOpen((v) => !v)} className="label-micro flex h-11 items-center gap-2 px-1 transition-opacity duration-150 hover:opacity-70">
        {t('products')}
        <ChevronDownIcon width={16} height={16} className={cn('transition-transform duration-200 ease-[var(--ease-out)]', open && 'rotate-180')} />
      </button>

      <div id={id} hidden={!open} className="products-menu absolute left-1/2 top-full z-10 w-[22rem] -translate-x-1/2 pt-1">
        <ul className="border border-line bg-ivory p-2 text-ink shadow-[0_18px_40px_-18px_rgb(11_63_43/0.35)]">
          {items.map((l) => (
            <li key={l.href}>
              <TransitionLink href={l.href} className="group flex items-center gap-4 px-3 py-3 transition-colors duration-150 hover:bg-bone focus-visible:bg-bone">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-bone text-forest transition-colors duration-150 group-hover:bg-forest group-hover:text-ivory">
                  <CategoryIcon slug={l.slug ?? ''} width={22} height={22} />
                </span>
                <span className="min-w-0">
                  <span className="block font-display text-[1.15rem] leading-tight">{l.label}</span>
                  {l.blurb && <span className="block truncate text-caption text-ink/65">{l.blurb}</span>}
                </span>
              </TransitionLink>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
