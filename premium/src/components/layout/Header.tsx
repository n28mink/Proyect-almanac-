'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Logo } from '@/components/brand/Logo';
import { useFlyToCart } from '@/components/motion/fly-to-cart';
import { TransitionLink } from '@/components/motion/TransitionLink';
import { BagIcon, HeartIcon, MenuIcon, SearchIcon } from '@/components/ui/Icon';
import { usePathname } from '@/i18n/navigation';
import { cn } from '@/lib/cn';
import { useCart } from '@/stores/cart-store';
import { useUi } from '@/stores/ui-store';
import { useWishlist } from '@/stores/wishlist-store';
import type { NavLink } from './nav-data';

interface HeaderProps {
  primary: NavLink[];
}

function IconButton({ label, children, badge, className, ...rest }: { label: string; children: React.ReactNode; badge?: number } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button type="button" aria-label={label} className={cn('relative grid h-11 w-11 place-items-center transition-[opacity,scale] duration-150 ease-[var(--ease-out)] hover:opacity-70 active:scale-90', className)} {...rest}>
      {children}
      {badge !== undefined && badge > 0 && (
        <span data-cart-badge="" className="absolute right-0.5 top-1 grid min-h-[1.05rem] min-w-[1.05rem] place-items-center rounded-full bg-accent-decor px-1 text-[0.625rem] font-semibold leading-none text-ink">
          {badge}
        </span>
      )}
    </button>
  );
}

export function Header({ primary }: HeaderProps) {
  const t = useTranslations('header');
  const pathname = usePathname();
  const openPanel = useUi((s) => s.openPanel);
  const cartCount = useCart((s) => s.lines.reduce((n, l) => n + l.quantity, 0));
  const wishCount = useWishlist((s) => s.ids.length);
  const { registerAnchor } = useFlyToCart();
  const [solid, setSolid] = useState(false);
  const [hidden, setHidden] = useState(false);
  const cartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    registerAnchor(cartRef.current);
    return () => registerAnchor(null);
  }, [registerAnchor]);

  // Cabecera en verde de marca; gana sombra al hacer scroll y se oculta al bajar.
  useEffect(() => {
    let last = window.scrollY;
    let queued = false;
    const run = () => {
      queued = false;
      const y = window.scrollY;
      setSolid(y > 40);
      if (y > 560 && y > last + 6) setHidden(true);
      else if (y < last - 6 || y <= 560) setHidden(false);
      last = y;
    };
    const onScroll = () => {
      if (!queued) {
        queued = true;
        requestAnimationFrame(run);
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    window.addEventListener('load', onScroll);
    // El layout puede moverse tras hidratar (fuentes, imágenes, vídeo): recalcula al cambiar el tamaño del documento.
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(onScroll) : null;
    ro?.observe(document.body);
    run();
    const late = window.setTimeout(run, 500);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      window.removeEventListener('load', onScroll);
      ro?.disconnect();
      clearTimeout(late);
    };
  }, [pathname]);

  // Barras pegajosas (p. ej. filtros de la tienda) suben al borde cuando la cabecera se oculta al bajar.
  useEffect(() => {
    document.documentElement.toggleAttribute('data-header-hidden', hidden);
  }, [hidden]);

  const menuButton = (className: string, label: boolean) => (
    <button type="button" onClick={() => openPanel('menu')} aria-haspopup="dialog" aria-label={t('menu')} className={cn('label-micro flex h-11 min-w-11 items-center justify-center gap-3 px-2 transition-[opacity,scale] duration-150 ease-[var(--ease-out)] hover:opacity-70 active:scale-90', className)}>
      <MenuIcon />
      {label && <span className="hidden sm:inline lg:inline">{t('menu')}</span>}
    </button>
  );

  return (
    <header className="site-header" data-solid={solid} data-hidden={hidden} style={{ height: 'auto' }}>
      <div className="container-x grid h-[var(--header-row-h)] grid-cols-[1fr_auto_1fr] items-center">
        <div className="flex items-center">{menuButton('-ml-2 lg:hidden', true)}</div>

        <TransitionLink href="/" aria-label={t('home')} className="flex justify-self-center" variant="ivory">
          <Logo stacked />
        </TransitionLink>

        <div ref={cartRef} className="flex items-center justify-end">
          <IconButton label={t('search')} onClick={() => openPanel('search')} aria-haspopup="dialog">
            <SearchIcon />
          </IconButton>
          <TransitionLink href="/wishlist" aria-label={t('wishlist', { count: wishCount })} className="relative grid h-11 w-11 place-items-center transition-[opacity,scale] duration-150 ease-[var(--ease-out)] hover:opacity-70 active:scale-90">
            <HeartIcon filled={wishCount > 0} />
            {wishCount > 0 && <span className="absolute right-0.5 top-1 grid min-h-[1.05rem] min-w-[1.05rem] place-items-center rounded-full bg-accent-decor px-1 text-[0.625rem] font-semibold leading-none text-ink">{wishCount}</span>}
          </TransitionLink>
          <IconButton label={t('cart', { count: cartCount })} onClick={() => openPanel('cart')} aria-haspopup="dialog" badge={cartCount}>
            <BagIcon />
          </IconButton>
        </div>
      </div>

      {/* Escritorio: el menú y las secciones van en su propia fila, debajo de la marca. */}
      <nav aria-label={t('primaryNav')} className="site-header-nav hidden h-[var(--header-nav-h)] items-center justify-center gap-10 lg:flex">
        {menuButton('', true)}
        {primary.map((l) => (
          <TransitionLink key={l.href} href={l.href} className="nav-link label-micro" aria-current={pathname === l.href ? 'page' : undefined}>
            {l.label}
          </TransitionLink>
        ))}
      </nav>
    </header>
  );
}
