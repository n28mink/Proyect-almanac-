import type { ElementType, ReactNode } from 'react';
import { StaggerText } from '@/components/motion/Reveal';
import { cn } from '@/lib/cn';

export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cn('label-micro text-accent', className)}>{children}</p>;
}

interface SectionHeadingProps {
  eyebrow?: string;
  title: string;
  text?: string;
  as?: ElementType;
  align?: 'left' | 'center';
  className?: string;
  size?: 'm' | 'l';
}

/** Cabecera de sección: etiqueta + titular serif con revelado por palabras + texto. */
export function SectionHeading({ eyebrow, title, text, as = 'h2', align = 'left', className, size = 'l' }: SectionHeadingProps) {
  return (
    <div className={cn('max-w-3xl', align === 'center' && 'mx-auto text-center', className)}>
      {eyebrow && <Eyebrow className="mb-5">{eyebrow}</Eyebrow>}
      <StaggerText as={as} text={title} className={cn('font-display', size === 'l' ? 'text-display-l' : 'text-display-m')} />
      {text && <p className="mt-6 max-w-xl text-lead text-fg-muted">{text}</p>}
    </div>
  );
}

/** Banda de sección con ritmo vertical consistente. `tone` cambia el contexto de color de toda la banda. */
export function Section({ children, tone, className, id, headerTone }: { children: ReactNode; tone?: 'ink' | 'evergreen' | 'sunken'; className?: string; id?: string; headerTone?: 'light' | 'dark' }) {
  return (
    <section
      id={id}
      data-tone={tone === 'sunken' ? undefined : tone}
      data-header-tone={headerTone ?? (tone === 'ink' || tone === 'evergreen' ? 'light' : 'dark')}
      className={cn('bg-surface py-20 text-fg md:py-28 lg:py-36', tone === 'sunken' && 'bg-surface-sunken', className)}
    >
      {children}
    </section>
  );
}
