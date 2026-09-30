import { hasLocale } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { pick } from '@/domain/i18n';
import { routing } from '@/i18n/routing';
import { updateProductAction } from '@/server/actions/admin';
import { baseCatalog, getOverrides, applyOverride } from '@/server/repositories/catalog';

export default async function AdminProducts({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations('admin');
  const overrides = await getOverrides();
  // Incluye los ocultos: el admin debe poder volver a publicarlos.
  const rows = baseCatalog().map((p) => ({ base: p, live: applyOverride(p, { ...overrides[p.id], hidden: false }) ?? p, hidden: !!overrides[p.id]?.hidden }));

  return (
    <div>
      <h1 className="font-display text-display-m">{t('tabs.products')}</h1>
      <p className="mb-8 mt-3 max-w-2xl text-fg-muted">{t('productsText')}</p>
      <ul className="divide-y divide-line border-y border-line">
        {rows.map(({ live, hidden }) => (
          <li key={live.id} className="py-5">
            <form action={updateProductAction} className="grid items-center gap-4 lg:grid-cols-[2fr_7rem_1.4fr_auto_auto]">
              <input type="hidden" name="id" value={live.id} />
              <div><p className="font-display text-lead leading-tight">{pick(live.name, locale)}</p><p className="label-micro text-fg-subtle">{live.id} · {live.category}</p></div>
              <label className="text-caption"><span className="label-micro block text-fg-subtle">{t('price')} (USD)</span><input name="price" type="number" step="0.01" min="0" defaultValue={(live.price / 100).toFixed(2)} className="field !min-h-10" /></label>
              <div className="flex flex-wrap gap-3">
                {live.variants.map((v) => (
                  <label key={v.id} className="text-caption"><span className="label-micro block max-w-[8rem] truncate text-fg-subtle" title={pick(v.options.color, locale)}>{t('stock')} · {pick(v.options.color, locale)}</span><input name={`stock:${v.id}`} type="number" min="0" step="1" defaultValue={v.stock} className="field !min-h-10 !w-24" /></label>
                ))}
              </div>
              <div className="flex flex-wrap gap-x-5 gap-y-2 text-caption">
                {(['featured', 'newArrival', 'bestseller', 'hidden'] as const).map((f) => (
                  <label key={f} className="flex items-center gap-2"><input type="checkbox" name={f} defaultChecked={f === 'hidden' ? hidden : live[f]} className="checkbox" />{t(`flag.${f}`)}</label>
                ))}
              </div>
              <Button type="submit" variant="outline" size="sm">{t('save')}</Button>
            </form>
          </li>
        ))}
      </ul>
    </div>
  );
}
