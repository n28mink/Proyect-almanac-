import type { AnchorHTMLAttributes } from 'react';
/** Sustituto de TransitionLink (next/link + transición de página): un <a> simple. */
export function TransitionLink({ href, variant: _v, direction: _d, ...rest }: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string; variant?: string; direction?: string }) {
  return <a href={href} {...rest} />;
}
