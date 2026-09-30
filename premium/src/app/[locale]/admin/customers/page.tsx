import { hasLocale } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import { formatDate } from '@/lib/format';
import { listOrders } from '@/server/repositories/orders';
import { listUsers } from '@/server/repositories/users';

export default async function AdminCustomers({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations('admin');
  const [users, orders] = await Promise.all([listUsers(), listOrders()]);
  return (
    <div>
      <h1 className="font-display text-display-m">{t('tabs.customers')}</h1>
      <ul className="mt-8 divide-y divide-line border-y border-line">
        {users.map((u) => (
          <li key={u.id} className="grid gap-2 py-4 text-caption sm:grid-cols-[2fr_1fr_1fr_1fr]">
            <span>{u.name} <span className="text-fg-muted">· {u.email}</span></span>
            <span className="label-micro text-fg-subtle">{u.role}</span>
            <span className="text-fg-muted">{formatDate(u.createdAt, locale)}</span>
            <span className="tabular">{t('ordersCount', { count: orders.filter((o) => o.userId === u.id).length })}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
