import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { TransitionLink } from '@/components/motion/TransitionLink';
import type { TransitionVariant } from '@/components/motion/PageTransition';
import { cn } from '@/lib/cn';

type Variant = 'solid' | 'outline' | 'ghost' | 'link';
type Size = 'sm' | 'md' | 'lg';

const variants: Record<Variant, string> = {
  solid: 'bg-fg text-surface border border-fg hover:bg-transparent hover:text-fg',
  outline: 'border border-line-strong text-fg hover:bg-fg hover:text-surface hover:border-fg',
  ghost: 'text-fg hover:bg-fg/5 border border-transparent',
  link: 'link-underline text-fg border-0 px-0 !min-h-0 !h-auto py-1',
};

const sizes: Record<Size, string> = {
  sm: 'h-10 px-5',
  md: 'h-12 px-7',
  lg: 'h-14 px-9',
};

export function buttonClass(variant: Variant = 'solid', size: Size = 'md', className?: string) {
  return cn(
    'label-micro inline-flex select-none items-center justify-center gap-3 whitespace-nowrap transition-[background-color,color,border-color,opacity] duration-300 ease-[var(--ease-luxe)] disabled:pointer-events-none disabled:opacity-40',
    variants[variant],
    variant !== 'link' && sizes[size],
    className,
  );
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export function Button({ variant, size, className, type = 'button', ...props }: ButtonProps) {
  return <button type={type} className={buttonClass(variant, size, className)} {...props} />;
}

interface ButtonLinkProps {
  href: string;
  children: ReactNode;
  variant?: Variant;
  size?: Size;
  className?: string;
  transition?: TransitionVariant;
  'aria-label'?: string;
}

export function ButtonLink({ href, children, variant, size, className, transition, ...rest }: ButtonLinkProps) {
  return (
    <TransitionLink href={href} variant={transition} className={buttonClass(variant, size, className)} {...rest}>
      {children}
    </TransitionLink>
  );
}
