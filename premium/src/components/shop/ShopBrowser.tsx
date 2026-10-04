'use client';

import { useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { ProductCard } from '@/components/product/ProductCard';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { CloseIcon, FilterIcon, GridIcon, ListIcon, SearchIcon } from '@/components/ui/Icon';
import { formatMoney } from '@/lib/format';
import { sortOptions } from '@/config/taxonomy';
import { usePathname, useRouter } from '@/i18n/navigation';
import type { CardData } from '@/lib/card-data';
import { cn } from '@/lib/cn';
import { activeCount, applyFilters, computeFacets, parseParams, serializeParams, type Facets, type ShopParams } from '@/lib/shop-filter';
import { useLocale } from 'next-intl';
import type { Locale } from '@/i18n/routing';

interface Labels {
  finish: Record<string, string>;
  color: Record<string, string>;
  material: Record<string, string>;
  audience: Record<string, string>;
  collection: Record<string, string>;
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="border-b border-line py-6">
      <legend className="label-micro mb-4 float-left w-full text-fg-subtle">{title}</legend>
      <div className="clear-both space-y-3">{children}</div>
    </fieldset>
  );
}

function CheckRow({ id, label, count, checked, onChange }: { id: string; label: string; count: number; checked: boolean; onChange: () => void }) {
  return (
    <label htmlFor={id} className="flex min-h-11 cursor-pointer items-center gap-3 text-caption">
      <input id={id} type="checkbox" checked={checked} onChange={onChange} className="checkbox" />
      <span className="flex-1">{label}</span>
      <span className="tabular text-fg-subtle">{count}</span>
    </label>
  );
}

function FilterPanel({ params, facets, labels, update }: { params: ShopParams; facets: Facets; labels: Labels; update: (patch: Partial<ShopParams>) => void }) {
  const t = useTranslations('shop');
  const locale = useLocale() as Locale;
  const toggle = (key: 'finish' | 'color' | 'material' | 'audience' | 'collection', value: string) => {
    const cur = params[key];
    update({ [key]: cur.includes(value) ? cur.filter((v) => v !== value) : [...cur, value] } as Partial<ShopParams>);
  };
  const min = params.min ?? facets.price?.min ?? 0;
  const max = params.max ?? facets.price?.max ?? 0;

  return (
    <div>
      <Group title={t('availability')}>
        <label className="flex min-h-11 cursor-pointer items-center gap-3 text-caption">
          <input type="checkbox" className="checkbox" checked={params.inStock} onChange={(e) => update({ inStock: e.target.checked })} />
          {t('inStockOnly')}
        </label>
      </Group>

      {facets.price && (
        <Group title={t('price')}>
          <div className="flex items-baseline justify-between text-caption tabular">
            <span>{formatMoney(min * 100, locale)}</span>
            <span>{formatMoney(max * 100, locale)}</span>
          </div>
          <div className="space-y-4 pt-1">
            <label className="block">
              <span className="sr-only">{t('priceMin')}</span>
              <input type="range" className="range" min={facets.price.min} max={facets.price.max} step={1} value={min} onChange={(e) => update({ min: Math.min(Number(e.target.value), max), max: params.max })} />
            </label>
            <label className="block">
              <span className="sr-only">{t('priceMax')}</span>
              <input type="range" className="range" min={facets.price.min} max={facets.price.max} step={1} value={max} onChange={(e) => update({ max: Math.max(Number(e.target.value), min), min: params.min })} />
            </label>
          </div>
        </Group>
      )}

      {facets.finish.length > 0 && (
        <Group title={t('color')}>
          {facets.finish.map((f) => <CheckRow key={f.value} id={`f-${f.value}`} label={labels.finish[f.value] ?? f.value} count={f.count} checked={params.finish.includes(f.value)} onChange={() => toggle('finish', f.value)} />)}
        </Group>
      )}
      {facets.color.length > 0 && (
        <Group title={t('garmentColor')}>
          {facets.color.map((f) => <CheckRow key={f.value} id={`g-${f.value}`} label={labels.color[f.value] ?? f.value} count={f.count} checked={params.color.includes(f.value)} onChange={() => toggle('color', f.value)} />)}
        </Group>
      )}
      {facets.material.length > 0 && (
        <Group title={t('material')}>
          {facets.material.map((f) => <CheckRow key={f.value} id={`m-${f.value}`} label={labels.material[f.value] ?? f.value} count={f.count} checked={params.material.includes(f.value)} onChange={() => toggle('material', f.value)} />)}
        </Group>
      )}
      {facets.audience.length > 0 && (
        <Group title={t('gender')}>
          {facets.audience.map((f) => <CheckRow key={f.value} id={`a-${f.value}`} label={labels.audience[f.value] ?? f.value} count={f.count} checked={params.audience.includes(f.value)} onChange={() => toggle('audience', f.value)} />)}
        </Group>
      )}
      {facets.collection.length > 0 && (
        <Group title={t('collection')}>
          {facets.collection.map((f) => <CheckRow key={f.value} id={`c-${f.value}`} label={labels.collection[f.value] ?? f.value} count={f.count} checked={params.collection.includes(f.value)} onChange={() => toggle('collection', f.value)} />)}
        </Group>
      )}
    </div>
  );
}

/**
 * Catálogo avanzado: búsqueda, filtros, orden y vista (todo en la URL, compartible). Filtra sobre la lista ya renderizada,
 * por lo que la página base sigue siendo estática. Móvil: filtros en bottom sheet. Facetas con <2 opciones se ocultan.
 */
export function ShopBrowser({ products, labels }: { products: CardData[]; labels: Labels }) {
  const t = useTranslations('shop');
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const [sheet, setSheet] = useState(false);
  const params = useMemo(() => parseParams(new URLSearchParams(sp.toString())), [sp]);
  const facets = useMemo(() => computeFacets(products), [products]);
  const results = useMemo(() => applyFilters(products, params), [products, params]);
  const count = activeCount(params);

  const update = (patch: Partial<ShopParams>) => {
    const qs = serializeParams({ ...params, ...patch });
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };
  const clear = () => update({ q: '', min: undefined, max: undefined, finish: [], color: [], material: [], audience: [], collection: [], inStock: false });

  const chips: Array<{ key: string; label: string; remove: () => void }> = [
    ...(params.q ? [{ key: 'q', label: `“${params.q}”`, remove: () => update({ q: '' }) }] : []),
    ...(params.min !== undefined || params.max !== undefined ? [{ key: 'price', label: `$${params.min ?? facets.price?.min ?? 0}–$${params.max ?? facets.price?.max ?? ''}`, remove: () => update({ min: undefined, max: undefined }) }] : []),
    ...params.finish.map((v) => ({ key: `f${v}`, label: labels.finish[v] ?? v, remove: () => update({ finish: params.finish.filter((x) => x !== v) }) })),
    ...params.color.map((v) => ({ key: `g${v}`, label: labels.color[v] ?? v, remove: () => update({ color: params.color.filter((x) => x !== v) }) })),
    ...params.material.map((v) => ({ key: `m${v}`, label: labels.material[v] ?? v, remove: () => update({ material: params.material.filter((x) => x !== v) }) })),
    ...params.audience.map((v) => ({ key: `a${v}`, label: labels.audience[v] ?? v, remove: () => update({ audience: params.audience.filter((x) => x !== v) }) })),
    ...params.collection.map((v) => ({ key: `c${v}`, label: labels.collection[v] ?? v, remove: () => update({ collection: params.collection.filter((x) => x !== v) }) })),
    ...(params.inStock ? [{ key: 'stock', label: t('inStockOnly'), remove: () => update({ inStock: false }) }] : []),
  ];

  return (
    <div className="container-x pb-24">
      <div className="sticky top-[var(--header-h)] z-20 -mx-[var(--gutter)] mb-6 flex flex-wrap items-center gap-3 border-y border-line bg-surface/95 px-[var(--gutter)] py-3 backdrop-blur-md lg:top-[calc(var(--header-h))]">
        <div className="relative min-w-[10rem] flex-1 sm:max-w-xs">
          <SearchIcon width={18} height={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-fg-subtle" />
          <label htmlFor="shop-q" className="sr-only">{t('search')}</label>
          <input id="shop-q" type="search" value={params.q} onChange={(e) => update({ q: e.target.value })} placeholder={t('search')} className="field !min-h-11 !pl-10" />
        </div>
        <Button variant="outline" size="sm" onClick={() => setSheet(true)} className="lg:hidden" aria-haspopup="dialog">
          <FilterIcon width={16} height={16} />
          {t('filters')}{count > 0 ? ` (${count})` : ''}
        </Button>
        <p className="ml-auto text-caption text-fg-muted" role="status" aria-live="polite">{t('results', { count: results.length })}</p>
        <label className="flex items-center gap-2">
          <span className="label-micro hidden text-fg-subtle sm:inline">{t('sortBy')}</span>
          <select value={params.sort} onChange={(e) => update({ sort: e.target.value as ShopParams['sort'] })} className="field !min-h-11 !w-auto text-caption" aria-label={t('sortBy')}>
            {sortOptions.map((s) => <option key={s} value={s}>{t(`sort.${s}`)}</option>)}
          </select>
        </label>
        <div className="hidden items-center sm:flex" role="group" aria-label={t('view')}>
          {(['grid', 'list'] as const).map((v) => (
            <button key={v} type="button" onClick={() => update({ view: v })} aria-pressed={params.view === v} aria-label={t(`view_${v}`)} className={cn('grid h-11 w-11 place-items-center border border-line-strong transition-colors', params.view === v ? 'bg-accent text-surface' : 'hover:bg-fg/5')}>
              {v === 'grid' ? <GridIcon width={18} height={18} /> : <ListIcon width={18} height={18} />}
            </button>
          ))}
        </div>
      </div>

      {chips.length > 0 && (
        <ul className="mb-6 flex flex-wrap items-center gap-2" aria-label={t('activeFilters')}>
          {chips.map((c) => (
            <li key={c.key}>
              <button type="button" onClick={c.remove} className="label-micro flex items-center gap-2 border border-line-strong px-3 py-2 transition-colors hover:bg-fg hover:text-surface" aria-label={t('removeFilter', { name: c.label })}>
                {c.label}<CloseIcon width={14} height={14} />
              </button>
            </li>
          ))}
          <li><button type="button" onClick={clear} className="label-micro link-underline ml-2">{t('clearAll')}</button></li>
        </ul>
      )}

      <div className="grid gap-12 lg:grid-cols-[15rem_1fr] xl:grid-cols-[17rem_1fr]">
        <aside className="hidden lg:block" aria-label={t('filters')}>
          <div className="sticky top-[calc(var(--header-h)+6rem)] max-h-[calc(100dvh-var(--header-h)-8rem)] overflow-y-auto pr-4" data-lenis-prevent="">
            <FilterPanel params={params} facets={facets} labels={labels} update={update} />
          </div>
        </aside>

        <div>
          {results.length === 0 ? (
            <div className="grid place-items-center gap-5 py-24 text-center">
              <p className="font-display text-display-m">{t('emptyTitle')}</p>
              <p className="max-w-sm text-fg-muted">{t('emptyText')}</p>
              <Button variant="outline" onClick={clear}>{t('clearAll')}</Button>
            </div>
          ) : (
            <ul className={cn(params.view === 'list' ? 'grid gap-10' : 'grid grid-cols-2 gap-x-3 gap-y-12 md:grid-cols-3 md:gap-x-6 xl:grid-cols-4')}>
              {results.map((p, i) => (
                <li key={p.id}>
                  <ProductCard p={p} priority={i < 4} layout={params.view} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <Dialog open={sheet} onClose={() => setSheet(false)} side="bottom" label={t('filters')} lazyContent>
        <div className="flex max-h-[90dvh] flex-col">
          <div className="flex items-center justify-between border-b border-line px-6 py-4">
            <h2 className="font-display text-heading">{t('filters')}</h2>
            <button type="button" onClick={() => setSheet(false)} aria-label={t('close')} className="grid h-11 w-11 place-items-center"><CloseIcon /></button>
          </div>
          <div className="flex-1 overflow-y-auto px-6" data-lenis-prevent=""><FilterPanel params={params} facets={facets} labels={labels} update={update} /></div>
          <div className="flex gap-3 border-t border-line bg-surface-raised px-6 py-4">
            <Button variant="outline" className="flex-1" onClick={clear}>{t('clearAll')}</Button>
            <Button className="flex-1" onClick={() => setSheet(false)}>{t('showResults', { count: results.length })}</Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
