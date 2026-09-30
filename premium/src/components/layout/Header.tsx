'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Logo } from '@/components/brand/Logo';
import { useFlyToCart } from '@/components/motion/fly-to-cart';
import { TransitionLink } from '@/components/motion/TransitionLink';
import { BagIcon, HeartIcon, MenuIcon, SearchIcon } from '@/components/ui/Icon';
import { usePathname } from '@/i18n/navigation';
import { cn } from '@/lib/cn';
import { usePrefersReducedMotion } from '@/lib/hooks';
import { useCart } from '@/stores/cart-store';
import { useUi } from '@/stores/ui-store';
import { useWishlist } from '@/stores/wishlist-store';
import type { NavLink } from './nav-data';

interface HeaderProps {
  announcements: string[];
  primary: NavLink[];
}

function Announcement({ messages }: { messages: string[] }) {
  const [i, setI] = useState(0);
  const reduced = usePrefersReducedMotion();
  useEffect(() => {
    if (reduced || messages.length < 2) return;
    const id = setInterval(() => setI((n) => (n + 1) % messages.length), 5200);
    return () => clearInterval(id);
  }, [messages.length, reduced]);
  return (
    <p key={i} className="label-micro intro-fade text-center" style={{ letterSpacing: '0.18em' }}>
      {messages[i]}
    </p>
  );
}

function IconButton({ label, children, badge, className, ...rest }: { label: string; children: React.ReactNode; badge?: number } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button type="button" aria-label={label} className={cn('relative grid h-11 w-11 place-items-center transition-opacity hover:opacity-70', className)} {...rest}>
      {children}
      {badge !== undefined && badge > 0 && (
        <span data-cart-badge="" className="absolute right-0.5 top-1 grid min-h-[1.05rem] min-w-[1.05rem] place-items-center rounded-full bg-accent-decor px-1 text-[0.625rem] font-semibold leading-none text-ink">
          {badge}
        </span>
      )}
    </button>
  );
}

export function Header({ announcements, primary }: HeaderProps) {
  const t = useTranslations('header');
  const pathname = usePathname();
  const openPanel = useUi((s) => s.openPanel);
  const cartCount = useCart((s) => s.lines.reduce((n, l) => n + l.quantity, 0));
  const wishCount = useWishlist((s) => s.ids.length);
  const { registerAnchor } = useFlyToCart();
  const [solid, setSolid] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [tone, setTone] = useState<'light' | 'dark'>('dark');
  const cartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    registerAnchor(cartRef.current);
    return () => registerAnchor(null);
  }, [registerAnchor]);

  // Cabecera transparente sobre el hero → sólida al hacer scroll; contraste según la sección que hay debajo; se oculta al bajar.
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
      let next: 'light' | 'dark' = 'dark';
      document.querySelectorAll<HTMLElement>('[data-header-tone]').forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.top <= 48 && r.bottom > 48) next = el.dataset.headerTone === 'light' ? 'light' : 'dark';
      });
      setTone(next);
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

  return (
    <header className="site-header" data-solid={solid} data-hidden={hidden} data-tone={tone} style={{ height: 'auto' }}>
      <div className={cn('grid overflow-hidden bg-forest text-ivory transition-[grid-template-rows] duration-500 ease-[var(--ease-luxe)]', solid ? 'grid-rows-[0fr]' : 'grid-rows-[1fr]')}>
        <div className="min-h-0">
          <div className="flex h-[var(--announcement-h)] items-center justify-center px-4">
            <Announcement messages={announcements} />
          </div>
        </div>
      </div>

      <div className="container-x grid h-[var(--header-h)] grid-cols-[1fr_auto_1fr] items-center">
        <div className="flex items-center gap-1 lg:gap-7">
          <button type="button" onClick={() => openPanel('menu')} aria-haspopup="dialog" className="label-micro -ml-2 flex h-11 items-center gap-3 px-2 transition-opacity hover:opacity-70">
            <MenuIcon />
            <span className="hidden sm:inline">{t('menu')}</span>
          </button>
          <nav aria-label={t('primaryNav')} className="hidden items-center gap-7 lg:flex">
            {primary.map((l) => (
              <TransitionLink key={l.href} href={l.href} className="nav-link label-micro" aria-current={pathname === l.href ? 'page' : undefined}>
                {l.label}
              </TransitionLink>
            ))}
          </nav>
        </div>

        <TransitionLink href="/" aria-label={t('home')} className="justify-self-center" variant="ivory">
          <Logo stacked />
        </TransitionLink>

        <div ref={cartRef} className="flex items-center justify-end">
          <IconButton label={t('search')} onClick={() => openPanel('search')} aria-haspopup="dialog">
            <SearchIcon />
          </IconButton>
          <TransitionLink href="/wishlist" aria-label={t('wishlist', { count: wishCount })} className="relative grid h-11 w-11 place-items-center transition-opacity hover:opacity-70">
            <HeartIcon filled={wishCount > 0} />
            {wishCount > 0 && <span className="absolute right-0.5 top-1 grid min-h-[1.05rem] min-w-[1.05rem] place-items-center rounded-full bg-accent-decor px-1 text-[0.625rem] font-semibold leading-none text-ink">{wishCount}</span>}
          </TransitionLink>
          <IconButton label={t('cart', { count: cartCount })} onClick={() => openPanel('cart')} aria-haspopup="dialog" badge={cartCount}>
            <BagIcon />
          </IconButton>
        </div>
      </div>
    </header>
  );
}
