import { hasLocale } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { AddressForm } from '@/components/account/AddressForm';
import { Button } from '@/components/ui/Button';
import { routing } from '@/i18n/routing';
import { removeAddressAction } from '@/server/actions/account';
import { requireUser } from '@/server/auth/guards';
import { findById } from '@/server/repositories/users';

export default async function AddressesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const user = await requireUser(locale, '/account/addresses');
  const t = await getTranslations('account');
  const full = await findById(user.id);
  const names = new Intl.DisplayNames([locale], { type: 'region' });

  return (
    <div>
      <h1 className="font-display text-display-m">{t('tabs.addresses')}</h1>
      <ul className="mt-10 grid gap-4 sm:grid-cols-2">
        {(full?.addresses ?? []).map((a) => (
          <li key={a.id} className="flex flex-col justify-between gap-4 border border-line p-6">
            <address className="not-italic text-fg-muted">
              {a.isDefault && <span className="label-micro mb-2 block text-accent">{t('addr.default')}</span>}
              <span className="block text-fg">{a.label ? `${a.label} · ` : ''}{a.fullName}</span>
              {a.line1}{a.line2 ? `, ${a.line2}` : ''}<br />{a.city}{a.region ? `, ${a.region}` : ''} {a.postalCode}<br />{names.of(a.country)}{a.phone ? ` · ${a.phone}` : ''}
            </address>
            <form action={removeAddressAction}><input type="hidden" name="id" value={a.id} /><Button type="submit" variant="ghost" size="sm" className="!px-0">{t('addr.remove')}</Button></form>
          </li>
        ))}
      </ul>
      {(full?.addresses.length ?? 0) === 0 && <p className="mt-6 text-fg-muted">{t('addr.none')}</p>}
      <h2 className="mb-6 mt-16 font-display text-heading">{t('addr.newTitle')}</h2>
      <AddressForm />
    </div>
  );
}
