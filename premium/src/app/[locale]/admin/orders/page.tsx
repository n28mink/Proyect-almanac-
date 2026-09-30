import { hasLocale } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { orderStatusSchema } from '@/domain/commerce';
import { pick } from '@/domain/i18n';
import { routing } from '@/i18n/routing';
import { formatDate, formatMoney } from '@/lib/format';
import { updateOrderStatusAction } from '@/server/actions/admin';
import { listOrders } from '@/server/repositories/orders';

export default async function AdminOrders({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations('admin');
  const orders = await listOrders();

  return (
    <div>
      <h1 className="font-display text-display-m">{t('tabs.orders')}</h1>
      {orders.length === 0 ? <p className="mt-8 text-fg-muted">{t('noOrders')}</p> : (
        <ul className="mt-8 divide-y divide-line border-y border-line">
          {orders.map((o) => (
            <li key={o.id} className="grid items-center gap-4 py-5 lg:grid-cols-[1fr_2fr_auto_auto]">
              <div><p className="font-display text-lead">{o.number}</p><p className="text-caption text-fg-muted">{formatDate(o.createdAt, locale)} · {o.email}</p></div>
              <p className="text-caption text-fg-muted">{o.lines.map((l) => `${pick(l.name, locale)} ×${l.quantity}`).join(' · ')}</p>
              <p className="tabular">{formatMoney(o.total, locale)}</p>
              <form action={updateOrderStatusAction} className="flex items-center gap-2">
                <input type="hidden" name="id" value={o.id} />
                <select name="status" defaultValue={o.status} className="field !min-h-10 !w-auto text-caption" aria-label={t('status')}>
                  {orderStatusSchema.options.map((s) => <option key={s} value={s}>{t(`orderStatus.${s}`)}</option>)}
                </select>
                <Button type="submit" variant="outline" size="sm">{t('save')}</Button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
