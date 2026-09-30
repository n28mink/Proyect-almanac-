import type { ReactNode } from 'react';
import { StaggerText } from '@/components/motion/Reveal';
import { cn } from '@/lib/cn';
import { Eyebrow } from './Section';

/** Página interior estándar: compensa la cabecera fija y presenta un titular editorial. */
export function PageShell({ eyebrow, title, text, children, className, narrow = false }: { eyebrow?: string; title: string; text?: string; children?: ReactNode; className?: string; narrow?: boolean }) {
  return (
    <div className="pt-[calc(var(--header-h)+var(--announcement-h))]" data-header-tone="dark">
      <div className={cn('container-x pb-24 pt-14 md:pt-20', narrow && 'max-w-4xl', className)}>
        <header className="mb-12 md:mb-16">
          {eyebrow && <Eyebrow className="mb-4">{eyebrow}</Eyebrow>}
          <StaggerText as="h1" text={title} className="font-display text-display-l" intro />
          {text && <p className="mt-5 max-w-xl text-lead text-fg-muted">{text}</p>}
        </header>
        {children}
      </div>
    </div>
  );
}

export function Field({ label, id, error, children }: { label: string; id: string; error?: string; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="label-micro block text-fg-subtle">{label}</label>
      {children}
      {error && <p role="alert" className="text-caption text-danger">{error}</p>}
    </div>
  );
}
