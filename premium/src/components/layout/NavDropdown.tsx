'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { TransitionLink } from '@/components/motion/TransitionLink';
import { CategoryIcon, ChevronDownIcon } from '@/components/ui/Icon';
import { usePathname } from '@/i18n/navigation';
import { cn } from '@/lib/cn';
import type { NavLink } from './nav-data';

/**
 * Una categoría de la barra: el enlace lleva a su página y, si tiene subniveles, un botón junto a él abre su propio desplegable.
 * Se abre con el ratón (al pasar), con clic/teclado en la flecha, y se cierra con Escape, al salir o al navegar.
 */
export function NavDropdown({ item }: { item: NavLink }) {
  const t = useTranslations('header');
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const timer = useRef<number | undefined>(undefined);
  const id = useId();
  const children = item.children ?? [];

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
    const onScroll = () => setOpen(false);
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
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
    <div ref={root} className="relative flex items-center" onPointerEnter={hover(true)} onPointerLeave={hover(false)}>
      <TransitionLink href={item.href} className="nav-link label-micro flex h-11 items-center gap-2.5" aria-current={pathname === item.href ? 'page' : undefined}>
        {item.slug && <CategoryIcon slug={item.slug} width={18} height={18} className="shrink-0 text-gold-soft" />}
        {item.label}
      </TransitionLink>
      {children.length > 0 && (
        <>
          <button type="button" aria-expanded={open} aria-controls={id} aria-label={t('submenu', { name: item.label })} onClick={() => setOpen((v) => !v)} className="grid h-11 w-8 place-items-center transition-opacity duration-150 hover:opacity-70">
            <ChevronDownIcon width={16} height={16} className={cn('transition-transform duration-200 ease-[var(--ease-out)]', open && 'rotate-180')} />
          </button>
          <div id={id} hidden={!open} className="products-menu absolute left-0 top-full z-10 w-max min-w-[15rem] pt-1">
            <ul className="border border-line bg-ivory p-1.5 text-ink shadow-[0_18px_40px_-18px_rgb(11_63_43/0.35)]">
              {children.map((c) => (
                <li key={c.href}>
                  <TransitionLink href={c.href} className="block px-4 py-2.5 text-[0.95rem] transition-colors duration-150 hover:bg-bone focus-visible:bg-bone">
                    {c.label}
                  </TransitionLink>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
