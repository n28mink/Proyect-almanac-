import type { ElementType } from 'react';
/** Sustituto de StaggerText (revelado por palabras con GSAP): el titular ya visible. */
export function StaggerText({ text, as: Tag = 'span', className }: { text: string; as?: ElementType; className?: string; delay?: number; intro?: boolean }) {
  return <Tag className={className}>{text}</Tag>;
}
