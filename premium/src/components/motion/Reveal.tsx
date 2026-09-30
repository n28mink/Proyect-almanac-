'use client';

import { createElement, type CSSProperties, type ElementType, type ReactNode } from 'react';
import { useRevealOnce } from '@/lib/hooks';

type Variant = 'up' | 'fade' | 'left' | 'right' | 'scale' | 'mask';

interface RevealProps {
  as?: ElementType;
  variant?: Variant;
  /** ms */
  delay?: number;
  /** ms */
  duration?: number;
  className?: string;
  children?: ReactNode;
  id?: string;
}

const style = (delay?: number, duration?: number): CSSProperties =>
  ({ '--reveal-delay': delay ? `${delay}ms` : undefined, '--reveal-dur': duration ? `${duration}ms` : undefined }) as CSSProperties;

/** Aparición al entrar en viewport. Sin JS o con reduced-motion el contenido es visible desde el primer pintado. */
export function FadeReveal({ as = 'div', variant = 'up', delay, duration, className, children, id }: RevealProps) {
  const ref = useRevealOnce<HTMLElement>();
  return createElement(as, { ref, id, className, 'data-reveal': variant, style: style(delay, duration) }, children);
}

/** Revelado con máscara (clip-path) — titulares y bloques de texto. */
export function MaskReveal(props: Omit<RevealProps, 'variant'>) {
  return <FadeReveal {...props} variant="mask" />;
}

/** El contenedor recorta y la imagen "aterriza" con escala. El hijo directo debe ocupar el 100 %. */
export function ImageReveal({ className, children, delay, duration }: Pick<RevealProps, 'className' | 'children' | 'delay' | 'duration'>) {
  const ref = useRevealOnce<HTMLDivElement>();
  return (
    <div ref={ref} data-image-reveal="" className={className} style={style(delay, duration)}>
      {children}
    </div>
  );
}

interface StaggerTextProps {
  text: string;
  as?: ElementType;
  className?: string;
  delay?: number;
  /** Sobre el pliegue: anima con CSS puro al pintar (no depende de hidratar ni de scroll). */
  intro?: boolean;
}

/** Texto por palabras que sube desde una máscara. Conserva el texto completo para lectores de pantalla. */
export function StaggerText({ text, as = 'span', className, delay, intro }: StaggerTextProps) {
  const ref = useRevealOnce<HTMLElement>();
  const lines = text.split('\n');
  let i = 0;
  return createElement(
    as,
    { ref, className: [className, intro ? 'split-intro' : ''].filter(Boolean).join(' '), 'data-split': '', ...(intro ? { 'data-in': '' } : {}), style: style(delay) },
    <span className="sr-only">{text.replace(/\n/g, ' ')}</span>,
    <span aria-hidden="true">
      {lines.map((line, li) => (
        <span key={li} className="block">
          {line.split(' ').map((word, wi) => (
            <span key={wi}>
              <span className="split-word">
                <span className="split-inner" style={{ '--i': i++ } as CSSProperties}>
                  {word}
                </span>
              </span>{' '}
            </span>
          ))}
        </span>
      ))}
    </span>,
  );
}
