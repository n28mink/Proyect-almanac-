import { hasLocale } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { pick } from '@/domain/i18n';
import { routing } from '@/i18n/routing';
import { formatMoney } from '@/lib/format';
import { getCatalog } from '@/server/repositories/catalog';
import { listOrders } from '@/server/repositories/orders';
import { listUsers } from '@/server/repositories/users';

export default async function AdminDashboard({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations('admin');
  const [orders, users, catalog] = await Promise.all([listOrders(), listUsers(), getCatalog()]);
  const paid = orders.filter((o) => ['paid', 'processing', 'shipped', 'delivered'].includes(o.status));
  const revenue = paid.reduce((s, o) => s + o.total, 0);
  const low = catalog.flatMap((p) => p.variants.filter((v) => v.stock <= 3).map((v) => ({ p, v }))).slice(0, 12);

  const kpis = [
    { label: t('kpi.orders'), value: String(orders.length) },
    { label: t('kpi.revenue'), value: formatMoney(revenue, locale) },
    { label: t('kpi.customers'), value: String(users.filter((u) => u.role === 'customer').length) },
    { label: t('kpi.products'), value: String(catalog.length) },
  ];

  return (
    <div className="space-y-14">
      <h1 className="font-display text-display-m">{t('tabs.dashboard')}</h1>
      <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((k) => (
          <div key={k.label} className="border border-line p-6"><dt className="label-micro text-fg-subtle">{k.label}</dt><dd className="mt-3 font-display text-display-m">{k.value}</dd></div>
        ))}
      </dl>
      <section>
        <h2 className="mb-4 font-display text-heading">{t('lowStock')}</h2>
        {low.length === 0 ? <p className="text-fg-muted">{t('noLowStock')}</p> : (
          <ul className="divide-y divide-line border-y border-line">
            {low.map(({ p, v }) => <li key={v.id} className="flex justify-between gap-4 py-3 text-caption"><span>{pick(p.name, locale)} · {pick(v.options.color, locale)}</span><span className="tabular text-danger">{v.stock}</span></li>)}
          </ul>
        )}
      </section>
    </div>
  );
}
