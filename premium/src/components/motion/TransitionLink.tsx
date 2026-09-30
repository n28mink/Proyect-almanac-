'use client';

import type { ComponentProps, MouseEvent } from 'react';
import { Link } from '@/i18n/navigation';
import { usePageTransition, type TransitionVariant } from './PageTransition';

type Props = Omit<ComponentProps<typeof Link>, 'href'> & {
  href: string;
  variant?: TransitionVariant;
  direction?: 1 | -1;
};

/**
 * Enlace con transición de página. Es un <a> real (SEO, abrir en pestaña nueva, sin JS):
 * solo intercepta el clic simple hacia una ruta interna distinta.
 */
export function TransitionLink({ href, variant, direction, onClick, target, ...rest }: Props) {
  const { navigate } = usePageTransition();

  const handle = (e: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(e);
    if (e.defaultPrevented) return;
    const modified = e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0;
    if (modified || (target && target !== '_self') || !href.startsWith('/')) return;
    e.preventDefault();
    navigate(href, {
      variant,
      direction,
      origin: { x: e.clientX, y: e.clientY },
      // detail === 0: activación por teclado → mover el foco al contenido principal.
      focusMain: e.detail === 0,
    });
  };

  return <Link href={href} target={target} onClick={handle} {...rest} />;
}
