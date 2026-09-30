'use client';

import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { Logo } from '@/components/brand/Logo';
import { TransitionLink } from '@/components/motion/TransitionLink';
import { CloseIcon } from '@/components/ui/Icon';
import { Dialog } from '@/components/ui/Dialog';
import { useUi } from '@/stores/ui-store';
import { LocaleSwitcher } from './Switchers';
import type { NavData } from './nav-data';

/** Menú editorial a pantalla completa: <dialog> nativo (foco atrapado, Escape, inert) + revelado por máscara. */
export function MenuOverlay({ nav }: { nav: NavData }) {
  const t = useTranslations('header');
  const panel = useUi((s) => s.panel);
  const close = useUi((s) => s.closePanel);
  let i = 0;

  return (
    <Dialog open={panel === 'menu'} onClose={close} side="full" label={t('menuLabel')} lazyContent>
      <div data-tone="ink" className="grid h-full grid-rows-[auto_1fr_auto] bg-surface text-fg">
        <div className="container-x flex h-[var(--header-h)] items-center justify-between">
          <Logo />
          <button type="button" onClick={close} aria-label={t('close')} className="-mr-2 grid h-11 w-11 place-items-center transition-opacity hover:opacity-70">
            <CloseIcon />
          </button>
        </div>

        <div data-lenis-prevent="" className="container-x grid min-h-0 gap-10 overflow-y-auto py-6 lg:grid-cols-[1.4fr_1fr_1fr] lg:items-center lg:gap-16">
          <nav aria-label={t('menuLabel')}>
            <ul className="space-y-1">
              {nav.menuMain.map((l) => (
                <li key={l.href} className="menu-item" style={{ ['--i' as string]: i++ }}>
                  <TransitionLink href={l.href} className="font-display text-display-m block py-1 transition-colors hover:text-accent" variant="curtain">
                    {l.label}
                  </TransitionLink>
                </li>
              ))}
            </ul>
          </nav>

          <div className="space-y-10">
            <div>
              <h2 className="label-micro menu-fade mb-4 text-fg-subtle">{t('shopBy')}</h2>
              <ul className="space-y-2">
                {[...nav.menuTypes, ...nav.menuAudience].map((l) => (
                  <li key={l.href} className="menu-item" style={{ ['--i' as string]: i++ }}>
                    <TransitionLink href={l.href} className="nav-link text-lead">
                      {l.label}
                    </TransitionLink>
                  </li>
                ))}
              </ul>
            </div>
            <div className="menu-fade space-y-3 text-caption text-fg-muted">
              <TransitionLink href="/journal" className="nav-link block w-fit">{t('journal')}</TransitionLink>
              <TransitionLink href="/lookbook" className="nav-link block w-fit">{t('lookbook')}</TransitionLink>
              <TransitionLink href="/about" className="nav-link block w-fit">{t('about')}</TransitionLink>
            </div>
          </div>

          <TransitionLink href={nav.featured.href} variant="clip" className="menu-fade group hidden lg:block">
            <div className="relative aspect-[4/5] overflow-hidden bg-surface-sunken">
              <Image src={nav.featured.image} alt="" fill sizes="26vw" placeholder={nav.featured.blur ? 'blur' : 'empty'} blurDataURL={nav.featured.blur} className="object-cover transition-transform duration-[1400ms] ease-[var(--ease-expo)] group-hover:scale-[1.04]" />
            </div>
            <p className="label-micro mt-4 text-fg-subtle">{t('featured')}</p>
            <p className="font-display text-heading">{nav.featured.label}</p>
          </TransitionLink>
        </div>

        <div className="container-x menu-fade flex flex-wrap items-center justify-between gap-4 border-t border-line py-4">
          <LocaleSwitcher />
        </div>
      </div>
    </Dialog>
  );
}
