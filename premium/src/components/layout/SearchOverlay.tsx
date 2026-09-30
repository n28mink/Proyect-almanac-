'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { TransitionLink } from '@/components/motion/TransitionLink';
import { CloseIcon, SearchIcon } from '@/components/ui/Icon';
import { Dialog } from '@/components/ui/Dialog';
import { Price } from '@/components/ui/Price';
import { useRouter } from '@/i18n/navigation';
import { searchProductsAction, type SearchHit } from '@/server/actions/search';
import { useUi } from '@/stores/ui-store';
import type { NavLink } from './nav-data';

/** Búsqueda en panel superior: resultados en vivo desde el servidor (con rate limit) y salto a /shop?q= con Enter. */
export function SearchOverlay({ suggestions }: { suggestions: NavLink[] }) {
  const t = useTranslations('search');
  const locale = useLocale();
  const router = useRouter();
  const panel = useUi((s) => s.panel);
  const close = useUi((s) => s.closePanel);
  const open = panel === 'search';
  const [q, setQ] = useState('');
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [loading, setLoading] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const seq = useRef(0);

  useEffect(() => {
    if (open) setTimeout(() => input.current?.focus(), 120);
    else {
      setQ('');
      setHits([]);
    }
  }, [open]);

  useEffect(() => {
    if (q.trim().length < 2) {
      setHits([]);
      setLoading(false);
      return;
    }
    const id = ++seq.current;
    setLoading(true);
    const timer = setTimeout(async () => {
      const res = await searchProductsAction(q, locale).catch(() => []);
      if (id !== seq.current) return;
      setHits(res);
      setLoading(false);
    }, 180);
    return () => clearTimeout(timer);
  }, [q, locale]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const term = q.trim();
    if (!term) return;
    close();
    router.push(`/shop?q=${encodeURIComponent(term)}`);
  };

  const chips = (
    <ul className="flex flex-wrap gap-3">
      {suggestions.map((s) => (
        <li key={s.href}>
          <TransitionLink href={s.href} className="inline-flex min-h-11 items-center border border-line-strong px-4 text-caption font-medium transition-colors hover:bg-accent hover:text-surface active:bg-accent active:text-surface">
            {s.label}
          </TransitionLink>
        </li>
      ))}
    </ul>
  );

  return (
    <Dialog open={open} onClose={close} side="top" label={t('label')} lazyContent>
      <div className="container-x pb-8 pt-4">
        <form onSubmit={submit} role="search" className="flex items-center gap-3 border-b border-line-strong">
          <SearchIcon className="shrink-0 text-fg-muted" />
          <input
            ref={input}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            type="search"
            name="q"
            autoComplete="off"
            enterKeyHint="search"
            placeholder={t('placeholder')}
            aria-label={t('label')}
            className="font-display text-display-m min-w-0 flex-1 bg-transparent py-4 outline-none placeholder:text-fg-subtle"
          />
          <button type="button" onClick={close} aria-label={t('close')} className="grid h-11 w-11 place-items-center transition-[opacity,scale] duration-150 ease-[var(--ease-out)] hover:opacity-70 active:scale-90">
            <CloseIcon />
          </button>
        </form>

        <div data-lenis-prevent="" className="mt-6 max-h-[60dvh] overflow-y-auto" aria-live="polite">
          {q.trim().length < 2 ? (
            <div>
              <p className="mb-4 text-caption font-medium text-fg-muted">{t('popular')}</p>
              {chips}
            </div>
          ) : loading && hits.length === 0 ? (
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-hidden="true">
              {Array.from({ length: 4 }).map((_, k) => (
                <li key={k} className="skeleton h-24" />
              ))}
            </ul>
          ) : hits.length === 0 ? (
            <div>
              <p className="mb-4 text-fg-muted">{t('empty', { query: q })}</p>
              {chips}
            </div>
          ) : (
            <ul className="grid gap-x-8 gap-y-2 sm:grid-cols-2 lg:grid-cols-4">
              {hits.map((h) => (
                <li key={h.id}>
                  <TransitionLink href={`/product/${h.slug}`} className="group flex items-center gap-4 py-3">
                    <span className="relative h-20 w-16 shrink-0 overflow-hidden bg-surface-sunken">
                      <Image src={h.image} alt="" fill sizes="64px" className="object-cover" />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate font-display text-lead leading-tight group-hover:text-accent">{h.name}</span>
                      <Price cents={h.price} className="text-caption text-fg-muted" />
                    </span>
                  </TransitionLink>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Dialog>
  );
}
