import Image from 'next/image';
import { TransitionLink } from '@/components/motion/TransitionLink';

export interface Shortcut {
  key: string;
  label: string;
  href: string;
  image: { src: string; blur?: string };
}

/**
 * Atajos redondos bajo el título (como las subcategorías de una tienda de joyería): una foto de la pieza y el nombre.
 * Llevan a otra categoría o aplican un filtro de la URL. En móvil se desplazan en horizontal.
 */
export function ShopShortcuts({ items, label }: { items: Shortcut[]; label: string }) {
  if (items.length < 2) return null;
  return (
    <nav aria-label={label} className="-mx-[var(--gutter)] min-w-0 lg:mx-0 lg:justify-self-end">
      <ul className="flex gap-5 overflow-x-auto px-[var(--gutter)] pb-2 [scrollbar-width:none] lg:gap-7 lg:overflow-visible lg:px-0 lg:pb-0 [&::-webkit-scrollbar]:hidden">
        {items.map((s) => (
          <li key={s.key} className="w-[5.5rem] shrink-0 lg:w-[6.5rem]">
            <TransitionLink href={s.href} className="group flex flex-col items-center gap-3 text-center">
              <span className="relative block aspect-square w-full overflow-hidden rounded-full border border-line bg-surface-sunken transition-[border-color,scale] duration-200 ease-[var(--ease-out)] group-hover:border-accent group-active:scale-[0.97]">
                <Image src={s.image.src} alt="" fill sizes="104px" placeholder={s.image.blur ? 'blur' : 'empty'} blurDataURL={s.image.blur} className="object-cover" />
              </span>
              <span className="text-caption leading-tight text-fg-muted transition-colors group-hover:text-fg">{s.label}</span>
            </TransitionLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
